"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const attendanceStatuses = new Set(["present", "absent", "late", "justified"]);

function fail(message: string, classSubjectId?: string): never {
  const params = new URLSearchParams();
  if (classSubjectId) params.set("vinculo", classSubjectId);
  params.set("error", message);
  redirect(`/diario-professor?${params.toString()}`);
}

async function requireDiaryAccount() {
  const account = await requireAccount();
  if (!["teacher", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  return account;
}

export async function createSession(formData: FormData) {
  const account = await requireDiaryAccount();
  const classSubjectId = String(formData.get("classSubjectId") ?? "").trim();
  const sessionDate = String(formData.get("sessionDate") ?? "").trim();
  const startsAt = String(formData.get("startsAt") ?? "").trim();
  const endsAt = String(formData.get("endsAt") ?? "").trim();
  const content = String(formData.get("content") ?? "").trim();
  const notes = String(formData.get("notes") ?? "").trim();

  if (!classSubjectId) fail("Selecione uma turma e disciplina.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(sessionDate)) fail("Informe uma data válida.", classSubjectId);
  if (content.length < 2 || content.length > 5000) fail("Descreva o conteúdo da aula.", classSubjectId);
  if (notes.length > 5000) fail("As observações ultrapassam o limite permitido.", classSubjectId);

  const supabase = await createClient();
  const { error } = await supabase.from("class_sessions").insert({
    class_subject_id: classSubjectId,
    session_date: sessionDate,
    starts_at: startsAt || null,
    ends_at: endsAt || null,
    content,
    notes,
    created_by: account.id,
  });
  if (error) fail(error.code === "42501" ? "Você não possui permissão para essa turma." : "Não foi possível registrar a aula.", classSubjectId);

  revalidatePath("/diario-professor");
  revalidatePath("/boletim");
  redirect(`/diario-professor?vinculo=${encodeURIComponent(classSubjectId)}&message=${encodeURIComponent("Aula registrada no diário.")}`);
}

export async function createAssessment(formData: FormData) {
  const account = await requireDiaryAccount();
  const classSubjectId = String(formData.get("classSubjectId") ?? "").trim();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const assessmentDate = String(formData.get("assessmentDate") ?? "").trim();
  const maxScore = Number(formData.get("maxScore"));
  const weight = Number(formData.get("weight"));

  if (!classSubjectId) fail("Selecione uma turma e disciplina.");
  if (title.length < 2 || title.length > 180) fail("Informe um título válido para a avaliação.", classSubjectId);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(assessmentDate)) fail("Informe uma data válida.", classSubjectId);
  if (!Number.isFinite(maxScore) || maxScore <= 0 || maxScore > 1000) fail("Valor máximo inválido.", classSubjectId);
  if (!Number.isFinite(weight) || weight <= 0 || weight > 100) fail("Peso inválido.", classSubjectId);

  const supabase = await createClient();
  const { error } = await supabase.from("academic_assessments").insert({
    class_subject_id: classSubjectId,
    title,
    description,
    assessment_date: assessmentDate,
    max_score: maxScore,
    weight,
    created_by: account.id,
  });
  if (error) fail(error.code === "42501" ? "Você não possui permissão para essa turma." : "Não foi possível criar a avaliação.", classSubjectId);

  revalidatePath("/diario-professor");
  revalidatePath("/boletim");
  redirect(`/diario-professor?vinculo=${encodeURIComponent(classSubjectId)}&message=${encodeURIComponent("Avaliação criada.")}`);
}

export async function saveAttendance(formData: FormData) {
  await requireDiaryAccount();
  const classSubjectId = String(formData.get("classSubjectId") ?? "").trim();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const studentIds = formData.getAll("studentId").map(String).filter(Boolean);
  if (!sessionId || !classSubjectId) fail("Selecione uma aula válida.", classSubjectId);

  const rows = studentIds.map((studentUserId) => {
    const status = String(formData.get(`attendance:${studentUserId}`) ?? "present");
    return {
      session_id: sessionId,
      student_user_id: studentUserId,
      status: attendanceStatuses.has(status) ? status : "present",
      updated_at: new Date().toISOString(),
    };
  });

  const supabase = await createClient();
  if (rows.length) {
    const { error } = await supabase.from("attendance_records").upsert(rows, { onConflict: "session_id,student_user_id" });
    if (error) fail(error.code === "42501" ? "Há alunos fora da turma ou você não possui permissão." : "Não foi possível salvar a chamada.", classSubjectId);
  }

  revalidatePath("/diario-professor");
  revalidatePath("/boletim");
  redirect(`/diario-professor?vinculo=${encodeURIComponent(classSubjectId)}&sessao=${encodeURIComponent(sessionId)}&message=${encodeURIComponent("Chamada salva.")}`);
}

export async function saveGrades(formData: FormData) {
  await requireDiaryAccount();
  const classSubjectId = String(formData.get("classSubjectId") ?? "").trim();
  const assessmentId = String(formData.get("assessmentId") ?? "").trim();
  const maxScore = Number(formData.get("maxScore"));
  const studentIds = formData.getAll("studentId").map(String).filter(Boolean);
  if (!assessmentId || !classSubjectId || !Number.isFinite(maxScore)) fail("Selecione uma avaliação válida.", classSubjectId);

  const rows: Array<{ assessment_id: string; student_user_id: string; score: number; updated_at: string }> = [];
  for (const studentUserId of studentIds) {
    const raw = String(formData.get(`grade:${studentUserId}`) ?? "").trim().replace(",", ".");
    if (!raw) continue;
    const score = Number(raw);
    if (!Number.isFinite(score) || score < 0 || score > maxScore) fail(`Existe uma nota fora do intervalo 0–${maxScore}.`, classSubjectId);
    rows.push({ assessment_id: assessmentId, student_user_id: studentUserId, score, updated_at: new Date().toISOString() });
  }

  const supabase = await createClient();
  if (rows.length) {
    const { error } = await supabase.from("grades").upsert(rows, { onConflict: "assessment_id,student_user_id" });
    if (error) fail(error.code === "42501" ? "Há alunos fora da turma, nota inválida ou falta de permissão." : "Não foi possível salvar as notas.", classSubjectId);
  }

  revalidatePath("/diario-professor");
  revalidatePath("/boletim");
  redirect(`/diario-professor?vinculo=${encodeURIComponent(classSubjectId)}&avaliacao=${encodeURIComponent(assessmentId)}&message=${encodeURIComponent("Notas salvas.")}`);
}
