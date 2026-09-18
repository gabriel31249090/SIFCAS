import type { CurrentAccount } from "@/lib/auth";
import { getStudentAssessments } from "@/lib/experience";
import { createClient } from "@/lib/supabase/server";

export type PendingItem = {
  id: string;
  group: "notifications" | "services" | "processes" | "academic" | "applications" | "tcc";
  title: string;
  detail: string;
  href: string;
  status: string;
  date: string | null;
};

export type PendingOverview = {
  items: PendingItem[];
  counts: {
    notifications: number;
    services: number;
    processes: number;
    academic: number;
    applications: number;
    tcc: number;
  };
};

function rowDate(value: unknown) {
  return typeof value === "string" ? value : null;
}

export async function getPendingOverview(account: CurrentAccount): Promise<PendingOverview> {
  const supabase = await createClient();
  const items: PendingItem[] = [];

  const notificationsPromise = supabase
    .from("notifications")
    .select("id,title,body,created_at")
    .eq("user_id", account.id)
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(12);

  let serviceQuery = supabase
    .from("service_requests")
    .select("id,title,status,priority,updated_at,requester_user_id")
    .in("status", ["open", "in_progress", "waiting"])
    .order("updated_at", { ascending: false })
    .limit(20);
  if (!["staff", "manager", "admin"].includes(account.role)) {
    serviceQuery = serviceQuery.eq("requester_user_id", account.id);
  }

  let processQuery = supabase
    .from("electronic_processes")
    .select("id,protocol,subject,status,current_sector,updated_at,requester_user_id,responsible_user_id")
    .in("status", ["open", "triage", "in_progress", "waiting_user"])
    .order("updated_at", { ascending: false })
    .limit(20);
  if (!["staff", "manager", "admin"].includes(account.role)) {
    processQuery = processQuery.eq("requester_user_id", account.id);
  }

  const [notifications, services, processes] = await Promise.all([
    notificationsPromise,
    serviceQuery,
    processQuery,
  ]);

  if (notifications.error) throw notifications.error;
  if (services.error) throw services.error;
  if (processes.error) throw processes.error;

  for (const row of notifications.data ?? []) {
    items.push({
      id: "notification:" + row.id,
      group: "notifications",
      title: row.title,
      detail: row.body || "Notificação não lida.",
      href: "/notificacoes",
      status: "Não lida",
      date: rowDate(row.created_at),
    });
  }

  for (const row of services.data ?? []) {
    items.push({
      id: "service:" + row.id,
      group: "services",
      title: row.title,
      detail: "Prioridade " + row.priority + " • status " + row.status,
      href: "/solicitacoes",
      status: row.status,
      date: rowDate(row.updated_at),
    });
  }

  for (const row of processes.data ?? []) {
    items.push({
      id: "process:" + row.id,
      group: "processes",
      title: row.protocol + " • " + row.subject,
      detail: "Setor atual: " + row.current_sector,
      href: "/processos",
      status: row.status,
      date: rowDate(row.updated_at),
    });
  }

  if (account.role === "student") {
    const [assessments, internshipApps, aidApps, projectApps] = await Promise.all([
      getStudentAssessments(account.id),
      supabase
        .from("internship_applications")
        .select("id,status,applied_at,opportunity_id")
        .eq("student_user_id", account.id)
        .in("status", ["submitted", "under_review"])
        .order("applied_at", { ascending: false })
        .limit(10),
      supabase
        .from("student_aid_applications")
        .select("id,status,applied_at,program_id")
        .eq("student_user_id", account.id)
        .in("status", ["submitted", "under_review", "waitlist"])
        .order("applied_at", { ascending: false })
        .limit(10),
      supabase
        .from("project_applications")
        .select("id,status,applied_at,project_id")
        .eq("applicant_user_id", account.id)
        .in("status", ["submitted", "under_review"])
        .order("applied_at", { ascending: false })
        .limit(10),
    ]);

    const today = new Date().toISOString().slice(0, 10);
    for (const assessment of assessments.assessments.filter((entry) => entry.assessmentDate >= today).slice(0, 10)) {
      items.push({
        id: "assessment:" + assessment.id,
        group: "academic",
        title: assessment.subjectName + " • " + assessment.title,
        detail: "Avaliação prevista para " + assessment.assessmentDate,
        href: "/avaliacoes",
        status: "Próxima avaliação",
        date: assessment.assessmentDate,
      });
    }

    for (const result of [internshipApps, aidApps, projectApps]) {
      if (result.error) throw result.error;
    }
    for (const row of internshipApps.data ?? []) {
      items.push({
        id: "internship:" + row.id,
        group: "applications",
        title: "Candidatura de estágio",
        detail: "Aguardando andamento da candidatura.",
        href: "/estagios",
        status: row.status,
        date: rowDate(row.applied_at),
      });
    }
    for (const row of aidApps.data ?? []) {
      items.push({
        id: "aid:" + row.id,
        group: "applications",
        title: "Inscrição em auxílio estudantil",
        detail: "Acompanhe a análise do benefício.",
        href: "/auxilios",
        status: row.status,
        date: rowDate(row.applied_at),
      });
    }
    for (const row of projectApps.data ?? []) {
      items.push({
        id: "project:" + row.id,
        group: "applications",
        title: "Candidatura em projeto",
        detail: "A candidatura ainda não foi finalizada.",
        href: "/projetos",
        status: row.status,
        date: rowDate(row.applied_at),
      });
    }
  } else if (["teacher", "staff", "manager", "admin"].includes(account.role)) {
    const applicationQueries = [
      supabase.from("internship_applications").select("id,status,applied_at").in("status", ["submitted", "under_review"]).order("applied_at", { ascending: false }).limit(10),
      supabase.from("student_aid_applications").select("id,status,applied_at").in("status", ["submitted", "under_review", "waitlist"]).order("applied_at", { ascending: false }).limit(10),
      supabase.from("project_applications").select("id,status,applied_at").in("status", ["submitted", "under_review"]).order("applied_at", { ascending: false }).limit(10),
    ];
    const [internshipApps, aidApps, projectApps] = await Promise.all(applicationQueries);
    for (const result of [internshipApps, aidApps, projectApps]) {
      if (result.error) throw result.error;
    }
    for (const row of internshipApps.data ?? []) items.push({ id:"internship-review:"+row.id, group:"applications", title:"Candidatura de estágio para analisar", detail:"Existe uma candidatura aguardando decisão.", href:"/estagios", status:row.status, date:rowDate(row.applied_at) });
    for (const row of aidApps.data ?? []) items.push({ id:"aid-review:"+row.id, group:"applications", title:"Inscrição em auxílio para analisar", detail:"Existe uma inscrição aguardando decisão.", href:"/auxilios", status:row.status, date:rowDate(row.applied_at) });
    for (const row of projectApps.data ?? []) items.push({ id:"project-review:"+row.id, group:"applications", title:"Candidatura em projeto para analisar", detail:"Existe uma candidatura aguardando decisão.", href:"/projetos", status:row.status, date:rowDate(row.applied_at) });
  }

  if (["teacher", "manager", "admin"].includes(account.role)) {
    let tccQuery = supabase
      .from("tcc_defenses")
      .select("id,title,scheduled_at,status,advisor_user_id,created_by")
      .eq("status", "scheduled")
      .gte("scheduled_at", new Date().toISOString())
      .order("scheduled_at")
      .limit(12);
    const { data: tccRows, error: tccError } = await tccQuery;
    if (tccError) throw tccError;
    const visible = account.role === "teacher"
      ? (tccRows ?? []).filter((row) => row.advisor_user_id === account.id || row.created_by === account.id)
      : (tccRows ?? []);
    for (const row of visible) {
      items.push({
        id: "tcc:" + row.id,
        group: "tcc",
        title: row.title,
        detail: "Defesa de TCC agendada.",
        href: "/tcc",
        status: "Agendada",
        date: rowDate(row.scheduled_at),
      });
    }
  }

  const counts = {
    notifications: items.filter((item) => item.group === "notifications").length,
    services: items.filter((item) => item.group === "services").length,
    processes: items.filter((item) => item.group === "processes").length,
    academic: items.filter((item) => item.group === "academic").length,
    applications: items.filter((item) => item.group === "applications").length,
    tcc: items.filter((item) => item.group === "tcc").length,
  };

  return { items, counts };
}
