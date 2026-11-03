import "server-only";
import type { CurrentAccount } from "@/lib/auth";
import { getAgendaContext } from "@/lib/academic";
import { getStudentAssessments } from "@/lib/experience";
import { getImportedAcademicContext } from "@/lib/academic-import-server";
import { loadPublicNoticeCatalog } from "@/lib/public-notices-server";
import { effectiveNoticeStatus, type PublicNotice } from "@/lib/public-notices";
import { createClient } from "@/lib/supabase/server";
import { getRequestTimestamp } from "@/lib/request-time";
import { buildToday, calendarInCuiaba, cuiabaDate, nextScheduleDate, shiftDate, type TodayItem, type TodaySource } from "./home-today.ts";

async function personalEvents(account: CurrentAccount) {
  if (process.env.SIFCAS_PERSONAL_CALENDAR_ENABLED !== "true") return null;
  const client = await createClient();
  const rows: Array<{ uid: string; title: string; event_date: string; event_time: string | null; timezone: string | null; updated_at: string; cancelled: boolean }> = [];
  // No date filter until UTC events have been converted to Cuiabá.
  for (let from = 0; ; ) {
    const { data, error } = await client.from("personal_calendar_events").select("uid,title,event_date,event_time,timezone,updated_at,cancelled").eq("owner_id", account.id).order("uid").range(from, from + 199);
    if (error) throw error;
    if (!data?.length) break;
    rows.push(...data); from += data.length;
    if (rows.length > 10000) throw new Error("O calendário excedeu o limite de leitura.");
  }
  return rows;
}

