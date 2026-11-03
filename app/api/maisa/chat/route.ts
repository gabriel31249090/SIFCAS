import { NextRequest } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { buildMaisaContext } from "@/lib/maisa/context";
import { answerWithLocalMaisa } from "@/lib/maisa/local";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 12000;
const MAX_MEMORY_TURNS = 12;
const MAX_MEMORY_CHARS_PER_TURN = 1800;

const memoryStore = new Map<string, { updatedAt: number; messages: { role: "user" | "assistant"; content: string; createdAt: string }[] }>();

type ChatRequestBody = { query?: unknown; conversationId?: unknown };

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function getConversationKey(accountId: string, conversationId: string) {
  return `${accountId}:${conversationId}`;
}

function readConversationMemory(accountId: string, conversationId: string) {
  if (!conversationId) return [] as { role: "user" | "assistant"; content: string; createdAt: string }[];
  return memoryStore.get(getConversationKey(accountId, conversationId))?.messages ?? [];
}

function storeConversationMemory(accountId: string, conversationId: string, messages: { role: "user" | "assistant"; content: string; createdAt: string }[]) {
  const trimmed = messages.slice(-MAX_MEMORY_TURNS).map((message) => ({
    ...message,
    content: message.content.slice(0, MAX_MEMORY_CHARS_PER_TURN),
  }));
  memoryStore.set(getConversationKey(accountId, conversationId), { updatedAt: Date.now(), messages: trimmed });
}

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Faça login para conversar com a LUMA.", 401);
  if (account.accountStatus !== "active") return jsonError("Seu vínculo precisa estar ativo para usar a LUMA.", 403);

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return jsonError("Origem da requisição não permitida.", 403);

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonError("Corpo da requisição inválido.", 400);
  }

  const conversationId = typeof body.conversationId === "string" && body.conversationId.trim() ? body.conversationId.trim() : crypto.randomUUID();
  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return jsonError("Digite uma mensagem para a LUMA.", 400);
  if (query.length > MAX_QUERY_LENGTH) return jsonError("A mensagem deve ter no máximo " + MAX_QUERY_LENGTH + " caracteres.", 400);

  try {
    const history = readConversationMemory(account.id, conversationId);
    const context = await buildMaisaContext(account, query, { conversationId, history });
    const answer = await answerWithLocalMaisa(account, query, context, history);
    const encoder = new TextEncoder();
    const nextHistory = [...history, { role: "user", content: query, createdAt: new Date().toISOString() }, { role: "assistant", content: answer, createdAt: new Date().toISOString() }];
    storeConversationMemory(account.id, conversationId, nextHistory);

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (payload: Record<string, unknown>) =>
          controller.enqueue(encoder.encode("data: " + JSON.stringify(payload) + "\n\n"));

        send({ type: "context", tools: context.toolsUsed, engine: "sifcas-local-v1", conversationId });

        if (context.serviceRequestProposal) {
          send({
            type: "action_proposal",
            action: "open_service_request",
            proposal: context.serviceRequestProposal,
          });
        }

        for (let offset = 0; offset < answer.length; offset += 240) {
          send({ type: "delta", text: answer.slice(offset, offset + 240) });
        }

        send({ type: "done", engine: "sifcas-local-v1", conversationId });
        controller.close();
      },
    });

    return new Response(stream, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-store, must-revalidate",
        Connection: "keep-alive",
        "X-Accel-Buffering": "no",
      },
    });
  } catch (error) {
    console.error("LUMA local engine failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível consultar os dados do SIFCAS para esta pergunta.", 502);
  }
}
