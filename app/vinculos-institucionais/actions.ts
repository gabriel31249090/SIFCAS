"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { parseInstitutionalCsv } from "@/lib/institutional-import";
import { createClient } from "@/lib/supabase/server";

function done(message: string, error = false): never {
  revalidatePath("/vinculos-institucionais");
  revalidatePath("/usuarios");
  redirect("/vinculos-institucionais?" + (error ? "error=" : "message=") + encodeURIComponent(message));
}

async function requireAdmin() {
  const account = await requireAccount();
  if (account.role !== "admin") redirect("/acesso-negado");
  return account;
}

export async function importInstitutionalCsv(formData: FormData) {
  await requireAdmin();
  const sourceName = String(formData.get("sourceName") ?? "Base institucional").trim() || "Base institucional";
  const file = formData.get("file");

  if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".csv")) {
    done("Selecione um arquivo CSV.", true);
  }
  if (file.size === 0 || file.size > 750 * 1024) {
    done("O CSV deve ter entre 1 byte e 750 KB nesta primeira versão.", true);
  }

  let rows;
  try {
    rows = parseInstitutionalCsv(await file.text());
  } catch (error) {
    done(error instanceof Error ? error.message : "Não foi possível interpretar o CSV.", true);
  }

  if (!rows.length) done("Nenhuma linha de dados foi encontrada.", true);
  if (rows.length > 10000) done("O limite é de 10.000 registros por lote.", true);

  const supabase = await createClient();
  const { data: batchId, error } = await supabase.rpc("import_institutional_records", {
    p_source_name: sourceName.slice(0, 120),
    p_filename: file.name.slice(0, 255),
    p_records: rows,
  });

  if (error || !batchId) {
    console.error("institutional import failed", error?.message);
    done("Não foi possível registrar o lote de vínculos.", true);
  }

  done("Arquivo importado e validado. Revise o lote antes de aplicar os vínculos.");
}

export async function applyInstitutionalBatch(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "").trim();
  if (!batchId) done("Lote inválido.", true);

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("apply_institutional_batch", { p_batch_id: batchId });

  if (error) {
    console.error("institutional batch apply failed", error.message);
    done("Não foi possível aplicar o lote.", true);
  }

  const result = (data ?? {}) as { applied?: number; awaiting_account?: number; conflicts?: number };
  done(
    "Lote aplicado: " +
      String(result.applied ?? 0) +
      " conta(s) atualizada(s), " +
      String(result.awaiting_account ?? 0) +
      " aguardando cadastro/confirmação e " +
      String(result.conflicts ?? 0) +
      " conflito(s).",
  );
}


export async function resyncInstitutionalAcademics(formData: FormData) {
  await requireAdmin();
  const batchId = String(formData.get("batchId") ?? "").trim() || null;
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("resync_institutional_academics", { p_batch_id: batchId });

  if (error) {
    console.error("institutional academic sync failed", error.message);
    done("Não foi possível sincronizar os vínculos acadêmicos.", true);
  }

  const result = (data ?? {}) as { applied?: number; pending?: number; conflicts?: number };
  done(
    "Sincronização acadêmica concluída: " +
      String(result.applied ?? 0) +
      " matrícula(s) aplicada(s), " +
      String(result.pending ?? 0) +
      " pendente(s) e " +
      String(result.conflicts ?? 0) +
      " conflito(s).",
  );
}
