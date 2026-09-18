"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, RotateCcw, Send, ShieldCheck, Sparkles, UserRound } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type StreamPayload = {
  type?: "delta" | "done" | "error";
  text?: string;
  message?: string;
  conversationId?: string | null;
  messageId?: string | null;
};

const suggestions = [
  "O que você pode fazer no SIFCAS?",
  "Como você protege meus dados?",
  "Quais informações você ainda não consegue consultar?",
];

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : \`\${Date.now()}-\${Math.random().toString(16).slice(2)}\`;
}

function nextFrame(buffer: string) {
  const lf = buffer.indexOf("\n\n");
  const crlf = buffer.indexOf("\r\n\r\n");
  if (lf === -1 && crlf === -1) return null;
  if (lf !== -1 && (crlf === -1 || lf < crlf)) {
    return { frame: buffer.slice(0, lf), rest: buffer.slice(lf + 2) };
  }
  return { frame: buffer.slice(0, crlf), rest: buffer.slice(crlf + 4) };
}

export function MaisaChat({
  firstName,
  roleLabel,
}: {
  firstName: string;
  roleLabel: string;
}) {
  const initialMessage = useMemo<ChatMessage>(() => ({
    id: "welcome",
    role: "assistant",
    content: \`Olá, \${firstName}. Eu sou a MAISA, assistente inteligente do SIFCAS. Posso orientar você sobre o sistema e, conforme novas ferramentas forem habilitadas, consultar informações autorizadas da sua conta.\`,
  }), [firstName]);

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [conversationId, setConversationId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending]);

  function resetConversation() {
    if (sending) return;
    setConversationId("");
    setMessages([{ ...initialMessage, id: \`welcome-\${Date.now()}\` }]);
    setInput("");
  }

  function updateAssistant(id: string, updater: (content: string) => string) {
    setMessages((current) =>
      current.map((message) =>
        message.id === id ? { ...message, content: updater(message.content) } : message,
      ),
    );
  }

  async function sendMessage(raw?: string) {
    const query = (raw ?? input).trim();
    if (!query || sending) return;

    const userId = makeId();
    const assistantId = makeId();
    setInput("");
    setSending(true);
    setMessages((current) => [
      ...current,
      { id: userId, role: "user", content: query },
      { id: assistantId, role: "assistant", content: "" },
    ]);

    try {
      const response = await fetch("/api/maisa/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query, conversationId }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({ error: "Falha ao falar com a MAISA." }));
        throw new Error(typeof body.error === "string" ? body.error : "Falha ao falar com a MAISA.");
      }

      if (!response.body) throw new Error("A MAISA não retornou conteúdo.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let receivedText = false;

      const handleFrame = (frame: string) => {
        const dataLine = frame.split(/\r?\n/).find((line) => line.startsWith("data: "));
        if (!dataLine) return;

        let payload: StreamPayload;
        try {
          payload = JSON.parse(dataLine.slice(6)) as StreamPayload;
        } catch {
          return;
        }

        if (payload.conversationId) setConversationId(payload.conversationId);

        if (payload.type === "delta" && typeof payload.text === "string") {
          receivedText = true;
          updateAssistant(assistantId, (current) => current + payload.text);
        }

        if (payload.type === "error") {
          updateAssistant(
            assistantId,
            (current) => current || payload.message || "A MAISA encontrou um erro ao responder.",
          );
        }
      };

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        while (true) {
          const part = nextFrame(buffer);
          if (!part) break;
          buffer = part.rest;
          handleFrame(part.frame);
        }
      }

      buffer += decoder.decode();
      if (buffer.trim()) handleFrame(buffer);

      if (!receivedText) {
        updateAssistant(
          assistantId,
          (current) => current || "A MAISA concluiu a execução sem retornar uma resposta de texto.",
        );
      }
    } catch (error) {
      updateAssistant(
        assistantId,
        () => error instanceof Error ? error.message : "Não foi possível conversar com a MAISA agora.",
      );
    } finally {
      setSending(false);
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void sendMessage();
  }

  return (
    <section className="maisaWorkspace">
      <div className="maisaStatusBar">
        <div>
          <span className="maisaLive"><span/>Dify conectado ao SIFCAS</span>
          <strong>Conversa protegida por autenticação institucional</strong>
          <small>Perfil atual: {roleLabel}. A chave do Dify nunca é enviada ao navegador.</small>
        </div>
        <button className="button soft" type="button" onClick={resetConversation} disabled={sending}>
          <RotateCcw size={15}/> Nova conversa
        </button>
      </div>

      <div className="maisaBody card">
        <div className="maisaMessages" aria-live="polite">
          {messages.map((message) => (
            <article className={\`maisaMessage \${message.role}\`} key={message.id}>
              <span className="maisaAvatar">
                {message.role === "assistant" ? <Bot size={18}/> : <UserRound size={18}/>}
              </span>
              <div>
                <b>{message.role === "assistant" ? "MAISA" : "Você"}</b>
                <p>{message.content || (sending && message.role === "assistant" ? "Pensando…" : "")}</p>
              </div>
            </article>
          ))}
          <div ref={endRef}/>
        </div>

        {messages.length <= 1 && (
          <div className="maisaSuggestions">
            <span><Sparkles size={15}/> Experimente perguntar</span>
            <div>
              {suggestions.map((suggestion) => (
                <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} disabled={sending}>
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}

        <form className="maisaComposer" onSubmit={submit}>
          <textarea
            aria-label="Mensagem para a MAISA"
            placeholder="Pergunte algo para a MAISA..."
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                void sendMessage();
              }
            }}
            maxLength={6000}
            rows={3}
            disabled={sending}
          />
          <div className="maisaComposerFooter">
            <span><ShieldCheck size={14}/> O SIFCAS envia somente sua mensagem e um identificador interno ao Dify.</span>
            <button className="button primary maisaSend" type="submit" disabled={sending || !input.trim()}>
              <Send size={16}/>{sending ? "Respondendo…" : "Enviar"}
            </button>
          </div>
        </form>
      </div>

      <p className="maisaPrivacy">
        As mensagens são processadas pelo Dify e pelo modelo configurado no fluxo da MAISA. Dados acadêmicos ou administrativos só poderão ser usados quando ferramentas seguras do SIFCAS forem explicitamente conectadas.
      </p>
    </section>
  );
}
