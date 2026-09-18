"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { Bot, CheckCircle2, Database, RotateCcw, Send, ShieldCheck, Sparkles, TicketPlus, UserRound, X } from "lucide-react";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
};

type ServiceRequestProposal = {
  category: "academic" | "documents" | "people" | "infrastructure" | "it" | "transport" | "other";
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  description: string;
};

type StreamPayload = {
  type?: "context" | "action_proposal" | "delta" | "done" | "error";
  text?: string;
  message?: string;
  conversationId?: string | null;
  messageId?: string | null;
  tools?: string[];
  action?: string;
  proposal?: ServiceRequestProposal;
};

const suggestions = [
  "Qual é minha próxima atividade?",
  "Como estão minhas notas e frequência?",
  "Há editais ou oportunidades abertas?",
  "Quais documentos acadêmicos eu tenho?",
];

const toolLabels: Record<string, string> = {
  consultar_notas: "Notas",
  consultar_frequencia: "Frequência",
  consultar_agenda: "Agenda",
  consultar_editais: "Editais",
  consultar_publicacoes: "Notícias e eventos",
  consultar_documentos: "Documentos",
  consultar_solicitacoes: "Solicitações",
  consultar_processos: "Processos",
  consultar_estagios: "Estágios",
  consultar_auxilios: "Auxílios",
  consultar_tcc: "TCC",
  consultar_projetos: "Projetos",
  abrir_solicitacao: "Abertura de solicitação",
};

const categoryLabels: Record<ServiceRequestProposal["category"], string> = {
  academic: "Acadêmico",
  documents: "Documentos",
  people: "Pessoas",
  infrastructure: "Infraestrutura",
  it: "Tecnologia",
  transport: "Transporte",
  other: "Outros",
};

const priorityLabels: Record<ServiceRequestProposal["priority"], string> = {
  low: "Baixa",
  normal: "Normal",
  high: "Alta",
  urgent: "Urgente",
};

