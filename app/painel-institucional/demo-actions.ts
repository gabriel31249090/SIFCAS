"use server";

import { randomBytes } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { requireAccount } from "@/lib/auth";
import { supabaseUrl } from "@/lib/supabase/config";

export type DemoSetupResult =
  | { state: "progress"; done: number; total: number; remaining: number; message: string }
  | { state: "finished"; done: number; total: number; remaining: 0; email: string; password: string; academic: Record<string, number> }
  | { state: "error"; message: string };

type DemoIdentity = {
  record_key: string;
  full_name: string;
  institutional_email: string;
  proposed_role: string;
  match_status: string;
  matched_user_id: string | null;
};

const isDemoEmail = (record: DemoIdentity) =>
  record.record_key === "teacher-test"
    ? record.institutional_email === "professorteste@gmail.com"
    : record.institutional_email.endsWith("@example.com");

export async function prepareSifcasDemo(): Promise<DemoSetupResult> {
  const account = await requireAccount();
  if (account.role !== "admin" || !account.isGeneralAdmin || account.accountStatus !== "active") {
    return { state: "error", message: "Apenas o administrador geral pode ativar os dados de demonstração." };
  }

  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return {
    state: "error",
    message: "Configuração pendente no servidor: defina SUPABASE_SERVICE_ROLE_KEY somente na Vercel, sem NEXT_PUBLIC_.",
  };

  const admin = createClient(supabaseUrl, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: roster, error: rosterError } = await admin.from("institutional_identity_records")
    .select("record_key,full_name,institutional_email,proposed_role,match_status,matched_user_id")
    .eq("source_name", "SIFCAS-DEMO-2026")
    .eq("approval_status", "approved")
    .order("record_key")
    .limit(100);
  if (rosterError || !roster) return {
    state: "error", message: "Não foi possível consultar o cadastro de demonstração.",
  };

  const count = (role: string) => roster.filter((r) => r.proposed_role === role).length;
  if (count("student") < 50 || count("teacher") < 11 || count("staff") < 8) {
    return { state: "error", message: "A base demonstrativa precisa conter 50 estudantes, 11 professores e 8 servidores." };
  }
  if (roster.some((r) => !["student", "teacher", "staff"].includes(r.proposed_role) || !isDemoEmail(r))) {
    return { state: "error", message: "O cadastro contém um e-mail ou papel fora do escopo autorizado para testes." };
  }

  const pending = roster.filter((r) => r.match_status !== "applied");
  if (pending.length) {
    const chunk = pending.slice(0, 9);
    const results: { key: string; error?: string }[] = [];
    for (let start = 0; start < chunk.length; start += 3) {
      const batch = chunk.slice(start, start + 3);
      const responses = await Promise.all(batch.map(async (r) => {
        const { error } = await admin.auth.admin.createUser({
          email: r.institutional_email,
          password: randomBytes(24).toString("base64url"),
          email_confirm: true,
          user_metadata: { full_name: r.full_name, sifcas_demo: true },
          app_metadata: { sifcas_demo: true },
        });
        return { key: r.record_key, error: error?.message };
      }));
      results.push(...responses);
    }
    const failures = results.filter((r) => r.error);
    if (failures.length) {
      return { state: "error", message: "Falha ao criar contas de demonstração: " +
        failures.map((r) => r.key + " — " + r.error).slice(0, 3).join("; ") };
    }
    const { count: ready, error } = await admin.from("institutional_identity_records")
      .select("id", { count: "exact", head: true })
      .eq("source_name", "SIFCAS-DEMO-2026")
      .eq("match_status", "applied");
    if (error) return { state: "error", message: "Não foi possível verificar a ativação das contas." };
    const done = ready ?? 0;
    return {
      state: "progress",
      done, total: roster.length, remaining: Math.max(0, roster.length - done),
      message: "Contas de teste em criação. A ativação prossegue automaticamente.",
    };
  }

  const { data: academic, error: diaryError } = await admin.rpc("sifcas_demo_populate_academic");
  if (diaryError) return {
    state: "error",
    message: "As contas estão ativas, mas o preenchimento dos diários falhou: " + diaryError.message,
  };
  const teacher = roster.find((r) => r.record_key === "teacher-test");
  if (!teacher?.matched_user_id) return {
    state: "error", message: "A conta Professor Teste não foi vinculada corretamente.",
  };
  const password = randomBytes(24).toString("base64url");
  const { error: passwordError } = await admin.auth.admin.updateUserById(teacher.matched_user_id, { password });
  if (passwordError) return {
    state: "error", message: "Falha ao definir a senha do Professor Teste: " + passwordError.message,
  };
  return {
    state: "finished", done: roster.length, total: roster.length, remaining: 0,
    email: "professorteste@gmail.com", password, academic: (academic ?? {}) as Record<string, number>,
  };
}
