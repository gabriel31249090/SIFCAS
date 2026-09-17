"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function updateProfile(formData: FormData) {
  const account = await requireAccount();
  const raw = formData.get("fullName");
  const fullName = typeof raw === "string" ? raw.trim() : "";
  if (fullName.length < 2 || fullName.length > 120) redirect(`/perfil?error=${encodeURIComponent("Informe um nome válido.")}`);

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ full_name: fullName, updated_at: new Date().toISOString() })
    .eq("id", account.id);

  if (error) redirect(`/perfil?error=${encodeURIComponent("Não foi possível salvar o perfil.")}`);
  revalidatePath("/", "layout");
  redirect(`/perfil?message=${encodeURIComponent("Perfil atualizado.")}`);
}
