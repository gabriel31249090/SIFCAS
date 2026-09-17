"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function markNotificationRead(formData: FormData) {
  const account = await requireAccount();
  const id = String(formData.get("id") ?? "").trim();
  if (!id) redirect("/notificacoes?error=Notifica%C3%A7%C3%A3o%20inv%C3%A1lida.");
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("id", id)
    .eq("user_id", account.id);
  if (error) redirect("/notificacoes?error=N%C3%A3o%20foi%20poss%C3%ADvel%20atualizar%20a%20notifica%C3%A7%C3%A3o.");
  revalidatePath("/notificacoes");
  redirect("/notificacoes");
}

export async function markAllNotificationsRead() {
  const account = await requireAccount();
  const supabase = await createClient();
  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("user_id", account.id)
    .is("read_at", null);
  if (error) redirect("/notificacoes?error=N%C3%A3o%20foi%20poss%C3%ADvel%20marcar%20as%20notifica%C3%A7%C3%B5es.");
  revalidatePath("/notificacoes");
  redirect("/notificacoes?message=Notifica%C3%A7%C3%B5es%20marcadas%20como%20lidas.");
}
