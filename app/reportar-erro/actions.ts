"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const statuses = new Set(["open","reviewing","resolved","closed"]);

function finish(message: string, error = false): never {
  revalidatePath("/reportar-erro");
  redirect("/reportar-erro?" + (error ? "error=" : "message=") + encodeURIComponent(message));
}

export async function createBugReport(formData: FormData) {
  const account = await requireAccount();
  const route = String(formData.get("route") ?? "/").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!route.startsWith("/") || route.length > 300 || title.length < 3 || title.length > 180 || description.length > 10000) {
    finish("Revise a página, o título e a descrição.", true);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("bug_reports").insert({
    user_id: account.id,
    route,
    title,
    description,
  });
  if (error) finish("Não foi possível registrar o erro.", true);
  finish("Erro registrado. Você pode acompanhar o status abaixo.");
}

export async function manageBugReport(formData: FormData) {
  const account = await requireAccount();
  if (!["staff","manager","admin"].includes(account.role)) redirect("/acesso-negado");
  const id = String(formData.get("id") ?? "").trim();
  const status = String(formData.get("status") ?? "").trim();
  const response = String(formData.get("response") ?? "").trim();

  if (!id || !statuses.has(status) || response.length > 10000) finish("Dados de atendimento inválidos.", true);

  const now = new Date().toISOString();
  const supabase = await createClient();
  const { error } = await supabase.from("bug_reports").update({
    status,
    response,
    managed_by: account.id,
    updated_at: now,
    resolved_at: ["resolved","closed"].includes(status) ? now : null,
  }).eq("id", id);

  if (error) finish("Não foi possível atualizar o relato.", true);
  finish("Relato atualizado.");
}
