import type { SupabaseClient } from "@supabase/supabase-js";

export type DiaryActor = { id: string; role: string; accountStatus: string };
export class DiaryValidationError extends Error {}

export const DIARY_PAGE_SIZE = 24;
const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function requireDiaryId(value: string) {
  if (!uuid.test(value)) throw new DiaryValidationError("Identificador acadêmico inválido.");
  return value;
}

export function diaryPage(value: unknown) {
  const raw = String(value ?? "1");
  return /^[1-9]\d{0,5}$/.test(raw) ? Number(raw) : 1;
}

export async function selectDiaryRecord<T extends { id: string }>(rows: T[], requestedId: string | undefined, loadInAuthorizedClass: (id: string) => Promise<T | null>): Promise<T | null> {
  if (!requestedId) return rows[0] ?? null;
  requireDiaryId(requestedId);
  const selected = rows.find((row) => row.id === requestedId) ?? await loadInAuthorizedClass(requestedId);
  if (!selected) throw new DiaryValidationError("O registro não pertence à turma autorizada.");
  return selected;
}

type Result<T> = { data: T[] | null; error: unknown; count?: number | null };

// PostgREST may cap a response even without limit(). Read deterministic ranges.
export async function readDiaryRows<T>(fetchRange: (from: number, to: number) => PromiseLike<Result<T>>, size = 200): Promise<T[]> {
  const rows: T[] = [];
  for (let from = 0; ;) {
    const result = await fetchRange(from, from + size - 1);
    if (result.error) throw result.error;
    const page = result.data ?? [];
    rows.push(...page);
    if (!page.length) return rows;
    // Advance by the rows received: the server may impose a smaller max_rows.
    from += page.length;
  }
}

export async function readDiaryIds<T>(ids: string[], fetchRange: (ids: string[], from: number, to: number) => PromiseLike<Result<T>>): Promise<T[]> {
  const rows: T[] = [];
  const uniqueIds = [...new Set(ids)];
  for (let offset = 0; offset < uniqueIds.length; offset += 100) {
    const group = uniqueIds.slice(offset, offset + 100);
    rows.push(...await readDiaryRows((from, to) => fetchRange(group, from, to)));
  }
  return rows;
}

export async function readDiaryPage<T>(fetchRange: (from: number, to: number) => PromiseLike<Result<T>>, requestedPage: unknown) {
  let page = diaryPage(requestedPage);
  let result = await fetchRange((page - 1) * DIARY_PAGE_SIZE, page * DIARY_PAGE_SIZE - 1);
  if (result.error) throw result.error;
  if (result.count === null || result.count === undefined) throw new Error("A contagem do diário não foi disponibilizada.");
  const total = result.count;
  const pages = Math.max(1, Math.ceil(total / DIARY_PAGE_SIZE));
  if (page > pages) {
    page = pages;
    result = await fetchRange((page - 1) * DIARY_PAGE_SIZE, page * DIARY_PAGE_SIZE - 1);
    if (result.error) throw result.error;
  }
  const rows = [...(result.data ?? [])];
  const start = (page - 1) * DIARY_PAGE_SIZE;
  const expected = Math.min(DIARY_PAGE_SIZE, Math.max(0, total - start));
  while (rows.length < expected) {
    const remainder = await fetchRange(start + rows.length, start + expected - 1);
    if (remainder.error) throw remainder.error;
    if (!remainder.data?.length) throw new Error("O histórico mudou durante a leitura. Atualize o diário.");
    rows.push(...remainder.data);
  }
  return { rows, page, pages, total };
}

export async function requireDiaryAccess(client: SupabaseClient, actor: DiaryActor, classSubjectId: string) {
  requireDiaryId(classSubjectId);
  if (actor.accountStatus !== "active" || !["teacher", "manager", "admin"].includes(actor.role)) {
    throw new DiaryValidationError("Você não possui permissão para essa turma.");
  }
  const { data: subject, error } = await client.from("class_subjects")
    .select("id,class_id").eq("id", classSubjectId).eq("active", true).maybeSingle();
  if (error || !subject) throw new DiaryValidationError("Você não possui permissão para essa turma.");
  if (actor.role === "teacher") {
    const { data: assignment, error: assignmentError } = await client.from("teaching_assignments")
      .select("class_subject_id").eq("class_subject_id", classSubjectId).eq("teacher_user_id", actor.id).limit(1).maybeSingle();
    if (assignmentError || !assignment) throw new DiaryValidationError("Você não possui permissão para essa turma.");
  }
  // Manager/admin reads AND writes still use the authenticated client and RLS.
  // No email, campus text from profiles, or form field substitutes an RLS policy.
  return { classId: String(subject.class_id), classSubjectId };
}

export async function requireDiaryRecord(client: SupabaseClient, table: "class_sessions" | "academic_assessments", recordId: string, classSubjectId: string) {
  requireDiaryId(recordId);
  const columns = table === "academic_assessments" ? "id,max_score" : "id";
  const { data, error } = await client.from(table).select(columns)
    .eq("id", recordId).eq("class_subject_id", classSubjectId).maybeSingle();
  if (error || !data) throw new DiaryValidationError("O registro não pertence à turma autorizada.");
  // Separate typed queries avoid trusting a maximum supplied by the browser.
  if (table === "academic_assessments") {
    const assessment = data as unknown as { id: string; max_score: number | string };
    const maxScore = Number(assessment.max_score);
    if (!Number.isFinite(maxScore) || maxScore <= 0) throw new DiaryValidationError("A escala da avaliação está inválida na origem.");
    return { id: assessment.id, maxScore };
  }
  return { id: recordId, maxScore: null };
}

export async function requireDiaryStudents(client: SupabaseClient, classId: string, requestedIds: string[]) {
  if (requestedIds.length > 1000) throw new DiaryValidationError("A chamada excede o limite de 1.000 estudantes por envio.");
  const ids = [...new Set(requestedIds.map(requireDiaryId))];
  for (let offset = 0; offset < ids.length; offset += 100) {
    const group = ids.slice(offset, offset + 100);
    const rows = await readDiaryRows((from, to) => client.from("enrollments")
      .select("id,student_user_id").eq("class_id", classId).eq("status", "active")
      .in("student_user_id", group).order("id").range(from, to));
    const permitted = new Set(rows.map((row) => row.student_user_id));
    if (group.some((id) => !permitted.has(id))) throw new DiaryValidationError("Há estudantes sem matrícula ativa nessa turma.");
  }
  return ids;
}

export function diaryGrade(raw: string, persistedMaximum: number) {
  const value = raw.trim();
  if (!value) return null;
  if (!/^\d+(?:[.,]\d+)?$/.test(value)) throw new DiaryValidationError("Informe notas numéricas; ausente, dispensado e campo vazio não equivalem a zero.");
  const score = Number(value.replace(",", "."));
  if (!Number.isFinite(persistedMaximum) || persistedMaximum <= 0 || !Number.isFinite(score) || score < 0 || score > persistedMaximum) {
    throw new DiaryValidationError(`Existe uma nota fora do intervalo 0–${persistedMaximum}.`);
  }
  return score;
}

export function diaryDate(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T12:00:00Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
}
