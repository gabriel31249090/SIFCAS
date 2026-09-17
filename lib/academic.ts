import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export type AcademicOverview = {
  campuses: Array<{ id: string; code: string; name: string; city: string; state: string }>;
  campusCount: number;
  courseCount: number;
  subjectCount: number;
  classCount: number;
  enrollmentCount: number;
};

export type StudentAcademicContext = {
  enrollmentId: string;
  enrollmentNumber: string | null;
  status: string;
  classId: string;
  className: string;
  classCode: string;
  shift: string;
  courseName: string;
  courseCode: string;
  periodName: string;
  subjects: Array<{ id: string; name: string; code: string; workloadHours: number }>;
  schedules: Array<{ id: string; weekday: number; startsAt: string; endsAt: string; room: string | null; subjectName: string }>;
};

export type AgendaOption = {
  classSubjectId: string;
  className: string;
  subjectName: string;
  label: string;
};

export type AgendaEntry = {
  id: string;
  classSubjectId: string;
  entryDate: string;
  startsAt: string | null;
  entryType: string;
  title: string;
  description: string;
  status: string;
  className: string;
  subjectName: string;
};

export type AgendaContext = {
  entries: AgendaEntry[];
  options: AgendaOption[];
  canPublish: boolean;
  today: string;
};

function localDateISO(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/Cuiaba",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const year = parts.find((part) => part.type === "year")?.value ?? "1970";
  const month = parts.find((part) => part.type === "month")?.value ?? "01";
  const day = parts.find((part) => part.type === "day")?.value ?? "01";
  return `${year}-${month}-${day}`;
}

