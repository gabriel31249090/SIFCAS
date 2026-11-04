import "server-only";
import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type ImportedDiary = {
  id: string; classSubjectId: string; label: string; instance: string; externalId: string;
  period: string; updatedAt: string | null; counts: Record<string, number>;
  records: Array<{ kind: string; externalId: string; studentExternalId: string | null; payload: Record<string, string | number | null> }>;
};
export type ImportedAcademicContext = { status: "ready" | "unavailable" | "empty"; diaries: ImportedDiary[] };
export const academicImportConfigured = () => process.env.SIFCAS_ACADEMIC_IMPORT_ENABLED === "true";

/** Usa somente o cliente da sessão e suas políticas RLS. */
export async function getImportedAcademicContext(account: CurrentAccount, classSubjectId?: string): Promise<ImportedAcademicContext> {
  if (!academicImportConfigured() || account.accountStatus !== "active") return { status: "unavailable", diaries: [] };
  try {
    const supabase = await createClient();
    const diaries: Array<{ id: string; class_subject_id: string; label: string; instance: string; external_id: string; period: string; updated_at: string | null }> = [];
    let diaryCount: number | null = null;
    for (let from = 0; ; ) {
      let query = supabase.from("academic_import_diaries").select("id,class_subject_id,label,instance,external_id,period,updated_at", { count: "exact" }).order("id").range(from, from + 499);
      if (classSubjectId) query = query.eq("class_subject_id", classSubjectId);
      const { data, error, count } = await query;
      if (error || count === null || (diaryCount !== null && diaryCount !== count)) return { status: "unavailable", diaries: [] };
      diaryCount = count;
      diaries.push(...(data ?? []));
      if (diaries.length === count) break;
      if (!data?.length || diaries.length > count || diaries.length > 1000) return { status: "unavailable", diaries: [] };
      from += data.length;
    }
    if (!diaries.length) return { status: "empty", diaries: [] };
    const records: Array<{ diary_id: string; kind: string; external_id: string; student_external_id: string | null; payload: Record<string, string | number | null> }> = [];
    let recordCount: number | null = null;
    for (let from = 0; ; ) {
      const result = await supabase.from("academic_import_records").select("diary_id,kind,external_id,student_external_id,payload", { count: "exact" }).in("diary_id", diaries.map((d) => d.id)).order("diary_id").order("kind").order("external_id").range(from, from + 499);
      if (result.error || result.count === null || (recordCount !== null && recordCount !== result.count)) return { status: "unavailable", diaries: [] };
      recordCount = result.count;
      records.push(...(result.data ?? []));
      if (records.length === result.count) break;
      if (!result.data?.length || records.length > result.count || records.length > 100000) return { status: "unavailable", diaries: [] };
      from += result.data.length;
    }
    return { status: "ready", diaries: diaries.map((d) => {
      const own = records.filter((r) => r.diary_id === d.id);
      const counts: Record<string, number> = {};
      for (const row of own) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
      return { id: d.id, classSubjectId: d.class_subject_id, label: d.label, instance: d.instance, externalId: d.external_id, period: d.period, updatedAt: d.updated_at, counts, records: own.map((r) => ({ kind: r.kind, externalId: r.external_id, studentExternalId: r.student_external_id, payload: r.payload })) };
    }) };
  } catch { return { status: "unavailable", diaries: [] }; }
}

export type AcademicImportBatch = {
  id: string; diary_id: string; filename: string; status: string; total_rows: number;
  inserted_rows: number; unchanged_rows: number; payload_hash: string;
  conflicts: Array<{ kind: string; external_id: string; reason: string }>;
  created_at: string; expires_at: string; applied_at: string | null;
  payload: Array<{ kind: string; external_id: string; student_external_id?: string | null; payload: Record<string, string | number | null> }> | null;
};

export async function getAcademicImportBatches(account: CurrentAccount): Promise<AcademicImportBatch[]> {
  if (!academicImportConfigured()) return [];
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_import_batches").select("id,diary_id,filename,status,total_rows,inserted_rows,unchanged_rows,payload_hash,conflicts,created_at,expires_at,applied_at").eq("owner_id", account.id).order("created_at", { ascending: false }).limit(30);
  if (error) throw new Error("Histórico indisponível. Confira a instalação homologada da extensão.");
  return (data ?? []).map((row) => ({ ...row, payload: null })) as AcademicImportBatch[];
}

export async function getAcademicImportBatch(account: CurrentAccount, id: string): Promise<AcademicImportBatch | null> {
  if (!academicImportConfigured() || !/^[0-9a-f-]{36}$/i.test(id)) return null;
  const supabase = await createClient();
  const { data, error } = await supabase.from("academic_import_batches").select("id,diary_id,filename,status,total_rows,inserted_rows,unchanged_rows,payload_hash,conflicts,created_at,expires_at,applied_at,payload").eq("id", id).eq("owner_id", account.id).maybeSingle();
  if (error) throw new Error("Não foi possível abrir o lote.");
  return data as AcademicImportBatch | null;
}
