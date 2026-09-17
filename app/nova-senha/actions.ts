"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const raw = formData.get("password");
  const password = typeof raw === "string" ? raw : "";
  if (password.length < 8) redirect(`/nova-senha?error=${encodeURIComponent("A senha deve ter pelo menos 8 caracteres.")}`);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/nova-senha?error=${encodeURIComponent("Não foi possível atualizar a senha. Tente novamente.")}`);

  revalidatePath("/", "layout");
  redirect(`/perfil?message=${encodeURIComponent("Senha atualizada com sucesso.")}`);
}
