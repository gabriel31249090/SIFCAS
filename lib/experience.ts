import type { AppRole, CurrentAccount } from "@/lib/auth";
import { getStudentAcademicContext } from "@/lib/academic";
import { createClient } from "@/lib/supabase/server";

export type ShortcutItem = { id: string; label: string; href: string; sortOrder: number };
export type KnowledgeArticle = {
  id: string;
  slug: string;
  title: string;
  summary: string;
  content: string;
  category: string;
  status: string;
};
export type NotificationPreferences = {
  institutional: boolean;
  serviceRequests: boolean;
  academic: boolean;
  system: boolean;
};
export type StudentAssessment = {
  id: string;
  title: string;
  description: string;
  assessmentDate: string;
  maxScore: number;
  weight: number;
  subjectName: string;
  subjectCode: string;
  className: string;
};
export type AttentionItem = { label: string; value: string; detail: string; href: string; kind: "info" | "warn" | "danger" };

type CatalogItem = { label: string; href: string; roles?: AppRole[] };

const shortcutCatalog: CatalogItem[] = [
  { label: "MAISA", href: "/maisa" },
  { label: "Notificações", href: "/notificacoes" },
  { label: "Central de Pendências", href: "/pendencias" },
  { label: "Solicitações", href: "/solicitacoes" },
  { label: "Base de conhecimento", href: "/base-conhecimento" },
  { label: "Editais", href: "/editais" },
  { label: "Notícias e eventos", href: "/noticias" },
  { label: "Agenda institucional", href: "/agenda-institucional" },
  { label: "Documentos e processos", href: "/documentos" },
  { label: "Reportar erro", href: "/reportar-erro" },
  { label: "Oportunidades", href: "/oportunidades" },
  { label: "Processos eletrônicos", href: "/processos" },
  { label: "Estágios", href: "/estagios" },
  { label: "Auxílios estudantis", href: "/auxilios" },
  { label: "Projetos institucionais", href: "/projetos" },
  { label: "Agenda de TCC", href: "/tcc" },
  { label: "Meu perfil", href: "/perfil" },
  { label: "Boletim e frequência", href: "/boletim", roles: ["student"] },
  { label: "Minhas disciplinas", href: "/disciplinas", roles: ["student"] },
  { label: "Horários de aula", href: "/horarios", roles: ["student"] },
  { label: "Minhas avaliações", href: "/avaliacoes", roles: ["student"] },
  { label: "Agenda do aluno", href: "/agenda-aluno", roles: ["student", "teacher", "manager", "admin"] },
  { label: "Documentos acadêmicos", href: "/documentos-academicos", roles: ["student", "manager", "admin"] },
  { label: "Diário do professor", href: "/diario-professor", roles: ["teacher", "manager", "admin"] },
  { label: "Painel institucional", href: "/painel-institucional", roles: ["staff", "manager", "admin"] },
  { label: "Gestão acadêmica", href: "/gestao-academica", roles: ["manager", "admin"] },
  { label: "Auditoria", href: "/auditoria", roles: ["manager", "admin"] },
  { label: "Monitoramento", href: "/monitoramento", roles: ["manager", "admin"] },
  { label: "Usuários e permissões", href: "/usuarios", roles: ["admin"] },
  { label: "Vínculos institucionais", href: "/vinculos-institucionais", roles: ["admin"] },
];

export function getShortcutCatalog(role: AppRole) {
  return shortcutCatalog.filter((item) => !item.roles || item.roles.includes(role));
}

export async function listUserShortcuts(userId: string): Promise<ShortcutItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("user_shortcuts")
    .select("id,label,href,sort_order")
    .eq("user_id", userId)
    .order("sort_order")
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({ id: row.id, label: row.label, href: row.href, sortOrder: row.sort_order }));
}

export async function listKnowledgeArticles(): Promise<KnowledgeArticle[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("knowledge_articles")
    .select("id,slug,title,summary,content,category,status")
    .order("sort_order")
    .order("title");
  if (error) throw error;
  return data ?? [];
}

export async function getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notification_preferences")
    .select("institutional,service_requests,academic,system")
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw error;
  return {
    institutional: data?.institutional ?? true,
    serviceRequests: data?.service_requests ?? true,
    academic: data?.academic ?? true,
    system: data?.system ?? true,
  };
}

