import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { DiaryValidationError, readDiaryIds, readDiaryPage, readDiaryRows, selectDiaryRecord } from "@/lib/diary-security";

export type DiaryOption = {
  classSubjectId: string;
  classId: string;
  className: string;
  subjectName: string;
  label: string;
};

export type DiaryStudent = {
  userId: string;
  enrollmentId: string;
  enrollmentNumber: string | null;
  fullName: string;
};

export type DiarySession = {
  id: string;
  sessionDate: string;
  startsAt: string | null;
  endsAt: string | null;
  content: string;
  notes: string;
};

export type DiaryAssessment = {
  id: string;
  title: string;
  description: string;
  assessmentDate: string;
  maxScore: number;
  weight: number;
};

export type DiaryContext = {
  options: DiaryOption[];
  selected: DiaryOption | null;
  students: DiaryStudent[];
  sessions: DiarySession[];
  assessments: DiaryAssessment[];
  selectedSessionId: string | null;
  selectedAssessmentId: string | null;
  attendance: Record<string, string>;
  grades: Record<string, number>;
  selectedSession: DiarySession | null;
  selectedAssessment: DiaryAssessment | null;
  sessionPagination: { page: number; pages: number; total: number };
  assessmentPagination: { page: number; pages: number; total: number };
};

export type StudentReportRow = {
  classSubjectId: string;
  subjectName: string;
  subjectCode: string;
  average10: number | null;
  frequency: number | null;
  absences: number;
  attendanceRecords: number;
  gradedAssessments: number;
};

export type StudentReport = {
  rows: StudentReportRow[];
  overallAverage10: number | null;
  overallFrequency: number | null;
  totalAbsences: number;
};

