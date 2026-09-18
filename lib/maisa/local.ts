import type { CurrentAccount } from "@/lib/auth";
import { listKnowledgeArticles } from "@/lib/experience";
import type { MaisaContextResult } from "@/lib/maisa/context";

type RouteEntry = { name?: string; href?: string };
type AcademicSubject = {
  subject?: string;
  code?: string;
  average_10?: number | null;
  frequency_percent?: number | null;
  absences?: number | null;
  graded_assessments?: number;
  attendance_records?: number;
};
type AcademicReport = {
  status?: string;
  student?: string;
  course?: string;
  class?: string;
  period?: string;
  overall_average_10?: number | null;
  overall_frequency_percent?: number | null;
  total_absences?: number | null;
  subjects?: AcademicSubject[];
};
type AgendaItem = {
  date?: string;
  starts_at?: string | null;
  type?: string;
  title?: string;
  description?: string;
  class?: string;
  subject?: string | null;
};
type PublicationItem = {
  title?: string;
  reference_code?: string | null;
  summary?: string;
  starts_at?: string | null;
  ends_at?: string | null;
  expires_at?: string | null;
  location?: string | null;
  sifcas_route?: string;
  kind?: string;
};
type GenericItem = Record<string, unknown>;

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasAny(value: string, terms: string[]) {
  return terms.some((term) => value.includes(term));
}

function humanDate(value: unknown) {
  if (typeof value !== "string" || !value) return "data não informada";
  const date = new Date(value.length === 10 ? value + "T12:00:00-04:00" : value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: value.length === 10 ? undefined : "short",
    timeZone: "America/Cuiaba",
  }).format(date);
}

function money(value: unknown) {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) return null;
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(number);
}

function clip(value: unknown, max = 220) {
  if (typeof value !== "string") return "";
  const text = value.trim().replace(/\s+/g, " ");
  return text.length > max ? text.slice(0, max - 1) + "…" : text;
}

function formatAcademic(data: AcademicReport) {
  if (data.status !== "resolved") return null;
  const header = [
    data.student ? "Estudante: " + data.student : null,
    data.course ? "Curso: " + data.course : null,
    data.class ? "Turma: " + data.class : null,
    data.period ? "Período: " + data.period : null,
  ].filter(Boolean).join(" • ");

  const summary: string[] = [];
  if (data.overall_average_10 !== undefined) {
    summary.push("Média geral: " + (data.overall_average_10 === null ? "ainda não lançada" : Number(data.overall_average_10).toFixed(1)));
  }
  if (data.overall_frequency_percent !== undefined) {
    summary.push("Frequência geral: " + (data.overall_frequency_percent === null ? "ainda não calculada" : Number(data.overall_frequency_percent).toFixed(1) + "%"));
  }
  if (data.total_absences !== undefined) {
    summary.push("Faltas: " + (data.total_absences === null ? "sem registro" : String(data.total_absences)));
  }

  const subjects = (data.subjects ?? []).slice(0, 12).map((subject) => {
    const bits: string[] = [];
    if (subject.average_10 !== undefined) bits.push("média " + (subject.average_10 === null ? "—" : Number(subject.average_10).toFixed(1)));
    if (subject.frequency_percent !== undefined) bits.push("freq. " + (subject.frequency_percent === null ? "—" : Number(subject.frequency_percent).toFixed(1) + "%"));
    if (subject.absences !== undefined) bits.push("faltas " + (subject.absences ?? 0));
    return "• " + (subject.subject ?? "Disciplina") + (subject.code ? " (" + subject.code + ")" : "") + (bits.length ? ": " + bits.join(" • ") : "");
  });

  return [header, summary.join(" • "), subjects.join("\n")].filter(Boolean).join("\n");
}

function formatAgenda(items: AgendaItem[]) {
  if (!items.length) return "Não há atividades futuras cadastradas na agenda acessível à sua conta.";
  return items.slice(0, 8).map((item) => {
    const time = item.starts_at ? " às " + String(item.starts_at).slice(0, 5) : "";
    const subject = item.subject ? " • " + item.subject : "";
    return "• " + humanDate(item.date) + time + " — " + (item.title ?? item.type ?? "Atividade") + subject;
  }).join("\n");
}

