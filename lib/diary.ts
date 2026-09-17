import type { CurrentAccount } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

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

export async function getDiaryContext(
  account: CurrentAccount,
  requestedClassSubjectId?: string,
  requestedSessionId?: string,
  requestedAssessmentId?: string,
): Promise<DiaryContext> {
  const supabase = await createClient();
  let classSubjectIds: string[] = [];

  if (account.role === "teacher") {
    const { data, error } = await supabase
      .from("teaching_assignments")
      .select("class_subject_id")
      .eq("teacher_user_id", account.id);
    if (error) throw error;
    classSubjectIds = (data ?? []).map((row) => row.class_subject_id);
  } else if (["manager", "admin"].includes(account.role)) {
    const { data, error } = await supabase.from("class_subjects").select("id").eq("active", true);
    if (error) throw error;
    classSubjectIds = (data ?? []).map((row) => row.id);
  }

  classSubjectIds = unique(classSubjectIds);
  if (!classSubjectIds.length) {
    return {
      options: [], selected: null, students: [], sessions: [], assessments: [],
      selectedSessionId: null, selectedAssessmentId: null, attendance: {}, grades: {},
    };
  }

  const { data: classSubjects, error: classSubjectError } = await supabase
    .from("class_subjects")
    .select("id,class_id,subject_id")
    .in("id", classSubjectIds)
    .eq("active", true);
  if (classSubjectError) throw classSubjectError;

  const classIds = unique((classSubjects ?? []).map((row) => row.class_id));
  const subjectIds = unique((classSubjects ?? []).map((row) => row.subject_id));
  const [{ data: classes, error: classesError }, { data: subjects, error: subjectsError }] = await Promise.all([
    supabase.from("classes").select("id,name,code").in("id", classIds),
    supabase.from("subjects").select("id,name,code").in("id", subjectIds),
  ]);
  if (classesError) throw classesError;
  if (subjectsError) throw subjectsError;

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

  const selected = options.find((option) => option.classSubjectId === requestedClassSubjectId) ?? options[0] ?? null;
  if (!selected) {
    return {
      options, selected: null, students: [], sessions: [], assessments: [],
      selectedSessionId: null, selectedAssessmentId: null, attendance: {}, grades: {},
    };
  }

  const [{ data: enrollments, error: enrollmentError }, { data: sessions, error: sessionsError }, { data: assessments, error: assessmentsError }] = await Promise.all([
    supabase
      .from("enrollments")
      .select("id,student_user_id,enrollment_number")
      .eq("class_id", selected.classId)
      .eq("status", "active")
      .order("enrolled_at"),
    supabase
      .from("class_sessions")
      .select("id,session_date,starts_at,ends_at,content,notes")
      .eq("class_subject_id", selected.classSubjectId)
      .order("session_date", { ascending: false })
      .limit(24),
    supabase
      .from("academic_assessments")
      .select("id,title,description,assessment_date,max_score,weight")
      .eq("class_subject_id", selected.classSubjectId)
      .order("assessment_date", { ascending: false })
      .limit(24),
  ]);
  if (enrollmentError) throw enrollmentError;
  if (sessionsError) throw sessionsError;
  if (assessmentsError) throw assessmentsError;

  const studentIds = unique((enrollments ?? []).map((row) => row.student_user_id));
  const profilesResult = studentIds.length
    ? await supabase.from("profiles").select("id,full_name").in("id", studentIds)
    : { data: [], error: null };
  if (profilesResult.error) throw profilesResult.error;
  const profileMap = new Map((profilesResult.data ?? []).map((row) => [row.id, row.full_name]));

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

  const selectedSessionId = mappedSessions.some((row) => row.id === requestedSessionId)
    ? requestedSessionId!
    : mappedSessions[0]?.id ?? null;
  const selectedAssessmentId = mappedAssessments.some((row) => row.id === requestedAssessmentId)
    ? requestedAssessmentId!
    : mappedAssessments[0]?.id ?? null;

  const attendanceResult = selectedSessionId
    ? await supabase.from("attendance_records").select("student_user_id,status").eq("session_id", selectedSessionId)
    : { data: [], error: null };
  if (attendanceResult.error) throw attendanceResult.error;

  const gradesResult = selectedAssessmentId
    ? await supabase.from("grades").select("student_user_id,score").eq("assessment_id", selectedAssessmentId)
    : { data: [], error: null };
  if (gradesResult.error) throw gradesResult.error;

  return {
    options,
    selected,
    students,
    sessions: mappedSessions,
    assessments: mappedAssessments,
    selectedSessionId,
    selectedAssessmentId,
    attendance: Object.fromEntries((attendanceResult.data ?? []).map((row) => [row.student_user_id, row.status])),
    grades: Object.fromEntries((gradesResult.data ?? []).map((row) => [row.student_user_id, Number(row.score)])),
  };
}

export async function getStudentReport(userId: string, classId: string): Promise<StudentReport> {
  const supabase = await createClient();
  const { data: classSubjects, error: classSubjectsError } = await supabase
    .from("class_subjects")
    .select("id,subject_id")
    .eq("class_id", classId)
    .eq("active", true);
  if (classSubjectsError) throw classSubjectsError;

  const classSubjectIds = unique((classSubjects ?? []).map((row) => row.id));
  const subjectIds = unique((classSubjects ?? []).map((row) => row.subject_id));
  if (!classSubjectIds.length) {
    return { rows: [], overallAverage10: null, overallFrequency: null, totalAbsences: 0 };
  }

  const [{ data: subjects, error: subjectsError }, { data: assessments, error: assessmentsError }, { data: sessions, error: sessionsError }] = await Promise.all([
    supabase.from("subjects").select("id,name,code").in("id", subjectIds),
    supabase.from("academic_assessments").select("id,class_subject_id,max_score,weight").in("class_subject_id", classSubjectIds),
    supabase.from("class_sessions").select("id,class_subject_id").in("class_subject_id", classSubjectIds),
  ]);
  if (subjectsError) throw subjectsError;
  if (assessmentsError) throw assessmentsError;
  if (sessionsError) throw sessionsError;

  const assessmentIds = (assessments ?? []).map((row) => row.id);
  const sessionIds = (sessions ?? []).map((row) => row.id);
  const gradesResult = assessmentIds.length
    ? await supabase.from("grades").select("assessment_id,score").eq("student_user_id", userId).in("assessment_id", assessmentIds)
    : { data: [], error: null };
  const attendanceResult = sessionIds.length
    ? await supabase.from("attendance_records").select("session_id,status").eq("student_user_id", userId).in("session_id", sessionIds)
    : { data: [], error: null };
  if (gradesResult.error) throw gradesResult.error;
  if (attendanceResult.error) throw attendanceResult.error;

  const subjectMap = new Map((subjects ?? []).map((row) => [row.id, row]));
  const subjectIdByClassSubject = new Map((classSubjects ?? []).map((row) => [row.id, row.subject_id]));
  const assessmentMap = new Map((assessments ?? []).map((row) => [row.id, row]));
  const sessionMap = new Map((sessions ?? []).map((row) => [row.id, row]));
  const gradeMap = new Map((gradesResult.data ?? []).map((row) => [row.assessment_id, Number(row.score)]));

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
    const subjectAttendance = (attendanceResult.data ?? []).filter((row) => subjectSessionIds.has(row.session_id));
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
