"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set(["class", "exam", "assignment", "activity", "notice", "material"]);

function fail(message: string): never {
  redirect(`/agenda-aluno?error=${encodeURIComponent(message)}`);
}

export async function publishAgendaEntry(formData: FormData) {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) {
    fail("Seu perfil não possui permissão para publicar na agenda.");
  }

  const classSubjectId = String(formData.get("classSubjectId") ?? "").trim();
  const entryDate = String(formData.get("entryDate") ?? "").trim();
  const startsAtRaw = String(formData.get("startsAt") ?? "").trim();
  const entryType = String(formData.get("entryType") ?? "class").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();

  if (!classSubjectId) fail("Selecione uma turma e disciplina.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(entryDate)) fail("Informe uma data válida.");
  if (startsAtRaw && !/^\d{2}:\d{2}$/.test(startsAtRaw)) fail("Informe um horário válido.");
  if (!allowedTypes.has(entryType)) fail("Tipo de publicação inválido.");
  if (title.length < 2 || title.length > 180) fail("O título deve ter entre 2 e 180 caracteres.");
  if (description.length > 8000) fail("A descrição ultrapassa o limite permitido.");

  const supabase = await createClient();
  const { error } = await supabase.from("class_agenda_entries").insert({
    class_subject_id: classSubjectId,
    author_user_id: account.id,
    entry_date: entryDate,
    starts_at: startsAtRaw || null,
    entry_type: entryType,
    title,
    description,
    status: "published",
  });

  if (error) {
    if (error.code === "42501") fail("Você não está vinculado a essa turma ou não possui permissão para publicar nela.");
    fail("Não foi possível publicar a atividade agora.");
  }

  revalidatePath("/agenda-aluno");
  revalidatePath("/");
  redirect(`/agenda-aluno?message=${encodeURIComponent("Publicação adicionada à agenda da turma.")}`);
}
