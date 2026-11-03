import "server-only";
import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { academicImportConfigured, getImportedAcademicContext, type AcademicImportBatch } from "@/lib/academic-import-server";
import { readDiaryIds, readDiaryRows } from "@/lib/diary-security";
import { getRequestTimestamp } from "@/lib/request-time";
import { scopedTeacherCopies, summarizeTeacherCopy, type TeacherClassCard, type TeacherSourceStatus } from "./teacher-workspace-domain.ts";

export type TeacherWorkspace = {
  status: "ready" | "partial" | "unavailable" | "empty" | "forbidden";
  localStatus: TeacherSourceStatus;
  importStatus: TeacherSourceStatus;
  historyStatus: TeacherSourceStatus;
  cards: TeacherClassCard[];
  conflicts: Array<Pick<AcademicImportBatch, "id" | "diary_id" | "filename" | "conflicts" | "created_at" | "expires_at">>;
};

export async function getTeacherWorkspace(account: CurrentAccount): Promise<TeacherWorkspace> {
  const empty: TeacherWorkspace = { status: "unavailable", localStatus: "unavailable", importStatus: academicImportConfigured() ? "unavailable" : "not_configured", historyStatus: "unavailable", cards: [], conflicts: [] };
  if (account.accountStatus !== "active" || !["teacher", "manager", "admin"].includes(account.role)) return { ...empty, status: "forbidden" };

  const imported = await getImportedAcademicContext(account);
  const importStatus: TeacherSourceStatus = !academicImportConfigured() ? "not_configured" : imported.status === "unavailable" ? "unavailable" : "ready";
  let classSubjectIds: string[] = [];
  let scopeUnavailable = false;
  let client: Awaited<ReturnType<typeof createClient>>;
  try {
    client = await createClient();
    if (account.role === "teacher") {
      const assignments = await readDiaryRows((from, to) => client.from("teaching_assignments")
        .select("class_subject_id").eq("teacher_user_id", account.id).order("class_subject_id").range(from, to));
      classSubjectIds = [...new Set(assignments.map((row) => String(row.class_subject_id)))];
    } else {
      // This helper reads only diaries whose RLS verifies explicit operator scopes.
      // No SELECT permission to the private operator scope mapping is presumed.
      classSubjectIds = [...new Set(imported.diaries.map((diary) => diary.classSubjectId))];
      scopeUnavailable = importStatus !== "ready";
    }
  } catch {
    return { ...empty, importStatus };
  }

  const copies = scopedTeacherCopies(imported.diaries, classSubjectIds);
  if (!classSubjectIds.length) return {
    ...empty, status: scopeUnavailable ? "unavailable" : "empty", localStatus: scopeUnavailable ? "unavailable" : "ready", importStatus,
    historyStatus: importStatus === "not_configured" ? "not_configured" : "ready",
  };

  type ClassSubject = { id: string; class_id: string; subject_id: string };
  type ClassRow = { id: string; name: string; code: string; academic_period_id: string };
  type SubjectRow = { id: string; name: string; code: string };
  type PeriodRow = { id: string; name: string };
  type EnrollmentRow = { id: string; class_id: string };
  type SessionRow = { id: string; class_subject_id: string };
  type AssessmentRow = { id: string; class_subject_id: string };

  let classSubjects: ClassSubject[] = [];
  let classes: ClassRow[] = [];
  let subjects: SubjectRow[] = [];
  let periods: PeriodRow[] = [];
  let enrollments: EnrollmentRow[] | null = null;
  let sessions: SessionRow[] | null = null;
  let assessments: AssessmentRow[] | null = null;
  let localStatus: TeacherSourceStatus = "ready";
  try {
    classSubjects = await readDiaryIds(classSubjectIds, (ids, from, to) => client.from("class_subjects")
      .select("id,class_id,subject_id").in("id", ids).eq("active", true).order("id").range(from, to));
    const classIds = [...new Set(classSubjects.map((row) => row.class_id))];
    const subjectIds = [...new Set(classSubjects.map((row) => row.subject_id))];
    [classes, subjects] = await Promise.all([
      readDiaryIds(classIds, (ids, from, to) => client.from("classes").select("id,name,code,academic_period_id").in("id", ids).order("id").range(from, to)),
      readDiaryIds(subjectIds, (ids, from, to) => client.from("subjects").select("id,name,code").in("id", ids).order("id").range(from, to)),
    ]);
    periods = await readDiaryIds([...new Set(classes.map((row) => row.academic_period_id).filter(Boolean))], (ids, from, to) => client.from("academic_periods").select("id,name").in("id", ids).order("id").range(from, to));
    const results = await Promise.allSettled([
      readDiaryIds(classIds, (ids, from, to) => client.from("enrollments").select("id,class_id").in("class_id", ids).eq("status", "active").order("id").range(from, to)),
      readDiaryIds(classSubjectIds, (ids, from, to) => client.from("class_sessions").select("id,class_subject_id").in("class_subject_id", ids).order("id").range(from, to)),
      readDiaryIds(classSubjectIds, (ids, from, to) => client.from("academic_assessments").select("id,class_subject_id").in("class_subject_id", ids).order("id").range(from, to)),
    ]);
    if (results[0].status === "fulfilled") enrollments = results[0].value;
    if (results[1].status === "fulfilled") sessions = results[1].value;
    if (results[2].status === "fulfilled") assessments = results[2].value;
    if (results.some((result) => result.status === "rejected")) localStatus = "unavailable";
  } catch { localStatus = "unavailable"; }

  const classSubjectMap = new Map(classSubjects.map((row) => [row.id, row]));
  const classMap = new Map(classes.map((row) => [row.id, row]));
  const subjectMap = new Map(subjects.map((row) => [row.id, row]));
  const periodMap = new Map(periods.map((row) => [row.id, row.name]));
  const visibleIds = [...new Set([...classSubjects.map((row) => row.id), ...copies.map((diary) => diary.classSubjectId)])];
  const cards = visibleIds.map((id): TeacherClassCard => {
    const classSubject = classSubjectMap.get(id);
    const classRow = classSubject ? classMap.get(classSubject.class_id) : undefined;
    const subject = classSubject ? subjectMap.get(classSubject.subject_id) : undefined;
    const localPeriod = classRow ? periodMap.get(classRow.academic_period_id) ?? null : null;
    const ownCopies = copies.filter((copy) => copy.classSubjectId === id);
    return {
      id, className: classRow?.name || ownCopies[0]?.label || "Turma vinculada", subjectName: subject?.name || "Disciplina a confirmar", code: classRow?.code || "",
      localPeriod, periods: [...new Set([localPeriod, ...ownCopies.map((copy) => copy.period)].filter((period): period is string => !!period))].sort(),
      local: {
        status: localStatus,
        enrollments: enrollments && classSubject ? enrollments.filter((row) => row.class_id === classSubject.class_id).length : null,
        sessions: sessions && classSubject ? sessions.filter((row) => row.class_subject_id === id).length : null,
        assessments: assessments && classSubject ? assessments.filter((row) => row.class_subject_id === id).length : null,
      },
      copies: ownCopies.map(summarizeTeacherCopy),
    };
  }).sort((a, b) => `${a.className} ${a.subjectName}`.localeCompare(`${b.className} ${b.subjectName}`, "pt-BR"));

  let conflicts: TeacherWorkspace["conflicts"] = [];
  let historyStatus: TeacherSourceStatus = academicImportConfigured() ? "unavailable" : "not_configured";
  if (importStatus === "ready") {
    try {
      const allowedDiaries = new Set(copies.map((copy) => copy.id));
      const now = getRequestTimestamp();
      const batches = await readDiaryRows((from, to) => client.from("academic_import_batches")
        .select("id,diary_id,filename,conflicts,created_at,expires_at")
        .eq("owner_id", account.id).eq("status", "preview").gt("expires_at", new Date(now).toISOString())
        .order("created_at", { ascending: false }).order("id").range(from, to));
      conflicts = batches.filter((batch) => allowedDiaries.has(batch.diary_id) && Array.isArray(batch.conflicts) && batch.conflicts.length > 0);
      historyStatus = "ready";
    } catch { historyStatus = "unavailable"; }
  }
  return {
    status: cards.length === 0 ? localStatus === "ready" ? "empty" : "unavailable"
      : localStatus === "ready" && importStatus !== "unavailable" && historyStatus !== "unavailable" ? "ready" : "partial",
    localStatus, importStatus, historyStatus, cards, conflicts,
  };
}
