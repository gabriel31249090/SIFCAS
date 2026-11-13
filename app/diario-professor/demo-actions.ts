"use server";

import { randomBytes } from "node:crypto";
import { revalidatePath } from "next/cache";
import { createClient } from "@supabase/supabase-js";
import { requireAccount } from "@/lib/auth";
import { supabaseUrl } from "@/lib/supabase/config";

export type TeacherDemoStatus =
  | { state: "progress"; done: number; total: number; remaining: number }
  | { state: "ready"; done: number; total: number; academic: Record<string, number>; extras: Record<string, number>; calendar: Record<string, number>; support: Record<string, number> }
  | { state: "error"; message: string };

type DemoRecord = {
  id: string;
  record_key: string;
  proposed_role: string;
  institutional_email: string;
  full_name: string;
  match_status: string;
  matched_user_id: string | null;
};

function isExpectedDemoRecord(r: DemoRecord) {
  if (r.record_key === "teacher-test") {
    return r.proposed_role === "teacher" && r.institutional_email === "professorteste@gmail.com";
  }
  const match = /^(student|teacher|staff)-([1-9][0-9]?)$/.exec(r.record_key);
  if (!match) return false;
  const number = Number(match[2]);
  const maximum = match[1] === "student" ? 50 : match[1] === "teacher" ? 10 : 8;
  return number <= maximum && match[1] === r.proposed_role &&
    r.institutional_email === `demo-${r.record_key}@example.com`;
}

/**
 * Exclusivo para o Professor Teste autenticado e vinculado a um registro institucional
 * de demonstração previamente aprovado. Nenhum parâmetro do cliente define e-mails,
 * usuários, papéis ou destino: apenas a lista DEMO fixa e verificável é provisionada.
 */
export async function activateTeacherDemo(): Promise<TeacherDemoStatus> {
  const account = await requireAccount();
  if (account.role !== "teacher" || account.accountStatus !== "active" ||
      account.email.toLowerCase() !== "professorteste@gmail.com") {
    return { state: "error", message: "Este recurso é exclusivo do Professor Teste." };
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return { state: "error", message: "A chave administrativa do Supabase não está configurada na Vercel." };
  const admin = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  const { data: identity, error: identityError } = await admin.from("institutional_identity_records")
    .select("record_key,proposed_role,institutional_email,match_status,matched_user_id")
    .eq("source_name", "SIFCAS-DEMO-2026")
    .eq("record_key", "teacher-test").eq("approval_status", "approved").maybeSingle();

  if (identityError || !identity ||
      identity.matched_user_id !== account.id ||
      identity.match_status !== "applied" ||
      identity.proposed_role !== "teacher" ||
      identity.institutional_email !== "professorteste@gmail.com") {
    return { state: "error", message: "O vínculo de demonstração da conta não foi validado." };
  }

  const { data: records, error: listError } = await admin.from("institutional_identity_records")
    .select("id,record_key,proposed_role,institutional_email,full_name,match_status,matched_user_id")
    .eq("source_name", "SIFCAS-DEMO-2026").eq("approval_status", "approved")
    .order("record_key").limit(100);

  if (listError || !records) return { state: "error", message: "Não foi possível consultar os dados fictícios." };
  const casted = records as DemoRecord[];
  if (casted.length !== 69 || !casted.every(isExpectedDemoRecord) ||
      casted.filter(r => r.proposed_role === "student").length !== 50 ||
      casted.filter(r => r.proposed_role === "teacher").length !== 11 ||
      casted.filter(r => r.proposed_role === "staff").length !== 8) {
    return { state: "error", message: "A lista de demonstração foi alterada. A ativação foi bloqueada por segurança." };
  }

  const pending = casted.filter(r => r.match_status !== "applied");
  if (pending.length) {
    const chunk = pending.slice(0, 9);
    const errors: string[] = [];
    for (let start = 0; start < chunk.length; start += 3) {
      const results = await Promise.all(chunk.slice(start, start + 3).map(async record => {
        const { error } = await admin.auth.admin.createUser({
          email: record.institutional_email,
          password: randomBytes(24).toString("base64url"),
          email_confirm: true,
          user_metadata: { full_name: record.full_name, sifcas_demo: true },
          app_metadata: { sifcas_demo: true },
        });
        return error ? record.record_key + ": " + error.message : null;
      }));
      errors.push(...results.filter((x): x is string => x !== null));
    }
    if (errors.length) return {
      state: "error",
      message: "Erro ao criar contas de demonstração: " + errors.slice(0, 2).join("; "),
    };
    const { count, error: countError } = await admin.from("institutional_identity_records")
      .select("id", { count: "exact", head: true })
      .eq("source_name", "SIFCAS-DEMO-2026").eq("match_status", "applied");
    if (countError) return { state: "error", message: "Falha ao verificar a criação dos usuários." };
    const done = count ?? 0;
    return { state: "progress", done, total: 69, remaining: 69 - done };
  }

  const outputs: Record<string, Record<string, number>> = {};
  for (const [keyName, procedure] of [
    ["academic", "sifcas_demo_populate_academic"],
    ["extras", "sifcas_demo_populate_extras"],
    ["calendar", "sifcas_demo_populate_calendar"],
    ["support", "sifcas_demo_populate_support"],
  ] as const) {
    const { data, error } = await admin.rpc(procedure);
    if (error) return {
      state: "error",
      message: "Falha ao preencher " + keyName + ": " + error.message,
    };
    outputs[keyName] = (data ?? {}) as Record<string, number>;
  }

  revalidatePath("/diario-professor");
  revalidatePath("/agenda-aluno");
  revalidatePath("/agenda-institucional");
  revalidatePath("/painel-institucional");
  return {
    state: "ready", done: 69, total: 69,
    academic: outputs.academic,
    extras: outputs.extras,
    calendar: outputs.calendar,
    support: outputs.support,
  };
}
