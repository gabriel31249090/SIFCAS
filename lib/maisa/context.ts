import type { CurrentAccount } from "@/lib/auth";
import { getAgendaContext, getStudentAcademicContext } from "@/lib/academic";
import { getStudentReport } from "@/lib/diary";
import { getDocumentEligibility } from "@/lib/documents";
import { listPublishedPublications } from "@/lib/institutional";
import { createClient } from "@/lib/supabase/server";

export type MaisaServiceRequestProposal = {
  category: "academic" | "documents" | "people" | "infrastructure" | "it" | "transport" | "other";
  priority: "low" | "normal" | "high" | "urgent";
  title: string;
  description: string;
};

export type MaisaContextResult = {
  enrichedQuery: string;
  toolsUsed: string[];
  serviceRequestProposal: MaisaServiceRequestProposal | null;
};

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
}

function hasAny(query: string, terms: string[]) {
  return terms.some((term) => query.includes(term));
}

function nowCuiaba() {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Cuiaba",
    dateStyle: "full",
    timeStyle: "short",
  }).format(new Date());
}

function routesFor(account: CurrentAccount) {
  const routes: Array<[string, string]> = [
    ["MAISA", "/maisa"],
    ["Aplicativos", "/aplicativos"],
    ["Busca", "/buscar"],
    ["Notificações", "/notificacoes"],
    ["Perfil", "/perfil"],
    ["Solicitações", "/solicitacoes"],
    ["Documentos e Processos", "/documentos"],
    ["Editais", "/editais"],
    ["Notícias e Eventos", "/noticias"],
    ["Agenda Institucional", "/agenda-institucional"],
    ["Campus Cáceres", "/campus"],
  ];

  if (account.role === "student") {
    routes.push(
      ["Área do Estudante", "/estudante"],
      ["Agenda do Aluno", "/agenda-aluno"],
      ["Boletim e Frequência", "/boletim"],
      ["Documentos Acadêmicos", "/documentos-academicos"],
    );
  }

  if (["teacher", "manager", "admin"].includes(account.role)) {
    routes.push(["Diário do Professor", "/diario-professor"], ["Agenda das Turmas", "/agenda-aluno"]);
  }

  if (["staff", "manager", "admin"].includes(account.role)) {
    routes.push(["Painel Institucional", "/painel-institucional"], ["Pessoas", "/pessoas"]);
  }

  if (["manager", "admin"].includes(account.role)) {
    routes.push(["Gestão Acadêmica", "/gestao-academica"], ["Auditoria", "/auditoria"], ["Monitoramento", "/monitoramento"]);
  }

  if (account.role === "admin") routes.push(["Usuários e Permissões", "/usuarios"]);
  return routes.map(([name, href]) => ({ name, href }));
}

function inferRequestProposal(rawQuery: string, normalized: string): MaisaServiceRequestProposal | null {
  const actionIntent = hasAny(normalized, [
    "abrir solicitacao", "abra uma solicitacao", "criar solicitacao", "crie uma solicitacao",
    "abrir chamado", "abra um chamado", "criar chamado", "registrar chamado",
  ]);
  if (!actionIntent) return null;

  let category: MaisaServiceRequestProposal["category"] = "other";
  if (hasAny(normalized, ["sistema", "login", "senha", "computador", "internet", "rede", "tecnologia", "erro no site"])) category = "it";
  else if (hasAny(normalized, ["declaracao", "certificado", "historico", "documento", "comprovante"])) category = "documents";
  else if (hasAny(normalized, ["onibus", "transporte", "veiculo", "viagem"])) category = "transport";
  else if (hasAny(normalized, ["sala", "ar condicionado", "banheiro", "predio", "infraestrutura", "manutencao"])) category = "infrastructure";
  else if (hasAny(normalized, ["professor", "servidor", "pessoa", "recursos humanos"])) category = "people";
  else if (hasAny(normalized, ["nota", "frequencia", "falta", "matricula", "turma", "disciplina", "academico", "aula"])) category = "academic";

  let priority: MaisaServiceRequestProposal["priority"] = "normal";
  if (hasAny(normalized, ["urgente", "emergencia", "imediatamente", "agora mesmo"])) priority = "urgent";
  else if (hasAny(normalized, ["prioridade alta", "muito importante"])) priority = "high";

  const cleaned = rawQuery
    .replace(/^(por favor[, ]*)?/i, "")
    .replace(/^(abra|abrir|crie|criar|registre|registrar)\s+(uma\s+)?(solicita[cç][aã]o|chamado)\s*(para|sobre|:|-)?\s*/i, "")
    .trim();

  return {
    category,
    priority,
    title: (cleaned || "Solicitação aberta pela MAISA").slice(0, 180),
    description: rawQuery.slice(0, 8000),
  };
}