export async function listBugReports(account: CurrentAccount) {
  const supabase = await createClient();
  let query = supabase
    .from("bug_reports")
    .select("id,user_id,route,title,description,status,response,managed_by,created_at,updated_at,resolved_at")
    .order("created_at", { ascending: false })
    .limit(120);
  if (!["staff", "manager", "admin"].includes(account.role)) query = query.eq("user_id", account.id);
  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
}

export async function getStudentAssessments(userId: string): Promise<{ academic: Awaited<ReturnType<typeof getStudentAcademicContext>>; assessments: StudentAssessment[] }> {
  const academic = await getStudentAcademicContext(userId);
  if (!academic) return { academic: null, assessments: [] };
  const supabase = await createClient();

  const { data: classSubjects, error: csError } = await supabase
    .from("class_subjects")
    .select("id,subject_id")
    .eq("class_id", academic.classId)
    .eq("active", true);
  if (csError) throw csError;
  const classSubjectIds = (classSubjects ?? []).map((row) => row.id);
  if (!classSubjectIds.length) return { academic, assessments: [] };

  const subjectIds = [...new Set((classSubjects ?? []).map((row) => row.subject_id))];
  const [{ data: subjects, error: subjectsError }, { data: rows, error: assessmentsError }] = await Promise.all([
    supabase.from("subjects").select("id,name,code").in("id", subjectIds),
    supabase
      .from("academic_assessments")
      .select("id,class_subject_id,title,description,assessment_date,max_score,weight")
      .in("class_subject_id", classSubjectIds)
      .order("assessment_date"),
  ]);
  if (subjectsError) throw subjectsError;
  if (assessmentsError) throw assessmentsError;

  const subjectMap = new Map((subjects ?? []).map((subject) => [subject.id, subject]));
  const subjectByClassSubject = new Map((classSubjects ?? []).map((row) => [row.id, subjectMap.get(row.subject_id)]));

  return {
    academic,
    assessments: (rows ?? []).map((row) => {
      const subject = subjectByClassSubject.get(row.class_subject_id);
      return {
        id: row.id,
        title: row.title,
        description: row.description ?? "",
        assessmentDate: row.assessment_date,
        maxScore: Number(row.max_score),
        weight: Number(row.weight),
        subjectName: subject?.name ?? "Disciplina",
        subjectCode: subject?.code ?? "",
        className: academic.className,
      };
    }),
  };
}

export async function getHomeAttention(account: CurrentAccount): Promise<AttentionItem[]> {
  const supabase = await createClient();
  const [notifications, requests, reports] = await Promise.all([
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", account.id).is("read_at", null),
    supabase.from("service_requests").select("id", { count: "exact", head: true }).eq("requester_user_id", account.id).in("status", ["open", "in_progress", "waiting"]),
    supabase.from("bug_reports").select("id", { count: "exact", head: true }).eq("user_id", account.id).in("status", ["open", "reviewing"]),
  ]);

  const items: AttentionItem[] = [
    {
      label: "Notificações não lidas",
      value: String(notifications.count ?? 0),
      detail: (notifications.count ?? 0) ? "Existem avisos aguardando leitura." : "Nenhum aviso pendente.",
      href: "/notificacoes",
      kind: (notifications.count ?? 0) ? "warn" : "info",
    },
    {
      label: "Solicitações em andamento",
      value: String(requests.count ?? 0),
      detail: (requests.count ?? 0) ? "Acompanhe respostas e mudanças de status." : "Nenhuma solicitação ativa.",
      href: "/solicitacoes",
      kind: "info",
    },
    {
      label: "Erros reportados",
      value: String(reports.count ?? 0),
      detail: (reports.count ?? 0) ? "Há relatos seus ainda em análise." : "Nenhum relato aberto.",
      href: "/reportar-erro",
      kind: "info",
    },
  ];

  if (account.role === "student") {
    const { assessments } = await getStudentAssessments(account.id);
    const today = new Date().toISOString().slice(0, 10);
    const upcoming = assessments.filter((assessment) => assessment.assessmentDate >= today);
    items.push({
      label: "Próximas avaliações",
      value: String(upcoming.length),
      detail: upcoming[0] ? upcoming[0].subjectName + " • " + upcoming[0].title : "Nenhuma avaliação futura cadastrada.",
      href: "/avaliacoes",
      kind: upcoming.length ? "warn" : "info",
    });
  }

  return items;
}
