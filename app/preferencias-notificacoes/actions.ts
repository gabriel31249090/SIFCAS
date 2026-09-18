"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export async function saveNotificationPreferences(formData: FormData) {
  const account = await requireAccount();
  const supabase = await createClient();
  const { error } = await supabase.from("notification_preferences").upsert({
    user_id: account.id,
    institutional: formData.get("institutional") === "on",
    service_requests: formData.get("serviceRequests") === "on",
    academic: formData.get("academic") === "on",
    system: formData.get("system") === "on",
    updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });

  if (error) redirect("/preferencias-notificacoes?error=" + encodeURIComponent("Não foi possível salvar suas preferências."));
  revalidatePath("/notificacoes");
  revalidatePath("/preferencias-notificacoes");
  redirect("/preferencias-notificacoes?message=" + encodeURIComponent("Preferências atualizadas."));
}
