"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const GENERAL_ADMIN_EMAIL = "gabriel31249090@gmail.com";
const validRoles = new Set<AppRole>(["student", "teacher", "staff", "manager", "admin"]);

function value(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function numberValue(formData: FormData, name: string) {
  const raw = value(formData, name);
  return raw ? Number(raw) : null;
}

function success(message: string): never {
  revalidatePath("/gestao-academica");
  revalidatePath("/ensino");
  revalidatePath("/estudante");
  revalidatePath("/agenda-aluno");
  redirect(`/gestao-academica?message=${encodeURIComponent(message)}`);
}

function fail(message: string): never {
  redirect(`/gestao-academica?error=${encodeURIComponent(message)}`);
}

async function requireManagement() {
  const account = await requireAccount();
  if (!["manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  return account;
}

async function findProfileByEmail(email: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id,full_name,institutional_email")
    .eq("institutional_email", email.toLowerCase())
    .maybeSingle();
  if (error || !data) fail("Nenhuma conta do SIFCAS foi encontrada com esse e-mail.");
  return data;
}

export async function createAcademicPeriod(formData: FormData) {
  await requireManagement();
  const campusId = value(formData, "campusId");
  const name = value(formData, "name");
  const year = numberValue(formData, "year");
  const term = numberValue(formData, "term");
  const startsOn = value(formData, "startsOn") || null;
  const endsOn = value(formData, "endsOn") || null;
  if (!campusId || name.length < 2 || !year || !term || term < 1 || term > 4) fail("Revise os dados do período letivo.");
  const supabase = await createClient();
  const { error } = await supabase.from("academic_periods").insert({ campus_id: campusId, name, year, term, starts_on: startsOn, ends_on: endsOn, status: "active" });
  if (error) fail(error.code === "23505" ? "Esse período letivo já existe para o campus." : "Não foi possível criar o período letivo.");
  success("Período letivo criado.");
}

export async function createCourse(formData: FormData) {
  await requireManagement();
  const campusId = value(formData, "campusId");
  const code = value(formData, "code").toUpperCase();
  const name = value(formData, "name");
  const level = value(formData, "level") || "technical";
  const shift = value(formData, "shift") || "full_time";
  const totalSemesters = numberValue(formData, "totalSemesters");
  if (!campusId || code.length < 2 || name.length < 3) fail("Informe campus, código e nome do curso.");
  const supabase = await createClient();
  const { error } = await supabase.from("courses").insert({ campus_id: campusId, code, name, level, shift, total_semesters: totalSemesters, active: true });
  if (error) fail(error.code === "23505" ? "Já existe um curso com esse código." : "Não foi possível cadastrar o curso.");
  success("Curso cadastrado.");
}

export async function createSubject(formData: FormData) {
  await requireManagement();
  const courseId = value(formData, "courseId");
  const code = value(formData, "code").toUpperCase();
  const name = value(formData, "name");
  const workloadHours = numberValue(formData, "workloadHours") ?? 0;
  const semester = numberValue(formData, "semester");
  if (!courseId || code.length < 2 || name.length < 2 || workloadHours < 0) fail("Revise os dados da disciplina.");
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").insert({ course_id: courseId, code, name, workload_hours: workloadHours, semester, active: true });
  if (error) fail(error.code === "23505" ? "Essa disciplina já está cadastrada." : "Não foi possível cadastrar a disciplina.");
  success("Disciplina cadastrada.");
}

export async function createClass(formData: FormData) {
  await requireManagement();
  const courseId = value(formData, "courseId");
  const academicPeriodId = value(formData, "academicPeriodId");
  const code = value(formData, "code").toUpperCase();
  const name = value(formData, "name");
  const shift = value(formData, "shift") || "full_time";
  const capacity = numberValue(formData, "capacity");
  if (!courseId || !academicPeriodId || code.length < 2 || name.length < 2) fail("Revise os dados da turma.");
  const supabase = await createClient();
  const { error } = await supabase.from("classes").insert({ course_id: courseId, academic_period_id: academicPeriodId, code, name, shift, capacity, active: true });
  if (error) fail(error.code === "23505" ? "Já existe uma turma com esse código." : "Não foi possível criar a turma.");
  success("Turma criada.");
}

export async function attachSubjectToClass(formData: FormData) {
  await requireManagement();
  const classId = value(formData, "classId");
  const subjectId = value(formData, "subjectId");
  const room = value(formData, "room") || null;
  if (!classId || !subjectId) fail("Selecione turma e disciplina.");
  const supabase = await createClient();
  const { error } = await supabase.from("class_subjects").insert({ class_id: classId, subject_id: subjectId, room, active: true });
  if (error) fail(error.code === "23505" ? "A disciplina já está vinculada a essa turma." : "Não foi possível vincular a disciplina.");
  success("Disciplina vinculada à turma.");
}

export async function createSchedule(formData: FormData) {
  await requireManagement();
  const classSubjectId = value(formData, "classSubjectId");
  const weekday = numberValue(formData, "weekday");
  const startsAt = value(formData, "startsAt");
  const endsAt = value(formData, "endsAt");
  const room = value(formData, "room") || null;
  if (!classSubjectId || !weekday || weekday < 1 || weekday > 7 || !/^\d{2}:\d{2}$/.test(startsAt) || !/^\d{2}:\d{2}$/.test(endsAt) || startsAt >= endsAt) fail("Revise dia e horários da aula.");
  const supabase = await createClient();
  const { error } = await supabase.from("class_schedules").insert({ class_subject_id: classSubjectId, weekday, starts_at: startsAt, ends_at: endsAt, room });
  if (error) fail("Não foi possível criar o horário.");
  success("Horário adicionado.");
}

export async function assignTeacher(formData: FormData) {
  await requireManagement();
  const classSubjectId = value(formData, "classSubjectId");
  const email = value(formData, "email").toLowerCase();
  if (!classSubjectId || !email.includes("@")) fail("Informe a disciplina/turma e o e-mail do professor.");
  const profile = await findProfileByEmail(email);
  const supabase = await createClient();
  const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", profile.id).maybeSingle();
  if (roleRow?.role !== "teacher" && roleRow?.role !== "manager" && roleRow?.role !== "admin") fail("Essa conta ainda não possui papel de Professor, Gestor ou Administrador.");
  const { error } = await supabase.from("teaching_assignments").insert({ class_subject_id: classSubjectId, teacher_user_id: profile.id, is_primary: true });
  if (error) fail(error.code === "23505" ? "Esse professor já está vinculado à disciplina/turma." : "Não foi possível criar o vínculo docente.");
  success(`Professor ${profile.full_name || email} vinculado.`);
}

export async function enrollStudent(formData: FormData) {
  await requireManagement();
  const classId = value(formData, "classId");
  const email = value(formData, "email").toLowerCase();
  const enrollmentNumber = value(formData, "enrollmentNumber") || null;
  if (!classId || !email.includes("@")) fail("Informe a turma e o e-mail do estudante.");
  const profile = await findProfileByEmail(email);
  const supabase = await createClient();
  const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", profile.id).maybeSingle();
  if (roleRow?.role !== "student") fail("A conta selecionada não está com papel de Estudante.");
  const { error } = await supabase.from("enrollments").insert({ class_id: classId, student_user_id: profile.id, enrollment_number: enrollmentNumber, status: "active" });
  if (error) fail(error.code === "23505" ? "Esse estudante já está matriculado na turma." : "Não foi possível realizar a matrícula.");
  success(`Estudante ${profile.full_name || email} matriculado.`);
}

export async function setUserRole(formData: FormData) {
  const account = await requireAccount();
  if (account.role !== "admin") redirect("/acesso-negado");
  const email = value(formData, "email").toLowerCase();
  const role = value(formData, "role") as AppRole;
  if (!email.includes("@") || !validRoles.has(role)) fail("Informe um e-mail e um papel válidos.");
  if (email === GENERAL_ADMIN_EMAIL && role !== "admin") fail("O Administrador Geral do SIFCAS não pode ser rebaixado por este painel.");
  const profile = await findProfileByEmail(email);
  if (profile.id === account.id && role !== "admin") fail("Você não pode remover seu próprio acesso administrativo.");
  const supabase = await createClient();
  const { error } = await supabase.from("user_roles").upsert({ user_id: profile.id, role, updated_at: new Date().toISOString() }, { onConflict: "user_id" });
  if (error) fail("Não foi possível atualizar o papel da conta.");
  success(`Papel de ${profile.full_name || email} atualizado.`);
}
