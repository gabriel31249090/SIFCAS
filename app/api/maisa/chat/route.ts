import { NextRequest } from "next/server";
import { getCurrentAccount } from "@/lib/auth";
import { buildMaisaContext } from "@/lib/maisa/context";
import { getDifyConfig, getDifyUserId } from "@/lib/dify";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const MAX_QUERY_LENGTH = 6000;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type ChatRequestBody = {
  query?: unknown;
  conversationId?: unknown;
};

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

function extractFrame(buffer: string) {
  const lf = buffer.indexOf("\n\n");
  const crlf = buffer.indexOf("\r\n\r\n");

  if (lf === -1 && crlf === -1) return null;
  if (lf !== -1 && (crlf === -1 || lf < crlf)) {
    return { frame: buffer.slice(0, lf), rest: buffer.slice(lf + 2) };
  }

  return { frame: buffer.slice(0, crlf), rest: buffer.slice(crlf + 4) };
}

export async function POST(request: NextRequest) {
  const account = await getCurrentAccount();
  if (!account) return jsonError("Faça login para conversar com a MAISA.", 401);
  if (account.accountStatus === "suspended") return jsonError("Esta conta está suspensa.", 403);

  const origin = request.headers.get("origin");
  if (origin && origin !== request.nextUrl.origin) {
    return jsonError("Origem da requisição não permitida.", 403);
  }

  let body: ChatRequestBody;
  try {
    body = (await request.json()) as ChatRequestBody;
  } catch {
    return jsonError("Corpo da requisição inválido.", 400);
  }

  const query = typeof body.query === "string" ? body.query.trim() : "";
  const conversationId = typeof body.conversationId === "string" ? body.conversationId.trim() : "";

  if (!query) return jsonError("Digite uma mensagem para a MAISA.", 400);
  if (query.length > MAX_QUERY_LENGTH) {
    return jsonError("A mensagem deve ter no máximo " + MAX_QUERY_LENGTH + " caracteres.", 400);
  }
  if (conversationId && !UUID_RE.test(conversationId)) {
    return jsonError("Identificador de conversa inválido.", 400);
  }

  const dify = getDifyConfig();
  if (!dify.configured || !dify.apiKey) {
    return jsonError("A MAISA ainda não está configurada no servidor.", 503);
  }

  let context;
  try {
    context = await buildMaisaContext(account, query);
  } catch (error) {
    console.error("MAISA context tools failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível consultar os dados do SIFCAS para esta pergunta.", 502);
  }

  if (context.directAnswer) {
    const encoder = new TextEncoder();
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "context", tools: context.toolsUsed }) + "\n\n"));
        controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "delta", text: context.directAnswer }) + "\n\n"));
        controller.enqueue(encoder.encode("data: " + JSON.stringify({ type: "done" }) + "\n\n"));
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
  }

  let upstream: Response;
  try {
    upstream = await fetch(dify.apiUrl + "/chat-messages", {
      method: "POST",
      headers: {
        Authorization: "Bearer " + dify.apiKey,
        "Content-Type": "application/json",
        Accept: "text/event-stream",
      },
      body: JSON.stringify({
        inputs: {},
        query: context.enrichedQuery,
        response_mode: "streaming",
        conversation_id: conversationId,
        user: getDifyUserId(account.id),
        auto_generate_name: true,
      }),
      cache: "no-store",
    });
  } catch (error) {
    console.error("MAISA upstream connection failed", error instanceof Error ? error.message : "unknown");
    return jsonError("Não foi possível conectar a MAISA ao provedor de IA.", 502);
  }

  if (!upstream.ok) {
    const detail = await upstream.text().catch(() => "");
    console.error("MAISA upstream rejected request", upstream.status, detail.slice(0, 500));
    return jsonError(
      upstream.status === 401
        ? "A credencial da MAISA precisa ser revisada na Vercel."
        : "A MAISA não conseguiu processar a mensagem agora.",
      502,
    );
  }

  if (!upstream.body) return jsonError("A MAISA não retornou um fluxo de resposta.", 502);

  const reader = upstream.body.getReader();
  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      let buffer = "";
      let terminalSent = false;

      const send = (payload: Record<string, unknown>) => {
        controller.enqueue(encoder.encode("data: " + JSON.stringify(payload) + "\n\n"));
      };

      send({ type: "context", tools: context.toolsUsed });
      if (context.serviceRequestProposal) {
        send({ type: "action_proposal", action: "open_service_request", proposal: context.serviceRequestProposal });
      }

      const handleFrame = (frame: string) => {
        const dataLine = frame.split(/\r?\n/).find((line) => line.startsWith("data: "));
        if (!dataLine) return;

        let event: Record<string, any>;
        try {
          event = JSON.parse(dataLine.slice(6)) as Record<string, any>;
        } catch {
          return;
        }

        if (event.event === "message" && typeof event.answer === "string" && event.answer) {
          send({
            type: "delta",
            text: event.answer,
            conversationId: event.conversation_id ?? null,
            messageId: event.message_id ?? null,
          });
          return;
        }

        if (event.event === "message_end") {
          send({
            type: "done",
            conversationId: event.conversation_id ?? null,
            messageId: event.message_id ?? null,
          });
          terminalSent = true;
          return;
        }

        if (event.event === "human_input_required") {
          send({
            type: "error",
            message: "A MAISA solicitou uma etapa adicional que ainda não está habilitada no SIFCAS.",
          });
          terminalSent = true;
          return;
        }

        if (event.event === "workflow_finished" && event.data?.status === "failed") {
          send({ type: "error", message: "A execução da MAISA falhou. Tente novamente." });
          terminalSent = true;
          return;
        }

        if (event.event === "error") {
          send({
            type: "error",
            message: typeof event.message === "string" ? event.message : "A MAISA encontrou um erro ao responder.",
          });
          terminalSent = true;
        }
      };

      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });

          while (true) {
            const part = extractFrame(buffer);
            if (!part) break;
            buffer = part.rest;
            handleFrame(part.frame);
          }
        }

        buffer += decoder.decode();
        if (buffer.trim()) handleFrame(buffer);
        if (!terminalSent) send({ type: "done" });
      } catch (error) {
        console.error("MAISA stream processing failed", error instanceof Error ? error.message : "unknown");
        if (!terminalSent) send({ type: "error", message: "A conexão com a MAISA foi interrompida." });
      } finally {
        try {
          reader.releaseLock();
        } catch {
          // Reader may already be released after an upstream cancellation.
        }
        controller.close();
      }
    },
    async cancel() {
      await reader.cancel().catch(() => undefined);
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
}
