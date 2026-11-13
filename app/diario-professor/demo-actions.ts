"use server";

import { revalidatePath } from "next/cache";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type TeacherDemoStatus =
  | { state: "progress"; done: number; total: number; remaining: number }
  | { state: "ready"; done: number; total: number; academic: Record<string, number>; extras: Record<string, number>; calendar: Record<string, number>; support: Record<string, number> }
  | { state: "error"; message: string };

type DemoReply = {
  state?: "progress" | "ready";
  error?: string;
  details?: string[];
  remaining?: number;
  total?: number;
  outputs?: Record<string, Record<string, number>>;
};

export async function activateTeacherDemo(): Promise<TeacherDemoStatus> {
  const account = await requireAccount();
  if (account.role !== "teacher" || account.accountStatus !== "active" ||
      account.email.toLowerCase() !== "professorteste@gmail.com") {
    return { state: "error", message: "Este recurso é exclusivo do Professor Teste." };
  }

  // A função Supabase verifica o JWT, o papel de professor e o vínculo
  // institucional sintético antes de efetuar qualquer escrita.
  // Nenhuma chave administrativa é utilizada ou exposta pela Vercel.
  const supabase = await createClient();
  const { data, error } = await supabase.functions.invoke<DemoReply>("sifcas-demo-activate", {
    body: { operation: "enable-demo" },
  });

  if (error) {
    let details = "";
    const context = error.context;
    if (context instanceof Response) {
      try {
        const body = (await context.json()) as DemoReply;
        details = body.error ?? "";
        if (body.details?.length) details += ": " + body.details.slice(0, 2).join("; ");
      } catch {
        // Não inserir dados sensíveis ou tokens nas mensagens de erro.
      }
    }
    return { state: "error", message: details || error.message || "Falha na ativação dos dados demonstrativos." };
  }
  if (data?.error) return {
    state: "error",
    message: data.error + (data.details?.length ? ": " + data.details.slice(0, 2).join("; ") : ""),
  };
  if (data?.state === "progress") {
    const total = data.total ?? 69;
    const remaining = data.remaining ?? total;
    return { state: "progress", done: total - remaining, total, remaining };
  }
  if (data?.state !== "ready") return {
    state: "error", message: "Resposta inesperada ao ativar demonstração.",
  };

  revalidatePath("/diario-professor");
  revalidatePath("/agenda-aluno");
  revalidatePath("/agenda-institucional");
  revalidatePath("/painel-institucional");
  return {
    state: "ready", done: data.total ?? 69, total: data.total ?? 69,
    academic: data.outputs?.academic ?? {},
    extras: data.outputs?.extras ?? {},
    calendar: data.outputs?.calendar ?? {},
    support: data.outputs?.support ?? {},
  };
}
