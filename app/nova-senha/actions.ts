"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newPasswordError } from "@/lib/password-policy";
import { createClient } from "@/lib/supabase/server";

export async function updatePassword(formData: FormData) {
  const raw = formData.get("password");
  const password = typeof raw === "string" ? raw : "";
  const passwordError = newPasswordError(password);
  if (passwordError) redirect(`/nova-senha?error=${encodeURIComponent(passwordError)}`);

  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  if (!data?.claims) redirect("/login");

  const { error } = await supabase.auth.updateUser({ password });
  if (error) redirect(`/nova-senha?error=${encodeURIComponent("Não foi possível atualizar a senha. Tente novamente.")}`);

  revalidatePath("/", "layout");
  redirect(`/perfil?message=${encodeURIComponent("Senha atualizada com sucesso.")}`);
}
