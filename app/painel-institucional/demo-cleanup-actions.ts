"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { requireAccount } from "@/lib/auth";
import { supabaseUrl } from "@/lib/supabase/config";

const DEMO_SOURCE = "SIFCAS-DEMO-2026";
const CONFIRMATION_TEXT = "EXCLUIR DADOS DEMO";
const TOKEN_LIFETIME_MS = 10 * 60 * 1000;
const BATCH_SIZE = 6;

type DemoCounts = {
  safe: boolean;
  blockers: string[];
  fingerprint: string;
  identities: number;
  users: number;
  classes: number;
  enrollments: number;
  sessions: number;
  assessments: number;
  grades: number;
  attendance: number;
  calendar: number;
  publications: number;
  projects: number;
  articles: number;
};

export type DemoCleanupResult =
  | { state: "preview"; counts: DemoCounts; ticket: string }
  | { state: "progress"; deleted: number; remaining: number; total: number }
  | { state: "done"; deleted: number; remaining: 0 }
  | { state: "error"; message: string };

function serverClient(): { admin: SupabaseClient; key: string } | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return {
    key,
    admin: createClient(supabaseUrl, key, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

function sign(userId: string, issuedAt: number, fingerprint: string, key: string) {
  return createHmac("sha256", key)
    .update(`SIFCAS_DEMO_CLEANUP_V1|${userId}|${issuedAt}|${fingerprint}`)
    .digest("hex");
}

function verifiedTicket(ticket: string, userId: string, fingerprint: string, key: string) {
  const parts = ticket.split(".");
  if (parts.length !== 3) return false;
  const [when, suppliedFingerprint, signature] = parts;
  if (!/^\d{13}$/.test(when) || !/^[a-f0-9]{32}$/.test(suppliedFingerprint) ||
      !/^[a-f0-9]{64}$/.test(signature)) return false;
  const issuedAt = Number(when);
  const age = Date.now() - issuedAt;
  if (age < 0 || age > TOKEN_LIFETIME_MS || suppliedFingerprint !== fingerprint) return false;
  const expected = Buffer.from(sign(userId, issuedAt, fingerprint, key), "hex");
  return timingSafeEqual(expected, Buffer.from(signature, "hex"));
}

function isExpectedDemoAccount(record: {
  record_key: string; institutional_email: string; proposed_role: string;
}, account: { email?: string; app_metadata?: Record<string, unknown> }) {
  const email = account.email?.toLowerCase();
  if (!email || email !== record.institutional_email.toLowerCase()) return false;
  if (record.record_key === "teacher-test") {
    return email === "professorteste@gmail.com" && record.proposed_role === "teacher";
  }
  const match = /^(student|teacher|staff)-([1-9][0-9]?)$/.exec(record.record_key);
  if (!match) return false;
  const number = Number(match[2]);
  const max = match[1] === "student" ? 50 : match[1] === "teacher" ? 10 : 8;
  return number <= max &&
    email === `demo-${record.record_key}@example.com` &&
    record.proposed_role === match[1] &&
    account.app_metadata?.sifcas_demo === true;
}

async function requireGeneralAdminId(): Promise<string | null> {
  const account = await requireAccount();
  if (account.role !== "admin" || !account.isGeneralAdmin || account.accountStatus !== "active")
    return null;
  return account.id;
}

async function getCounts(admin: SupabaseClient): Promise<DemoCounts | null> {
  const { data, error } = await admin.rpc("sifcas_demo_cleanup_preview");
  if (error || !data || typeof data !== "object") return null;
  const counts = data as DemoCounts;
  return typeof counts.safe === "boolean" &&
    typeof counts.fingerprint === "string" ? counts : null;
}

export async function previewDemoCleanup(): Promise<DemoCleanupResult> {
  const userId = await requireGeneralAdminId();
  if (!userId) return { state: "error", message: "Apenas o administrador geral ativo pode limpar a demonstração." };
  const access = serverClient();
  if (!access) return { state: "error", message: "SUPABASE_SERVICE_ROLE_KEY não configurada no servidor." };
  const counts = await getCounts(access.admin);
  if (!counts) return { state: "error", message: "Não foi possível consultar a prévia segura do banco." };
  if (counts.identities === 0) return { state: "done", deleted: 0, remaining: 0 };
  const issuedAt = Date.now();
  const ticket = `${issuedAt}.${counts.fingerprint}.${sign(userId, issuedAt, counts.fingerprint, access.key)}`;
  return { state: "preview", counts, ticket };
}

/** A remoção é manual, restrita ao admin geral, confirmada por frase e idempotente. */
export async function confirmDemoCleanup(ticket: string, phrase: string): Promise<DemoCleanupResult> {
  const userId = await requireGeneralAdminId();
  if (!userId) return { state: "error", message: "Permissão negada: administrador geral obrigatório." };
  if (phrase.trim() !== CONFIRMATION_TEXT) return {
    state: "error", message: "A frase de confirmação não corresponde à exigida.",
  };
  const access = serverClient();
  if (!access) return { state: "error", message: "Credencial administrativa indisponível na Vercel." };
  const counts = await getCounts(access.admin);
  if (!counts || !counts.safe || counts.identities !== 69) return {
    state: "error", message: "O banco mudou ou possui dados que exigem revisão; nada foi excluído.",
  };
  if (!verifiedTicket(ticket, userId, counts.fingerprint, access.key)) return {
    state: "error", message: "Prévia expirada ou inválida. Faça uma nova prévia antes de confirmar.",
  };

  // A limpeza relacional acontece dentro de uma transação PostgreSQL única.
  // A lista institucional permanece disponível para retomar exclusões de Auth
  // se a conexão cair durante os próximos lotes.
  const { error: clearError } = await access.admin.rpc("sifcas_demo_cleanup_content");
  if (clearError) return {
    state: "error", message: "Limpeza relacional bloqueada: " + clearError.message,
  };

  const { data: pending, error: listError } = await access.admin
    .from("institutional_identity_records")
    .select("record_key,institutional_email,proposed_role,matched_user_id")
    .eq("source_name", DEMO_SOURCE)
    .not("matched_user_id", "is", null)
    .order("record_key")
    .limit(BATCH_SIZE);
  if (listError) return { state: "error", message: "Não foi possível retomar a remoção segura das contas." };

  let deletedInBatch = 0;
  for (const record of pending ?? []) {
    if (!record.matched_user_id) continue;
    const { data, error: findError } = await access.admin.auth.admin.getUserById(record.matched_user_id);
    if (findError || !data?.user || !isExpectedDemoAccount(record, data.user)) {
      return { state: "error", message: `Conta ${record.record_key} não corresponde ao registro DEMO. A exclusão foi interrompida.` };
    }
    const { error: deleteError } = await access.admin.auth.admin.deleteUser(record.matched_user_id);
    if (deleteError) {
      return { state: "error", message: `Erro do Supabase Auth ao remover ${record.record_key}: ${deleteError.message}` };
    }
    deletedInBatch++;
  }

  const { count, error: countError } = await access.admin.from("institutional_identity_records")
    .select("id", { head: true, count: "exact" })
    .eq("source_name", DEMO_SOURCE)
    .not("matched_user_id", "is", null);
  if (countError || count === null) return {
    state: "error", message: "Não foi possível confirmar quantas contas ainda restam.",
  };
  if (count > 0) return {
    state: "progress", deleted: 69 - count, remaining: count, total: 69,
  };

  const { error: finalError } = await access.admin.rpc("sifcas_demo_cleanup_finish");
  if (finalError) return {
    state: "error", message: "Contas removidas, mas a finalização dos registros DEMO falhou: " + finalError.message,
  };
  revalidatePath("/painel-institucional");
  revalidatePath("/diario-professor");
  revalidatePath("/noticias");
  revalidatePath("/agenda-institucional");
  revalidatePath("/campus/calendario-academico");
  return { state: "done", deleted: 69, remaining: 0 };
}
