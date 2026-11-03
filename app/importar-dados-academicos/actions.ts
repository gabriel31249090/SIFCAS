"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { academicImportConfigured } from "@/lib/academic-import-server";
import { academicImportColumns, ACADEMIC_IMPORT_MAX_BYTES, parseAcademicCsv, type AcademicColumnMapping } from "@/lib/academic-import";
import { decodeCsvBytes } from "@/lib/csv";

function fail(message: string): never { redirect(`/importar-dados-academicos?error=${encodeURIComponent(message)}`); }
async function requireImporter() {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  if (!academicImportConfigured()) fail("Integração aguardando configuração e homologação do banco. Nenhum dado foi importado.");
  return account;
}

export async function previewAcademicImport(formData: FormData) {
  await requireImporter();
  const diaryId = String(formData.get("diaryId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(diaryId)) fail("Selecione um diário verificado.");
  const file = formData.get("file");
  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv") || file.size === 0 || file.size > ACADEMIC_IMPORT_MAX_BYTES) fail("Selecione um CSV UTF-8 entre 1 byte e 750 KB. Planilhas, macros e PDFs não são aceitos.");
  let parsed;
  try {
    const rawMapping = String(formData.get("mapping") ?? "").trim();
    const mapping: AcademicColumnMapping = rawMapping ? JSON.parse(rawMapping) : {};
    if (!mapping || typeof mapping !== "object" || Array.isArray(mapping) || Object.entries(mapping).some(([key, value]) => !(academicImportColumns as readonly string[]).includes(key) || typeof value !== "string" || !value || value.length > 160)) throw new Error("Mapeamento inválido: use um objeto JSON com nomes de campos SIFCAS e cabeçalhos do arquivo.");
    parsed = parseAcademicCsv(decodeCsvBytes(new Uint8Array(await file.arrayBuffer())), mapping);
  } catch (error) { fail(error instanceof Error ? error.message : "Arquivo inválido."); }
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("preview_academic_import", { p_diary_id: diaryId, p_external_id: parsed.diaryExternalId, p_period: parsed.period, p_filename: file.name.slice(0, 255), p_records: parsed.records });
  if (error || typeof data !== "string") fail(error?.code === "42501" ? "Sem permissão para este diário. O vínculo precisa ser validado na origem." : error?.code === "23514" ? "Há estudante sem vínculo verificado nesta turma. Solicite revisão dos identificadores; nenhum dado foi aplicado." : "Prévia indisponível. Confira identificadores/período e a extensão homologada do banco. Nenhum dado foi aplicado.");
  redirect(`/importar-dados-academicos/lotes/${data}`);
}

export async function confirmAcademicImport(formData: FormData) {
  await requireImporter();
  const batchId = String(formData.get("batchId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(batchId) || formData.get("confirmed") !== "yes") fail("Revise o lote e confirme a cópia de leitura.");
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_academic_import", { p_batch_id: batchId });
  if (error || data?.status !== "applied") fail(error?.code === "42501" ? "Sem permissão para aplicar este lote." : "Lote não aplicado: pode ter expirado ou conter conflito com uma importação mais recente. Retome a prévia e revise; nenhum lote parcial é confirmado.");
  for (const path of ["/importar-dados-academicos", "/diario-professor", "/gestao-academica", "/boletim", "/horarios", "/avaliacoes", "/agenda-aluno"]) revalidatePath(path);
  redirect(`/importar-dados-academicos/lotes/${batchId}`);
}

export async function cancelAcademicImport(formData: FormData) {
  await requireImporter();
  const batchId = String(formData.get("batchId") ?? "");
  if (!/^[0-9a-f-]{36}$/i.test(batchId)) fail("Lote inválido.");
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_academic_import", { p_batch_id: batchId });
  if (error) fail("Não foi possível cancelar: confira sua permissão e o estado do lote.");
  revalidatePath("/importar-dados-academicos");
  redirect("/importar-dados-academicos?message=Lote%20cancelado.%20Arquivo%20tempor%C3%A1rio%20descartado.");
}