function addDays(iso: string, days: number) {
  const date = new Date(`${iso}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export async function getAcademicOverview(): Promise<AcademicOverview> {
  const supabase = await createClient();
  const [campusesResult, coursesResult, subjectsResult, classesResult, enrollmentsResult] = await Promise.all([
    supabase.from("campuses").select("id,code,name,city,state", { count: "exact" }).eq("active", true).order("name"),
    supabase.from("courses").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("subjects").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("classes").select("id", { count: "exact", head: true }).eq("active", true),
    supabase.from("enrollments").select("id", { count: "exact", head: true }).eq("status", "active"),
  ]);

  const firstError = [campusesResult.error, coursesResult.error, subjectsResult.error, classesResult.error, enrollmentsResult.error].find(Boolean);
  if (firstError) throw firstError;

  return {
    campuses: campusesResult.data ?? [],
    campusCount: campusesResult.count ?? 0,
    courseCount: coursesResult.count ?? 0,
    subjectCount: subjectsResult.count ?? 0,
    classCount: classesResult.count ?? 0,
    enrollmentCount: enrollmentsResult.count ?? 0,
  };
}

export async function getStudentAcademicContext(userId: string): Promise<StudentAcademicContext | null> {
  const supabase = await createClient();
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id,class_id,status,enrollment_number")
    .eq("student_user_id", userId)
    .eq("status", "active")
    .order("enrolled_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (enrollmentError) throw enrollmentError;
  if (!enrollment) return null;

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,name,code,shift,course_id,academic_period_id")
    .eq("id", enrollment.class_id)
    .single();
  if (classError) throw classError;

  const [{ data: course, error: courseError }, { data: period, error: periodError }, { data: classSubjects, error: classSubjectsError }] = await Promise.all([
    supabase.from("courses").select("id,name,code").eq("id", classRow.course_id).single(),
    supabase.from("academic_periods").select("id,name").eq("id", classRow.academic_period_id).single(),
    supabase.from("class_subjects").select("id,subject_id").eq("class_id", classRow.id).eq("active", true),
  ]);

  const firstError = [courseError, periodError, classSubjectsError].find(Boolean);
  if (firstError) throw firstError;

  const classSubjectRows = classSubjects ?? [];
  const subjectIds = classSubjectRows.map((row) => row.subject_id);
  const classSubjectIds = classSubjectRows.map((row) => row.id);

  const subjectsResult = subjectIds.length
    ? await supabase.from("subjects").select("id,name,code,workload_hours").in("id", subjectIds).order("name")
    : { data: [], error: null };
  if (subjectsResult.error) throw subjectsResult.error;

  const schedulesResult = classSubjectIds.length
    ? await supabase.from("class_schedules").select("id,class_subject_id,weekday,starts_at,ends_at,room").in("class_subject_id", classSubjectIds).order("weekday").order("starts_at")
    : { data: [], error: null };
  if (schedulesResult.error) throw schedulesResult.error;

  const subjectMap = new Map((subjectsResult.data ?? []).map((subject) => [subject.id, subject]));
  const subjectByClassSubject = new Map(classSubjectRows.map((row) => [row.id, subjectMap.get(row.subject_id)?.name ?? "Disciplina"]));

  return {
    enrollmentId: enrollment.id,
    enrollmentNumber: enrollment.enrollment_number,
    status: enrollment.status,
    classId: classRow.id,
    className: classRow.name,
    classCode: classRow.code,
    shift: classRow.shift,
    courseName: course?.name ?? "Curso",
    courseCode: course?.code ?? "",
    periodName: period?.name ?? "Período acadêmico",
    subjects: (subjectsResult.data ?? []).map((subject) => ({
      id: subject.id,
      name: subject.name,
      code: subject.code,
      workloadHours: subject.workload_hours,
    })),
    schedules: (schedulesResult.data ?? []).map((schedule) => ({
      id: schedule.id,
      weekday: schedule.weekday,
      startsAt: schedule.starts_at,
      endsAt: schedule.ends_at,
      room: schedule.room,
      subjectName: subjectByClassSubject.get(schedule.class_subject_id) ?? "Disciplina",
    })),
  };
}

export async function getAgendaContext(account: CurrentAccount): Promise<AgendaContext> {
  const supabase = await createClient();
  const today = localDateISO();
  const through = addDays(today, 35);
  let classSubjectIds: string[] = [];

  if (account.role === "student") {
    const { data: enrollments, error } = await supabase
      .from("enrollments")
      .select("class_id")
      .eq("student_user_id", account.id)
      .eq("status", "active");
    if (error) throw error;
    const classIds = [...new Set((enrollments ?? []).map((row) => row.class_id))];
    if (classIds.length) {
      const { data, error: classSubjectError } = await supabase
        .from("class_subjects")
        .select("id")
        .in("class_id", classIds)
        .eq("active", true);
      if (classSubjectError) throw classSubjectError;
      classSubjectIds = (data ?? []).map((row) => row.id);
    }
  } else if (account.role === "teacher") {
    const { data, error } = await supabase
      .from("teaching_assignments")
      .select("class_subject_id")
      .eq("teacher_user_id", account.id);
    if (error) throw error;
    classSubjectIds = (data ?? []).map((row) => row.class_subject_id);
  } else {
    const { data, error } = await supabase
      .from("class_subjects")
      .select("id")
      .eq("active", true);
    if (error) throw error;
    classSubjectIds = (data ?? []).map((row) => row.id);
  }

  classSubjectIds = [...new Set(classSubjectIds)];
  if (!classSubjectIds.length) {
    return { entries: [], options: [], canPublish: false, today };
  }

  const { data: classSubjects, error: classSubjectError } = await supabase
    .from("class_subjects")
    .select("id,class_id,subject_id")
    .in("id", classSubjectIds);
  if (classSubjectError) throw classSubjectError;

  const classIds = [...new Set((classSubjects ?? []).map((row) => row.class_id))];
  const subjectIds = [...new Set((classSubjects ?? []).map((row) => row.subject_id))];
  const [{ data: classes, error: classesError }, { data: subjects, error: subjectsError }, { data: entries, error: entriesError }] = await Promise.all([
    supabase.from("classes").select("id,name,code").in("id", classIds),
    supabase.from("subjects").select("id,name,code").in("id", subjectIds),
    supabase
      .from("class_agenda_entries")
      .select("id,class_subject_id,entry_date,starts_at,entry_type,title,description,status")
      .in("class_subject_id", classSubjectIds)
      .gte("entry_date", today)
      .lte("entry_date", through)
      .order("entry_date")
      .order("starts_at"),
  ]);

  const firstError = [classesError, subjectsError, entriesError].find(Boolean);
  if (firstError) throw firstError;

  const classMap = new Map((classes ?? []).map((row) => [row.id, row]));
  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row]));
  const metadata = new Map(
    (classSubjects ?? []).map((row) => {
      const classRow = classMap.get(row.class_id);
      const subjectRow = subjectMap.get(row.subject_id);
      return [row.id, {
        className: classRow?.name ?? classRow?.code ?? "Turma",
        subjectName: subjectRow?.name ?? subjectRow?.code ?? "Disciplina",
      }];
    }),
  );

  const options = classSubjectIds.map((classSubjectId) => {
    const meta = metadata.get(classSubjectId) ?? { className: "Turma", subjectName: "Disciplina" };
    return {
      classSubjectId,
      className: meta.className,
      subjectName: meta.subjectName,
      label: `${meta.className} • ${meta.subjectName}`,
    };
  }).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  return {
    today,
    options,
    canPublish: ["teacher", "manager", "admin"].includes(account.role) && options.length > 0,
    entries: (entries ?? []).map((entry) => {
      const meta = metadata.get(entry.class_subject_id) ?? { className: "Turma", subjectName: "Disciplina" };
      return {
        id: entry.id,
        classSubjectId: entry.class_subject_id,
        entryDate: entry.entry_date,
        startsAt: entry.starts_at,
        entryType: entry.entry_type,
        title: entry.title,
        description: entry.description,
        status: entry.status,
        className: meta.className,
        subjectName: meta.subjectName,
      };
    }),
  };
}