function unique(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function emptyDiary(options: DiaryOption[] = []): DiaryContext {
  return {
    options, selected: null, students: [], sessions: [], assessments: [],
    selectedSessionId: null, selectedAssessmentId: null, attendance: {}, grades: {},
    selectedSession: null, selectedAssessment: null,
    sessionPagination: { page: 1, pages: 1, total: 0 },
    assessmentPagination: { page: 1, pages: 1, total: 0 },
  };
}

export async function getDiaryContext(
  account: CurrentAccount,
  requestedClassSubjectId?: string,
  requestedSessionId?: string,
  requestedAssessmentId?: string,
  pagination: { sessionsPage?: unknown; assessmentsPage?: unknown } = {},
): Promise<DiaryContext> {
  const supabase = await createClient();
  let classSubjectIds: string[] = [];

  if (account.role === "teacher") {
    const data = await readDiaryRows((from, to) => supabase
      .from("teaching_assignments")
      .select("class_subject_id")
      .eq("teacher_user_id", account.id).order("id").range(from, to));
    classSubjectIds = (data ?? []).map((row) => row.class_subject_id);
  } else if (["manager", "admin"].includes(account.role)) {
    const data = await readDiaryRows((from, to) => supabase.from("class_subjects").select("id").eq("active", true).order("id").range(from, to));
    classSubjectIds = (data ?? []).map((row) => row.id);
  }

  classSubjectIds = unique(classSubjectIds);
  if (!classSubjectIds.length) {
    if (requestedClassSubjectId) throw new DiaryValidationError("Você não possui permissão para essa turma.");
    return emptyDiary();
  }

  const classSubjects = await readDiaryIds(classSubjectIds, (ids, from, to) => supabase
    .from("class_subjects")
    .select("id,class_id,subject_id")
    .in("id", ids)
    .eq("active", true).order("id").range(from, to));

  const classIds = unique((classSubjects ?? []).map((row) => row.class_id));
  const subjectIds = unique((classSubjects ?? []).map((row) => row.subject_id));
  const [classes, subjects] = await Promise.all([
    readDiaryIds(classIds, (ids, from, to) => supabase.from("classes").select("id,name,code").in("id", ids).order("id").range(from, to)),
    readDiaryIds(subjectIds, (ids, from, to) => supabase.from("subjects").select("id,name,code").in("id", ids).order("id").range(from, to)),
  ]);

  const classMap = new Map((classes ?? []).map((row) => [row.id, row]));
  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row]));
  const options: DiaryOption[] = (classSubjects ?? []).map((row) => {
    const classRow = classMap.get(row.class_id);
    const subjectRow = subjectMap.get(row.subject_id);
    const className = classRow?.name ?? classRow?.code ?? "Turma";
    const subjectName = subjectRow?.name ?? subjectRow?.code ?? "Disciplina";
    return {
      classSubjectId: row.id,
      classId: row.class_id,
      className,
      subjectName,
      label: `${className} • ${subjectName}`,
    };
  }).sort((a, b) => a.label.localeCompare(b.label, "pt-BR"));

  if (requestedClassSubjectId && !options.some((option) => option.classSubjectId === requestedClassSubjectId)) {
    throw new DiaryValidationError("Você não possui permissão para essa turma.");
  }
  const selected = options.find((option) => option.classSubjectId === requestedClassSubjectId) ?? options[0] ?? null;
  if (!selected) {
    return emptyDiary(options);
  }

  const [enrollments, sessionsResult, assessmentsResult] = await Promise.all([
    readDiaryRows((from, to) => supabase
      .from("enrollments")
      .select("id,student_user_id,enrollment_number")
      .eq("class_id", selected.classId)
      .eq("status", "active")
      .order("enrolled_at").order("id").range(from, to)),
    readDiaryPage((from, to) => supabase
      .from("class_sessions")
      .select("id,session_date,starts_at,ends_at,content,notes", { count: "exact" })
      .eq("class_subject_id", selected.classSubjectId)
      .order("session_date", { ascending: false })
      .order("id").range(from, to), pagination.sessionsPage),
    readDiaryPage((from, to) => supabase
      .from("academic_assessments")
      .select("id,title,description,assessment_date,max_score,weight", { count: "exact" })
      .eq("class_subject_id", selected.classSubjectId)
      .order("assessment_date", { ascending: false })
      .order("id").range(from, to), pagination.assessmentsPage),
  ]);
  const sessions = sessionsResult.rows;
  const assessments = assessmentsResult.rows;

  const studentIds = unique((enrollments ?? []).map((row) => row.student_user_id));
  const profiles = await readDiaryIds(studentIds, (ids, from, to) => supabase.from("profiles").select("id,full_name").in("id", ids).order("id").range(from, to));
  const profileMap = new Map(profiles.map((row) => [row.id, row.full_name]));

  const students: DiaryStudent[] = (enrollments ?? []).map((row) => ({
    userId: row.student_user_id,
    enrollmentId: row.id,
    enrollmentNumber: row.enrollment_number,
    fullName: profileMap.get(row.student_user_id)?.trim() || row.enrollment_number || "Estudante",
  })).sort((a, b) => a.fullName.localeCompare(b.fullName, "pt-BR"));

  const mappedSessions: DiarySession[] = (sessions ?? []).map((row) => ({
    id: row.id,
    sessionDate: row.session_date,
    startsAt: row.starts_at,
    endsAt: row.ends_at,
    content: row.content,
    notes: row.notes,
  }));
  const mappedAssessments: DiaryAssessment[] = (assessments ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    assessmentDate: row.assessment_date,
    maxScore: Number(row.max_score),
    weight: Number(row.weight),
  }));

  const selectedSession = await selectDiaryRecord(mappedSessions, requestedSessionId, async (id) => {
    const { data, error } = await supabase.from("class_sessions").select("id,session_date,starts_at,ends_at,content,notes")
      .eq("id", id).eq("class_subject_id", selected.classSubjectId).maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, sessionDate: data.session_date, startsAt: data.starts_at, endsAt: data.ends_at, content: data.content, notes: data.notes } : null;
  });
  const selectedAssessment = await selectDiaryRecord(mappedAssessments, requestedAssessmentId, async (id) => {
    const { data, error } = await supabase.from("academic_assessments").select("id,title,description,assessment_date,max_score,weight")
      .eq("id", id).eq("class_subject_id", selected.classSubjectId).maybeSingle();
    if (error) throw error;
    return data ? { id: data.id, title: data.title, description: data.description, assessmentDate: data.assessment_date, maxScore: Number(data.max_score), weight: Number(data.weight) } : null;
  });
  const selectedSessionId = selectedSession?.id ?? null;
  const selectedAssessmentId = selectedAssessment?.id ?? null;

  const attendance = selectedSessionId
    ? await readDiaryRows((from, to) => supabase.from("attendance_records").select("student_user_id,status").eq("session_id", selectedSessionId).order("student_user_id").range(from, to)) : [];

  const grades = selectedAssessmentId
    ? await readDiaryRows((from, to) => supabase.from("grades").select("student_user_id,score").eq("assessment_id", selectedAssessmentId).order("student_user_id").range(from, to)) : [];

  return {
    options,
    selected,
    students,
    sessions: mappedSessions,
    assessments: mappedAssessments,
    selectedSessionId,
    selectedAssessmentId,
    selectedSession,
    selectedAssessment,
    sessionPagination: { page: sessionsResult.page, pages: sessionsResult.pages, total: sessionsResult.total },
    assessmentPagination: { page: assessmentsResult.page, pages: assessmentsResult.pages, total: assessmentsResult.total },
    attendance: Object.fromEntries(attendance.map((row) => [row.student_user_id, row.status])),
    grades: Object.fromEntries(grades.filter((row) => row.score !== null).map((row) => [row.student_user_id, Number(row.score)])),
  };
}

