import { NextRequest } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { buildMaisaContext } from "@/lib/maisa/context";
import { answerWithLocalMaisa } from "@/lib/maisa/local";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 6000;

type ChatRequestBody = { query?: unknown };

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Faça login para conversar com a MAISA.", 401);
  if (account.accountStatus !== "active") return jsonError("Seu vínculo precisa estar ativo para usar a MAISA.", 403);

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) return jsonError("Origem da requisição não permitida.", 403);

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonError("Corpo da requisição inválido.", 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  if (!query) return jsonError("Digite uma mensagem para a MAISA.", 400);
  if (query.length > MAX_QUERY_LENGTH) return jsonError("A mensagem deve ter no máximo " + MAX_QUERY_LENGTH + " caracteres.", 400);

  try {
    const context = await buildMaisaContext(account, query);
    const answer = await answerWithLocalMaisa(account, query, context);
    const encoder = new TextEncoder();

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        const send = (payload: Record<string, unknown>) =>
          controller.enqueue(encoder.encode("data: " + JSON.stringify(payload) + "\n\n"));

        send({ type: "context", tools: context.toolsUsed, engine: "sifcas-local-v1" });

        if (context.serviceRequestProposal) {
          send({
            type: "action_proposal",
            action: "open_service_request",
            proposal: context.serviceRequestProposal,
          });
        }

        for (let offset = 0; offset < answer.length; offset += 180) {
          send({ type: "delta", text: answer.slice(offset, offset + 180) });
        }

        send({ type: "done", engine: "sifcas-local-v1" });
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
    console.error("MAISA local engine failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível consultar os dados do SIFCAS para esta pergunta.", 502);
  }
}