function formatPublications(items: PublicationItem[], empty: string) {
  if (!items.length) return empty;
  return items.slice(0, 6).map((item) => {
    const deadline = item.ends_at ? " • prazo " + humanDate(item.ends_at) : "";
    const ref = item.reference_code ? " • " + item.reference_code : "";
    const route = item.sifcas_route ? " • " + item.sifcas_route : "";
    return "• " + (item.title ?? "Publicação") + ref + deadline + route + (item.summary ? "\n  " + clip(item.summary, 180) : "");
  }).join("\n");
}

function formatGenericList(items: GenericItem[], kind: string) {
  if (!items.length) {
    const emptyLabels: Record<string, string> = {
      requests: "Nenhuma solicitação encontrada.",
      processes: "Nenhum processo eletrônico encontrado.",
      internships: "Nenhuma oportunidade de estágio aberta agora.",
      aid: "Nenhum auxílio estudantil aberto agora.",
      tcc: "Nenhuma defesa de TCC futura encontrada.",
      projects: "Nenhum projeto compatível encontrado.",
    };
    return emptyLabels[kind] ?? "Nenhum registro encontrado.";
  }

  return items.slice(0, 8).map((item) => {
    if (kind === "requests") {
      return "• " + String(item.title ?? "Solicitação") + " — " + String(item.status ?? "") + " • prioridade " + String(item.priority ?? "normal");
    }
    if (kind === "processes") {
      return "• " + String(item.protocol ?? "Processo") + " — " + String(item.subject ?? "") + " • " + String(item.status ?? "") + " • setor " + String(item.current_sector ?? "não informado");
    }
    if (kind === "internships") {
      const stipend = money(item.stipend);
      return "• " + String(item.title ?? "Estágio") + " — " + String(item.organization ?? "") + (item.location ? " • " + String(item.location) : "") + (stipend ? " • " + stipend : "") + (item.application_deadline ? " • até " + humanDate(item.application_deadline) : "");
    }
    if (kind === "aid") {
      const amount = money(item.benefit_value);
      return "• " + String(item.title ?? "Auxílio") + (item.benefit_type ? " • " + String(item.benefit_type) : "") + (amount ? " • " + amount : "") + (item.application_deadline ? " • até " + humanDate(item.application_deadline) : "");
    }
    if (kind === "tcc") {
      return "• " + String(item.title ?? "Defesa de TCC") + " — " + humanDate(item.scheduled_at) + (item.room ? " • " + String(item.room) : "");
    }
    if (kind === "projects") {
      return "• " + String(item.title ?? "Projeto") + " — " + String(item.axis ?? "") + " • " + String(item.status ?? "") + (item.open_for_applications ? " • aceita candidaturas" : "");
    }
    return "• " + clip(JSON.stringify(item), 180);
  }).join("\n");
}

function tokenSet(value: string) {
  return new Set(normalize(value).split(/[^a-z0-9]+/).filter((token) => token.length >= 3));
}