export async function getStudentReport(userId: string, classId: string): Promise<StudentReport> {
  const supabase = await createClient();
  const classSubjects = await readDiaryRows((from, to) => supabase
    .from("class_subjects")
    .select("id,subject_id")
    .eq("class_id", classId)
    .eq("active", true).order("id").range(from, to));

  const classSubjectIds = unique((classSubjects ?? []).map((row) => row.id));
  const subjectIds = unique((classSubjects ?? []).map((row) => row.subject_id));
  if (!classSubjectIds.length) {
    return { rows: [], overallAverage10: null, overallFrequency: null, totalAbsences: 0 };
  }

  const [subjects, assessments, sessions] = await Promise.all([
    readDiaryIds(subjectIds, (ids, from, to) => supabase.from("subjects").select("id,name,code").in("id", ids).order("id").range(from, to)),
    readDiaryIds(classSubjectIds, (ids, from, to) => supabase.from("academic_assessments").select("id,class_subject_id,max_score,weight").in("class_subject_id", ids).order("id").range(from, to)),
    readDiaryIds(classSubjectIds, (ids, from, to) => supabase.from("class_sessions").select("id,class_subject_id").in("class_subject_id", ids).order("id").range(from, to)),
  ]);

  const assessmentIds = (assessments ?? []).map((row) => row.id);
  const sessionIds = (sessions ?? []).map((row) => row.id);
  const [grades, attendance] = await Promise.all([
    readDiaryIds(assessmentIds, (ids, from, to) => supabase.from("grades").select("assessment_id,score").eq("student_user_id", userId).in("assessment_id", ids).order("assessment_id").range(from, to)),
    readDiaryIds(sessionIds, (ids, from, to) => supabase.from("attendance_records").select("session_id,status").eq("student_user_id", userId).in("session_id", ids).order("session_id").range(from, to)),
  ]);

  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row]));
  const subjectIdByClassSubject = new Map((classSubjects ?? []).map((row) => [row.id, row.subject_id]));
  const gradeMap = new Map(grades.filter((row) => row.score !== null).map((row) => [row.assessment_id, Number(row.score)]));

  const rows: StudentReportRow[] = classSubjectIds.map((classSubjectId) => {
    const subjectId = subjectIdByClassSubject.get(classSubjectId) ?? "";
    const subject = subjectMap.get(subjectId);
    const subjectAssessments = (assessments ?? []).filter((row) => row.class_subject_id === classSubjectId && gradeMap.has(row.id));
    let weightedEarned = 0;
    let totalWeight = 0;
    subjectAssessments.forEach((assessment) => {
      const score = gradeMap.get(assessment.id) ?? 0;
      const maxScore = Number(assessment.max_score) || 10;
      const weight = Number(assessment.weight) || 1;
      weightedEarned += (score / maxScore) * weight;
      totalWeight += weight;
    });

    const subjectSessionIds = new Set((sessions ?? []).filter((row) => row.class_subject_id === classSubjectId).map((row) => row.id));
    const subjectAttendance = attendance.filter((row) => subjectSessionIds.has(row.session_id));
    const absences = subjectAttendance.filter((row) => row.status === "absent").length;
    const frequency = subjectAttendance.length
      ? ((subjectAttendance.length - absences) / subjectAttendance.length) * 100
      : null;

    return {
      classSubjectId,
      subjectName: subject?.name ?? "Disciplina",
      subjectCode: subject?.code ?? "",
      average10: totalWeight ? (weightedEarned / totalWeight) * 10 : null,
      frequency,
      absences,
      attendanceRecords: subjectAttendance.length,
      gradedAssessments: subjectAssessments.length,
    };
  }).sort((a, b) => a.subjectName.localeCompare(b.subjectName, "pt-BR"));

  const averages = rows.map((row) => row.average10).filter((value): value is number => value !== null);
  const attendanceRows = rows.filter((row) => row.frequency !== null);
  const totalAttendanceRecords = attendanceRows.reduce((sum, row) => sum + row.attendanceRecords, 0);
  const totalPresentEquivalent = attendanceRows.reduce((sum, row) => sum + (row.attendanceRecords - row.absences), 0);

  return {
    rows,
    overallAverage10: averages.length ? averages.reduce((sum, value) => sum + value, 0) / averages.length : null,
    overallFrequency: totalAttendanceRecords ? (totalPresentEquivalent / totalAttendanceRecords) * 100 : null,
    totalAbsences: rows.reduce((sum, row) => sum + row.absences, 0),
  };
}
