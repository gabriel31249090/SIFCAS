"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { newPasswordError } from "@/lib/password-policy";
import { createClient } from "@/lib/supabase/server";
import { safeInternalPath } from "@/lib/safe-path";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://sifcas.vercel.app";
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeInternalPath(value(formData, "next"));

  if (!email || password.length < 8) {
    redirect(`/login?error=${encodeURIComponent("Informe um e-mail válido e uma senha com pelo menos 8 caracteres.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    const code = error?.code ?? "unknown";
    console.error("[SIFCAS auth] Login failed", {
      code,
      status: error?.status ?? null,
      message: error?.message ?? "No user returned",
    });
    const message = code === "invalid_credentials"
      ? "E-mail ou senha inválidos. Verifique as credenciais e o projeto Supabase."
      : code === "email_not_confirmed"
        ? "Confirme seu e-mail antes de entrar."
        : code === "over_request_rate_limit"
          ? "Muitas tentativas. Aguarde antes de tentar novamente."
          : "Erro de autenticação. Consulte os logs do servidor.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", data.user.id)
    .maybeSingle();

  if (profileError || !profile) {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent("Não foi possível validar seu vínculo. Tente novamente ou procure a administração.")}`);
  }

  if (profile?.account_status === "suspended") {
    await supabase.auth.signOut();
    redirect(`/login?error=${encodeURIComponent("Esta conta está suspensa. Procure a administração do SIFCAS.")}`);
  }
  if (profile?.account_status === "pending") {
    await supabase.auth.signOut();
    redirect(`/login?message=${encodeURIComponent("Seu cadastro foi confirmado, mas o vínculo institucional ainda está pendente de validação. Procure a administração caso seus dados já tenham sido enviados.")}`);
  }

  revalidatePath("/", "layout");
  redirect(next);
}

export async function signup(formData: FormData) {
  const fullName = value(formData, "fullName");
  const email = value(formData, "email").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const passwordError = newPasswordError(password);

  if (fullName.length < 2 || !email || passwordError) {
    redirect(`/login?mode=cadastro&error=${encodeURIComponent(passwordError ?? "Preencha um nome e um e-mail válidos.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName },
      emailRedirectTo: `${siteUrl()}/auth/callback?next=/`,
    },
  });

  if (error) {
    redirect(`/login?mode=cadastro&error=${encodeURIComponent("Não foi possível criar a conta. Verifique os dados e tente novamente.")}`);
  }

  if (data.session && data.user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("account_status")
      .eq("id", data.user.id)
      .maybeSingle();

    if (profile?.account_status === "active") {
      revalidatePath("/", "layout");
      redirect("/");
    }

    await supabase.auth.signOut();
    redirect(`/login?message=${encodeURIComponent("Conta criada, mas o vínculo institucional ainda precisa ser validado antes do acesso interno.")}`);
  }

  redirect(`/login?message=${encodeURIComponent("Conta criada. Confirme seu e-mail; depois o SIFCAS verificará seu vínculo institucional automaticamente.")}`);
}