async function knowledgeFallback(query: string) {
  const articles = (await listKnowledgeArticles()).filter((article) => article.status === "published");
  const queryTokens = tokenSet(query);
  const scored = articles.map((article) => {
    const titleTokens = tokenSet(article.title + " " + article.summary);
    const contentTokens = tokenSet(article.content);
    let score = 0;
    for (const token of queryTokens) {
      if (titleTokens.has(token)) score += 4;
      if (contentTokens.has(token)) score += 1;
    }
    return { article, score };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);

  if (!scored.length) return null;
  const best = scored[0].article;
  const excerpt = clip(best.content || best.summary, 520);
  return best.title + "\n\n" + (excerpt || best.summary) + "\n\nVeja também: /base-conhecimento";
}

function routeFallback(query: string, routes: RouteEntry[]) {
  const q = normalize(query);
  const ranked = routes.map((route) => {
    const name = normalize(route.name ?? "");
    let score = 0;
    for (const token of tokenSet(q)) {
      if (name.includes(token)) score += 2;
    }
    if (name && q.includes(name)) score += 5;
    return { route, score };
  }).filter((entry) => entry.score > 0).sort((a, b) => b.score - a.score);

  if (!ranked.length) return null;
  const top = ranked.slice(0, 3);
  return "Acho que você procura " + top.map((entry) => (entry.route.name ?? "um módulo") + " (" + (entry.route.href ?? "/") + ")").join(", ") + ".";
}

export async function answerWithLocalMaisa(
  account: CurrentAccount,
  rawQuery: string,
  context: MaisaContextResult,
) {
  if (context.directAnswer) return context.directAnswer;

  const q = normalize(rawQuery);
  const data = context.contextData;
  const sections: string[] = [];

  if (hasAny(q, ["oi", "ola", "bom dia", "boa tarde", "boa noite"]) && context.toolsUsed.length === 0) {
    return "Olá, " + account.fullName.split(/\s+/)[0] + ". Eu sou a MAISA local do SIFCAS. Posso consultar seus dados permitidos, encontrar módulos e explicar procedimentos do sistema.";
  }

  if (hasAny(q, ["o que voce faz", "o que você faz", "como voce pode ajudar", "como você pode ajudar", "suas funcoes", "suas funções"])) {
    return "Eu sou a MAISA local do SIFCAS. Consigo consultar notas e frequência, agenda, editais, notícias, documentos, solicitações, processos, estágios, auxílios, TCC e projetos. Também encontro páginas do sistema, consulto a Base de Conhecimento e preparo uma solicitação para você confirmar.";
  }

  if (hasAny(q, ["quem sou eu", "meu perfil", "qual meu perfil", "qual meu papel"])) {
    return "Sua conta está identificada como " + account.fullName + ", com papel " + account.role + " no " + account.campus + ".";
  }

  const academic = data.academic_report as AcademicReport | undefined;
  if (academic) {
    const formatted = formatAcademic(academic);
    if (formatted) sections.push("Dados acadêmicos\n" + formatted);
  }

  const agenda = data.agenda as AgendaItem[] | undefined;
  if (agenda) sections.push("Agenda\n" + formatAgenda(agenda));

  const edicts = data.edicts as PublicationItem[] | undefined;
  if (edicts) sections.push("Editais\n" + formatPublications(edicts, "Nenhum edital disponível para seu perfil agora."));

  const updates = data.institutional_updates as PublicationItem[] | undefined;
  if (updates) sections.push("Publicações institucionais\n" + formatPublications(updates, "Nenhuma publicação institucional encontrada agora."));

  const documents = data.documents as { issued?: Array<Record<string, unknown>>; eligibility?: unknown } | undefined;
  if (documents) {
    const issued = documents.issued ?? [];
    if (!issued.length) {
      sections.push("Documentos\nVocê ainda não possui documentos acadêmicos emitidos no SIFCAS.");
    } else {
      sections.push("Documentos\n" + issued.slice(0, 8).map((item) => "• " + String(item.type ?? "Documento") + " • código " + String(item.verification_code ?? "—") + " • " + (item.valid === false ? "revogado" : "válido") + " • /documentos-academicos/" + String(item.id ?? "")).join("\n"));
    }
  }

  const requests = data.service_requests as GenericItem[] | undefined;
  if (requests) sections.push("Solicitações\n" + formatGenericList(requests, "requests"));

  const processes = data.electronic_processes as GenericItem[] | undefined;
  if (processes) sections.push("Processos\n" + formatGenericList(processes, "processes"));

  const internships = data.internships as GenericItem[] | undefined;
  if (internships) sections.push("Estágios\n" + formatGenericList(internships, "internships"));

  const aid = data.student_aid as GenericItem[] | undefined;
  if (aid) sections.push("Auxílios\n" + formatGenericList(aid, "aid"));

  const tcc = data.tcc_defenses as GenericItem[] | undefined;
  if (tcc) sections.push("TCC\n" + formatGenericList(tcc, "tcc"));

  const projects = data.projects as GenericItem[] | undefined;
  if (projects) sections.push("Projetos\n" + formatGenericList(projects, "projects"));

  if (context.serviceRequestProposal) {
    sections.push("Preparei uma solicitação com base no que você escreveu. Confira os dados abaixo e confirme somente se estiver tudo certo.");
  }

  if (sections.length) return sections.join("\n\n");

  const knowledge = await knowledgeFallback(rawQuery);
  if (knowledge) return knowledge;

  const route = routeFallback(rawQuery, (data.routes as RouteEntry[] | undefined) ?? []);
  if (route) return route;

  return "Ainda sou uma IA simples e não entendi bem esse pedido. Tente perguntar de forma direta, por exemplo: “minhas notas”, “próximas avaliações”, “editais abertos”, “meus processos”, “onde fica o boletim?” ou “abra uma solicitação sobre internet”.";
}