function makeId() {
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : String(Date.now()) + "-" + Math.random().toString(16).slice(2);
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

export function MaisaChat({ firstName, roleLabel }: { firstName: string; roleLabel: string }) {
  const initialMessage = useMemo<ChatMessage>(() => ({
    id: "welcome",
    role: "assistant",
    content: "Olá, " + firstName + ". Eu sou a MAISA Local, a assistente simples do próprio SIFCAS. Consigo consultar, com as permissões da sua conta, notas, frequência, agenda, editais, documentos, processos, estágios, auxílios, TCC, projetos e solicitações. Também encontro páginas, consulta a Base de Conhecimento e posso preparar um chamado para você confirmar.",
  }), [firstName]);

  const [messages, setMessages] = useState<ChatMessage[]>([initialMessage]);
  const [conversationId, setConversationId] = useState("");
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [toolsUsed, setToolsUsed] = useState<string[]>([]);
  const [proposal, setProposal] = useState<ServiceRequestProposal | null>(null);
  const [actionBusy, setActionBusy] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, sending, proposal]);

  function resetConversation() {
    if (sending || actionBusy) return;
    setConversationId("");
    setMessages([{ ...initialMessage, id: "welcome-" + Date.now() }]);
    setInput("");
    setToolsUsed([]);
    setProposal(null);
  }

  function updateAssistant(id: string, updater: (content: string) => string) {
    setMessages((current) => current.map((message) => message.id === id ? { ...message, content: updater(message.content) } : message));
  }

  async function sendMessage(raw?: string) {
    const query = (raw ?? input).trim();
    if (!query || sending || actionBusy) return;

    const userId = makeId();
    const assistantId = makeId();
    setInput("");
    setSending(true);
    setToolsUsed([]);
    setProposal(null);
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
        if (payload.type === "context" && Array.isArray(payload.tools)) setToolsUsed(payload.tools);
        if (payload.type === "action_proposal" && payload.action === "open_service_request" && payload.proposal) setProposal(payload.proposal);

        if (payload.type === "delta" && typeof payload.text === "string") {
          receivedText = true;
          updateAssistant(assistantId, (current) => current + payload.text);
        }

        if (payload.type === "error") {
          updateAssistant(assistantId, (current) => current || payload.message || "A MAISA encontrou um erro ao responder.");
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
      if (!receivedText) updateAssistant(assistantId, (current) => current || "A MAISA concluiu a execução sem retornar uma resposta de texto.");
    } catch (error) {
      updateAssistant(assistantId, () => error instanceof Error ? error.message : "Não foi possível conversar com a MAISA agora.");
    } finally {
      setSending(false);
    }
  }

  async function confirmServiceRequest() {
    if (!proposal || actionBusy) return;
    setActionBusy(true);
    try {
      const response = await fetch("/api/maisa/actions/service-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(proposal),
      });
      const body = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(typeof body.error === "string" ? body.error : "Não foi possível abrir a solicitação.");
      const requestId = typeof body.request?.id === "string" ? body.request.id : "";
      setMessages((current) => [...current, {
        id: makeId(),
        role: "assistant",
        content: "Solicitação aberta com sucesso" + (requestId ? " (protocolo " + requestId + ")" : "") + ". Você pode acompanhar em Solicitações.",
      }]);
      setProposal(null);
      setToolsUsed((current) => [...new Set([...current, "consultar_solicitacoes"])]);
    } catch (error) {
      setMessages((current) => [...current, {
        id: makeId(),
        role: "assistant",
        content: error instanceof Error ? error.message : "Não foi possível abrir a solicitação.",
      }]);
    } finally {
      setActionBusy(false);
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
          <span className="maisaLive"><span/>MAISA Local + ferramentas SIFCAS</span>
          <strong>Contexto real consultado com as permissões da sua conta</strong>
          <small>Perfil atual: {roleLabel}. Motor local do SIFCAS, sem provedor externo de IA.</small>
        </div>
        <button className="button soft" type="button" onClick={resetConversation} disabled={sending || actionBusy}>
          <RotateCcw size={15}/> Nova conversa
        </button>
      </div>

      <div className="maisaBody card">
        <div className="maisaMessages" aria-live="polite">
          {messages.map((message) => (
            <article className={"maisaMessage " + message.role} key={message.id}>
              <span className="maisaAvatar">{message.role === "assistant" ? <Bot size={18}/> : <UserRound size={18}/>}</span>
              <div>
                <b>{message.role === "assistant" ? "MAISA" : "Você"}</b>
                <p>{message.content || (sending && message.role === "assistant" ? "Consultando o SIFCAS…" : "")}</p>
              </div>
            </article>
          ))}
          <div ref={endRef}/>
        </div>

        {toolsUsed.length > 0 && <div className="maisaTools"><span><Database size={14}/> Contexto usado</span><div>{toolsUsed.map((tool) => <span className="badge" key={tool}>{toolLabels[tool] ?? tool}</span>)}</div></div>}

        {proposal && <section className="maisaActionCard">
          <div className="maisaActionHead"><span className="iconBox"><TicketPlus size={18}/></span><div><b>Confirmar abertura de solicitação</b><small>A MAISA preparou a ação, mas nada será gravado sem sua confirmação.</small></div></div>
          <dl><div><dt>Categoria</dt><dd>{categoryLabels[proposal.category]}</dd></div><div><dt>Prioridade</dt><dd>{priorityLabels[proposal.priority]}</dd></div><div className="wide"><dt>Título</dt><dd>{proposal.title}</dd></div></dl>
          <div className="maisaActionButtons"><button type="button" className="button primary" onClick={() => void confirmServiceRequest()} disabled={actionBusy}><CheckCircle2 size={15}/>{actionBusy ? "Abrindo…" : "Confirmar e abrir"}</button><button type="button" className="button soft" onClick={() => setProposal(null)} disabled={actionBusy}><X size={15}/>Cancelar</button></div>
        </section>}

        {messages.length <= 1 && <div className="maisaSuggestions">
          <span><Sparkles size={15}/> Experimente perguntar</span>
          <div>{suggestions.map((suggestion) => <button key={suggestion} type="button" onClick={() => void sendMessage(suggestion)} disabled={sending}>{suggestion}</button>)}</div>
        </div>}

        <form className="maisaComposer" onSubmit={submit}>
          <textarea aria-label="Mensagem para a MAISA" placeholder="Pergunte sobre notas, agenda, editais, documentos, solicitações..." value={input} onChange={(event) => setInput(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); void sendMessage(); } }} maxLength={6000} rows={3} disabled={sending || actionBusy}/>
          <div className="maisaComposerFooter"><span><ShieldCheck size={14}/>Consultas respeitam sua sessão e RLS do SIFCAS.</span><button className="button primary maisaSend" type="submit" disabled={sending || actionBusy || !input.trim()}><Send size={16}/>{sending ? "Consultando…" : "Enviar"}</button></div>
        </form>
      </div>

      <p className="maisaPrivacy">A MAISA processa a pergunta dentro do SIFCAS usando regras, busca e ferramentas internas. Ações que modificam dados continuam exigindo confirmação explícita.</p>
    </section>
  );
}
