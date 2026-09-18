"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

function value(formData: FormData, key: string) {
  const raw = formData.get(key);
  return typeof raw === "string" ? raw.trim() : "";
}

function safeNext(raw: string) {
  return raw.startsWith("/") && !raw.startsWith("//") ? raw : "/";
}

function siteUrl() {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "https://sifcas.vercel.app";
}

export async function login(formData: FormData) {
  const email = value(formData, "email").toLowerCase();
  const password = value(formData, "password");
  const next = safeNext(value(formData, "next") || "/");

  if (!email || password.length < 8) {
    redirect(`/login?error=${encodeURIComponent("Informe um e-mail válido e uma senha com pelo menos 8 caracteres.")}`);
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });

  if (error || !data.user) {
    redirect(`/login?error=${encodeURIComponent("E-mail ou senha inválidos.")}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("account_status")
    .eq("id", data.user.id)
    .maybeSingle();

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
  const password = value(formData, "password");

  if (fullName.length < 2 || !email || password.length < 8) {
    redirect(`/login?mode=cadastro&error=${encodeURIComponent("Preencha nome, e-mail e uma senha de pelo menos 8 caracteres.")}`);
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
