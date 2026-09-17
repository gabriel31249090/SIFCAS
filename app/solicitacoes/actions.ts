"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const categories = new Set(["academic", "documents", "people", "infrastructure", "it", "transport", "other"]);
const priorities = new Set(["low", "normal", "high", "urgent"]);
const statuses = new Set(["open", "in_progress", "waiting", "resolved", "cancelled"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function finish(message: string, error = false): never {
  revalidatePath("/solicitacoes");
  revalidatePath("/notificacoes");
  redirect(`/solicitacoes?${error ? "error" : "message"}=${encodeURIComponent(message)}`);
}

export async function createServiceRequest(formData: FormData) {
  const account = await requireAccount();
  const category = text(formData, "category");
  const priority = text(formData, "priority") || "normal";
  const title = text(formData, "title");
  const description = text(formData, "description");

  if (!categories.has(category) || !priorities.has(priority) || title.length < 3 || title.length > 180 || description.length > 8000) {
    finish("Revise categoria, prioridade, título e descrição.", true);
  }

  const supabase = await createClient();
  const { error } = await supabase.from("service_requests").insert({
    requester_user_id: account.id,
    category,
    priority,
    title,
    description,
  });
  if (error) finish("Não foi possível abrir a solicitação.", true);
  finish("Solicitação aberta com sucesso.");
}

export async function manageServiceRequest(formData: FormData) {
  const account = await requireAccount();
  if (!["staff", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  const id = text(formData, "id");
  const status = text(formData, "status");
  const response = text(formData, "response");
  const assignedTo = text(formData, "assignedTo") || null;
  if (!id || !statuses.has(status) || response.length > 8000) finish("Dados de atendimento inválidos.", true);

  const supabase = await createClient();
  const { error } = await supabase.rpc("manage_service_request", {
    p_id: id,
    p_status: status,
    p_response: response || null,
    p_assigned_to: assignedTo,
  });
  if (error) finish("Não foi possível atualizar a solicitação.", true);
  finish("Solicitação atualizada. O solicitante foi notificado.");
}

export async function cancelServiceRequest(formData: FormData) {
  await requireAccount();
  const id = text(formData, "id");
  if (!id) finish("Solicitação inválida.", true);
  const supabase = await createClient();
  const { error } = await supabase.rpc("cancel_own_service_request", { p_id: id });
  if (error) finish("Não foi possível cancelar a solicitação.", true);
  finish("Solicitação cancelada.");
}
