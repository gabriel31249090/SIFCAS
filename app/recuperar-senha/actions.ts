"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function requestPasswordReset(formData: FormData) {
  const raw = formData.get("email");
  const email = typeof raw === "string" ? raw.trim().toLowerCase() : "";

  if (email) {
    const supabase = await createClient();
    const site = process.env.NEXT_PUBLIC_SITE_URL ?? "https://sifcas.vercel.app";
    await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${site}/auth/callback?next=/nova-senha`,
    });
  }

  redirect(`/recuperar-senha?message=${encodeURIComponent("Se houver uma conta com esse e-mail, enviaremos as instruções de recuperação.")}`);
}