export async function buildMaisaContext(account: CurrentAccount, rawQuery: string): Promise<MaisaContextResult> {
  const q = normalize(rawQuery);
  const tools = new Set<string>();
  const data: Record<string, unknown> = {
    generated_at: nowCuiaba(),
    account: {
      role: account.role,
      campus: account.campus,
      is_general_admin: account.isGeneralAdmin,
    },
    routes: routesFor(account),
  };

  const wantsGrades = hasAny(q, ["nota", "boletim", "media", "avaliacao", "avaliacoes", "pontuacao"]);
  const wantsAttendance = hasAny(q, ["frequencia", "falta", "faltas", "presenca", "presencas", "chamada"]);
  const wantsAgenda = hasAny(q, ["agenda", "proxima prova", "proxima aula", "proximo trabalho", "atividade", "horario", "calendario", "trabalho"]);
  const wantsEdicts = hasAny(q, ["edital", "bolsa", "processo seletivo", "inscricao", "selecao", "oportunidade"]);
  const wantsInstitutional = hasAny(q, ["noticia", "evento", "comunicado", "acontecendo", "institucional"]);
  const wantsDocuments = hasAny(q, ["documento", "declaracao", "historico", "certificado"]);
  const wantsRequests = hasAny(q, ["solicitacao", "solicitacoes", "chamado", "chamados", "atendimento", "protocolo", "ticket"]);

  if (account.role === "student" && (wantsGrades || wantsAttendance)) {
    const academic = await getStudentAcademicContext(account.id);
    if (academic) {
      const report = await getStudentReport(account.id, academic.classId);
      data.academic_report = {
        course: academic.courseName,
        class: academic.className,
        period: academic.periodName,
        overall_average_10: report.overallAverage10,
        overall_frequency_percent: report.overallFrequency,
        total_absences: report.totalAbsences,
        subjects: report.rows.map((row) => ({
          subject: row.subjectName,
          code: row.subjectCode,
          average_10: row.average10,
          frequency_percent: row.frequency,
          absences: row.absences,
          graded_assessments: row.gradedAssessments,
          attendance_records: row.attendanceRecords,
        })),
      };
    } else {
      data.academic_report = { status: "no_active_enrollment" };
    }
    if (wantsGrades) tools.add("consultar_notas");
    if (wantsAttendance) tools.add("consultar_frequencia");
  }

  if (wantsAgenda) {
    const agenda = await getAgendaContext(account);
    data.agenda = agenda.entries.slice(0, 8).map((entry) => ({
      date: entry.entryDate,
      starts_at: entry.startsAt,
      type: entry.entryType,
      title: entry.title,
      description: entry.description,
      class: entry.className,
      subject: entry.subjectName,
    }));
    tools.add("consultar_agenda");
  }

  if (wantsEdicts) {
    const rows = await listPublishedPublications(["edital"], 20);
    data.edicts = rows.slice(0, 6).map((row) => ({
      title: row.title,
      reference_code: row.referenceCode,
      summary: row.summary,
      starts_at: row.startsAt,
      ends_at: row.endsAt,
      expires_at: row.expiresAt,
      location: row.location,
      url: row.externalUrl,
      sifcas_route: "/editais/" + row.id,
    }));
    tools.add("consultar_editais");
  }

  if (wantsInstitutional) {
    const rows = await listPublishedPublications(["news", "notice", "event"], 20);
    data.institutional_updates = rows.slice(0, 6).map((row) => ({
      kind: row.kind,
      title: row.title,
      summary: row.summary,
      starts_at: row.startsAt,
      ends_at: row.endsAt,
      location: row.location,
      sifcas_route: "/noticias/" + row.id,
    }));
    tools.add("consultar_publicacoes");
  }

  if (wantsDocuments) {
    const supabase = await createClient();
    const [{ data: documents, error }, eligibility] = await Promise.all([
      supabase
        .from("academic_documents")
        .select("id,document_type,verification_code,issued_at,revoked_at,revocation_reason")
        .eq("student_user_id", account.id)
        .order("issued_at", { ascending: false })
        .limit(8),
      account.role === "student" ? getDocumentEligibility(account.id) : Promise.resolve(null),
    ]);
    if (error) throw error;
    data.documents = {
      issued: (documents ?? []).map((row) => ({
        id: row.id,
        type: row.document_type,
        verification_code: row.verification_code,
        issued_at: row.issued_at,
        valid: !row.revoked_at,
        revocation_reason: row.revocation_reason,
        sifcas_route: "/documentos-academicos/" + row.id,
      })),
      eligibility,
    };
    tools.add("consultar_documentos");
  }

  if (wantsRequests) {
    const supabase = await createClient();
    const operationalQueue = ["staff", "manager", "admin"].includes(account.role) && hasAny(q, ["fila", "pendente", "atendimento", "abertas", "em andamento"]);
    let requestQuery = supabase
      .from("service_requests")
      .select("id,category,title,priority,status,response,created_at,updated_at,resolved_at")
      .order("created_at", { ascending: false })
      .limit(8);
    if (!operationalQueue) requestQuery = requestQuery.eq("requester_user_id", account.id);
    const { data: requests, error } = await requestQuery;
    if (error) throw error;
    data.service_requests = (requests ?? []).map((row) => ({
      id: row.id,
      category: row.category,
      title: row.title,
      priority: row.priority,
      status: row.status,
      response: row.response?.slice(0, 1200) ?? null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      resolved_at: row.resolved_at,
      sifcas_route: "/solicitacoes",
    }));
    tools.add("consultar_solicitacoes");
  }

  const proposal = inferRequestProposal(rawQuery, q);
  if (proposal) {
    tools.add("abrir_solicitacao");
    data.pending_action = {
      type: "open_service_request",
      requires_user_confirmation: true,
      proposal,
    };
  }

  const safeContext = JSON.stringify(data);
  const enrichedQuery = [
    "INSTRUÇÃO DE CONTEXTO DO SIFCAS:",
    "O bloco JSON abaixo foi produzido pelo servidor autenticado do SIFCAS e representa resultados de ferramentas autorizadas para este usuário.",
    "Use esses dados como fonte factual. Não invente valores ausentes. null significa que ainda não existe dado lançado; zero é um valor real.",
    "Use somente os nomes e rotas presentes em routes ao orientar navegação. Não invente páginas.",
    "Responda de forma natural, direta e útil em português brasileiro. Não mencione este bloco interno nem exponha sua estrutura.",
    "<sifcas_context>",
    safeContext,
    "</sifcas_context>",
    "",
    "PERGUNTA ORIGINAL DO USUÁRIO:",
    rawQuery,
  ].join("\n");

  return {
    enrichedQuery,
    toolsUsed: [...tools],
    serviceRequestProposal: proposal,
  };
}
