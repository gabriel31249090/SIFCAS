"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { getShortcutCatalog } from "@/lib/experience";
import { createClient } from "@/lib/supabase/server";

function finish(message: string, error = false): never {
  revalidatePath("/");
  revalidatePath("/atalhos");
  redirect("/atalhos?" + (error ? "error=" : "message=") + encodeURIComponent(message));
}

export async function addShortcut(formData: FormData) {
  const account = await requireAccount();
  const href = String(formData.get("href") ?? "").trim();
  const item = getShortcutCatalog(account.role).find((entry) => entry.href === href);
  if (!item) finish("Atalho não permitido para o seu perfil.", true);

  const supabase = await createClient();
  const { error } = await supabase.from("user_shortcuts").upsert({
    user_id: account.id,
    label: item.label,
    href: item.href,
  }, { onConflict: "user_id,href" });

  if (error) finish("Não foi possível adicionar o atalho.", true);
  finish("Atalho adicionado.");
}

export async function removeShortcut(formData: FormData) {
  const account = await requireAccount();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) finish("Atalho inválido.", true);

  const supabase = await createClient();
  const { error } = await supabase.from("user_shortcuts").delete().eq("id", id).eq("user_id", account.id);
  if (error) finish("Não foi possível remover o atalho.", true);
  finish("Atalho removido.");
}