export async function getHomeToday(account: CurrentAccount) {
  const now = new Date(getRequestTimestamp());
  const today = cuiabaDate(now);
  const items: TodayItem[] = [];
  const sources: TodaySource[] = [];
  const [agenda, academic, imported, personal, catalog] = await Promise.allSettled([
    getAgendaContext(account), account.role === "student" ? getStudentAssessments(account.id) : Promise.resolve(null),
    getImportedAcademicContext(account), personalEvents(account), loadPublicNoticeCatalog(),
  ]);
  const source = (id: string, label: string, status: TodaySource["status"], detail: string, href: string, updatedAt: string | null = null) => sources.push({ id, label, status, detail, href, updatedAt });
  const item = (value: TodayItem) => items.push(value);
  const localReady = agenda.status === "fulfilled" && academic.status === "fulfilled";
  source("local", "Agenda SIFCAS", localReady ? "ready" : "unavailable", localReady ? "Planejamento e avaliações locais consultados." : "Uma parte da agenda local não pôde ser consultada.", "/agenda-aluno");
  if (agenda.status === "fulfilled") for (const entry of agenda.value.entries) {
    if (account.role === "student" && entry.status !== "published") continue;
    if (entry.status === "cancelled") continue;
    const kind = entry.entryType === "exam" ? "assessment" : entry.entryType === "assignment" ? "task" : entry.entryType === "class" ? "class" : "event";
    item({ id: `agenda-${entry.id}`, kind, title: entry.title, detail: `${entry.subjectName} · ${entry.className}${entry.status === "draft" ? " · Rascunho local" : ""}`, date: entry.entryDate, time: entry.startsAt?.slice(0, 5) ?? null, href: "/agenda-aluno", sourceId: "local", sourceLabel: "SIFCAS · planejamento", imported: false, timeZone: "America/Cuiaba", updatedAt: null });
  }
  const academicContext = academic.status === "fulfilled" ? academic.value?.academic ?? null : null;
  if (academic.status === "fulfilled" && academic.value) {
    for (const assessment of academic.value.assessments) item({ id: `assessment-${assessment.id}`, kind: "assessment", title: assessment.title, detail: `${assessment.subjectName} · ${assessment.className}`, date: assessment.assessmentDate, time: null, href: "/avaliacoes", sourceId: "local", sourceLabel: "SIFCAS · avaliação local", imported: false, timeZone: null, updatedAt: null });
    for (const schedule of academicContext?.schedules ?? []) {
      const date = nextScheduleDate(today, schedule.weekday === 7 ? 0 : schedule.weekday);
      if (date) item({ id: `schedule-${schedule.id}`, kind: "class", title: schedule.subjectName, detail: `${academicContext?.className ?? "Turma"}${schedule.room ? ` · ${schedule.room}` : ""}`, date, time: schedule.startsAt.slice(0, 5), href: "/horarios", sourceId: "local", sourceLabel: "SIFCAS · grade semanal", imported: false, timeZone: "America/Cuiaba", updatedAt: null });
    }
  }
  const copied = imported.status === "fulfilled" && imported.value.status !== "unavailable" ? imported.value.diaries : null;
  const lastImported = copied?.map((diary) => diary.updatedAt).filter((value): value is string => !!value).sort().at(-1) ?? null;
  source("files", "Diários por arquivo", copied ? "imported" : process.env.SIFCAS_ACADEMIC_IMPORT_ENABLED === "true" ? "unavailable" : "not_configured", copied ? "Cópias de leitura; atualização por nova importação." : "Aguardando configuração ou acesso ao armazenamento de cópias.", "/importar-dados-academicos", lastImported);
  for (const diary of copied ?? []) for (const record of diary.records) {
    const payload = record.payload;
    let date = typeof payload.date === "string" ? payload.date : "";
    if (record.kind === "schedule" && typeof payload.weekday === "number") date = nextScheduleDate(today, payload.weekday) ?? "";
    if (!["session", "assessment", "event", "schedule"].includes(record.kind) || !date) continue;
    const kind = record.kind === "assessment" ? "assessment" : record.kind === "event" ? "event" : "class";
    item({ id: `${diary.id}:${record.kind}:${record.externalId}`, kind, title: String(payload.title ?? (record.kind === "session" ? payload.content : diary.label) ?? diary.label).slice(0, 160), detail: diary.label, date, time: typeof payload.starts_at === "string" ? payload.starts_at : null, href: account.role === "student" ? "/agenda-aluno" : `/diario-professor?vinculo=${encodeURIComponent(diary.classSubjectId)}`, sourceId: "files", sourceLabel: `Arquivo · ${diary.instance === "sifcas-layout" ? "layout SIFCAS" : diary.instance.includes("suap") ? "SUAP" : "AVA"}`, imported: true, timeZone: null, updatedAt: diary.updatedAt });
  }
  const calendarRows = personal.status === "fulfilled" ? personal.value : null;
  source("calendar", "Calendário do AVA", calendarRows ? "imported" : process.env.SIFCAS_PERSONAL_CALENDAR_ENABLED === "true" ? "unavailable" : "not_configured", calendarRows ? "Arquivo pessoal; não confirma entrega ou correção no AVA." : "Importação privada .ics aguardando configuração.", "/importar-calendario", calendarRows?.map((row) => row.updated_at).sort().at(-1) ?? null);
  for (const event of calendarRows ?? []) {
    if (event.cancelled) continue;
    const converted = calendarInCuiaba({ date: event.event_date, time: event.event_time, timezone: event.timezone });
    if (converted) item({ id: event.uid, kind: "event", title: event.title, detail: "Seu calendário privado", ...converted, href: "/agenda-aluno", sourceId: "calendar", sourceLabel: "AVA · arquivo pessoal", imported: true, updatedAt: event.updated_at });
  }
  let notices: PublicNotice[] = [];
  if (catalog.status === "fulfilled") {
    notices = catalog.value.notices.filter((notice) => ["open", "scheduled"].includes(effectiveNoticeStatus(notice, now)) && (notice.campus === "Cáceres" || notice.campus === "Institucional"));
    source("notices", "Editais públicos", "ready", "Catálogo editorial revisado; confirme a situação na fonte oficial.", "/editais", catalog.value.notices.map((notice) => notice.verifiedOn).sort().at(-1) ?? null);
    if (catalog.value.editorialStatus === "unavailable") source("editorial", "Publicações do banco", "unavailable", "Fonte editorial indisponível; o catálogo público anterior foi preservado.", "/editais");
    for (const notice of notices) if (notice.closes) item({ id: notice.id, kind: "notice", title: `Prazo · ${notice.title}`, detail: notice.campus, date: notice.closes.date, time: notice.closes.time ?? null, timeZone: notice.closes.timeZone ?? null, href: `/editais?campus=all&q=${encodeURIComponent(`${notice.number}/${notice.year}`)}#${notice.id}`, sourceId: "notices", sourceLabel: "Edital · fonte oficial", imported: false, updatedAt: notice.verifiedOn });
  } else source("notices", "Editais públicos", "unavailable", "O catálogo não pôde ser consultado. Consulte o painel oficial.", "/editais");
  source("suap", "SUAP direto", "not_configured", "Leitura automática depende de autorização institucional.", "/campus/suap");
  source("moodle", "AVA direto", "not_configured", "Atividades e correções permanecem no ambiente da sua turma.", "/campus/ava-moodle");
  return { ...buildToday(items, sources, now), academic: academicContext, notices, horizon: shiftDate(today, 7) };
}
