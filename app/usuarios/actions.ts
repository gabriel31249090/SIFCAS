"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const validRoles = new Set<AppRole>(["student", "teacher", "staff", "manager", "admin"]);
const validStatuses = new Set(["active", "pending", "suspended"]);

function text(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function finish(message: string, error = false): never {
  revalidatePath("/usuarios");
  revalidatePath("/pessoas");
  redirect(`/usuarios?${error ? "error" : "message"}=${encodeURIComponent(message)}`);
}

async function requireAdmin() {
  const account = await requireAccount();
  if (account.role !== "admin") redirect("/acesso-negado");
  return account;
}

export async function setUserRole(formData: FormData) {
  const account = await requireAdmin();
  const userId = text(formData, "userId");
  const role = text(formData, "role") as AppRole;
  if (!userId || !validRoles.has(role)) finish("Usuário ou papel inválido.", true);

  const supabase = await createClient();
  const { data: current } = await supabase.from("user_roles").select("role,is_general_admin").eq("user_id", userId).maybeSingle();
  if (!current) finish("Papel atual não encontrado.", true);
  if (current.is_general_admin && role !== "admin") finish("O Administrador Geral não pode ser rebaixado.", true);
  if (userId === account.id && role !== "admin") finish("Você não pode remover seu próprio acesso administrativo.", true);

  const { error } = await supabase.from("user_roles").update({ role, role_source: "manual", updated_at: new Date().toISOString() }).eq("user_id", userId);
  if (error) finish("Não foi possível alterar o papel.", true);
  finish("Papel institucional atualizado.");
}

export async function setAccountStatus(formData: FormData) {
  await requireAdmin();
  const userId = text(formData, "userId");
  const status = text(formData, "status");
  if (!userId || !validStatuses.has(status)) finish("Usuário ou status inválido.", true);

  const supabase = await createClient();
  const { error } = await supabase.rpc("admin_set_account_status", { p_user_id: userId, p_status: status });
  if (error) {
    console.error("[SIFCAS admin] Account status update failed", error.code);
    if (error.code === "PGRST202" || error.code === "42883") {
      finish("A atualização segura do status ainda não foi instalada no banco. Aplique a atualização revisada de supabase/patches/admin-account-status.sql.", true);
    }
    if (error.code === "42501") finish("O banco recusou a alteração. Confirme que sua conta está ativa e possui o papel de Administrador.", true);
    if (error.code === "P0002") finish("A conta ou o papel de destino não foi encontrado.", true);
    finish("Não foi possível alterar o status da conta. Consulte o log do servidor para o código do erro.", true);
  }

  finish(status === "active" ? "Conta ativada manualmente." : status === "pending" ? "Conta movida para validação pendente." : "Conta suspensa. Novos acessos internos serão bloqueados.");
}
