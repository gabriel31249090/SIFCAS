import { createClient as createPublicClient } from "@supabase/supabase-js";
import type { CurrentAccount } from "@/lib/auth";
import { getStudentReport } from "@/lib/diary";
import { supabasePublishableKey, supabaseUrl } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export type AcademicDocumentType = "enrollment_declaration" | "academic_record" | "completion_certificate";

export const academicDocumentLabels: Record<AcademicDocumentType, string> = {
  enrollment_declaration: "Declaração de matrícula",
  academic_record: "Histórico escolar",
  completion_certificate: "Certificado de conclusão",
};

export type AcademicDocumentSnapshot = {
  version: 1;
  holder: {
    fullName: string;
    email: string;
    enrollmentNumber: string | null;
  };
  institution: {
    name: string;
    campusName: string;
    campusCode: string;
    city: string;
    state: string;
  };
  course: {
    name: string;
    code: string;
    level: string;
  };
  class: {
    name: string;
    code: string;
    shift: string;
  };
  period: {
    name: string;
    year: number;
    term: number;
    startsOn: string;
    endsOn: string;
  };
  enrollment: {
    status: string;
    enrolledAt: string;
  };
  report: {
    overallAverage10: number | null;
    overallFrequency: number | null;
    totalAbsences: number;
    rows: Array<{
      classSubjectId: string;
      subjectName: string;
      subjectCode: string;
      average10: number | null;
      frequency: number | null;
      absences: number;
      attendanceRecords: number;
      gradedAssessments: number;
    }>;
  };
};

export type AcademicDocumentListItem = {
  id: string;
  documentType: AcademicDocumentType;
  verificationCode: string;
  issuedAt: string;
  revokedAt: string | null;
  revocationReason: string | null;
  holderName: string;
};

export type AcademicDocumentRecord = AcademicDocumentListItem & {
  enrollmentId: string;
  studentUserId: string;
  snapshot: AcademicDocumentSnapshot;
};

export type DocumentEligibility = {
  enrollmentDeclarationId: string | null;
  academicRecordId: string | null;
  completionCertificateId: string | null;
};

export async function getDocumentEligibility(userId: string): Promise<DocumentEligibility> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("enrollments")
    .select("id,status,enrolled_at")
    .eq("student_user_id", userId)
    .in("status", ["active", "completed"])
    .order("enrolled_at", { ascending: false });
  if (error) throw error;

  const rows = data ?? [];
  const active = rows.find((row) => row.status === "active") ?? null;
  const completed = rows.find((row) => row.status === "completed") ?? null;
  const latest = rows[0] ?? null;

  return {
    enrollmentDeclarationId: active?.id ?? null,
    academicRecordId: latest?.id ?? null,
    completionCertificateId: completed?.id ?? null,
  };
}

export async function buildAcademicDocumentSnapshot(
  account: CurrentAccount,
  enrollmentId: string,
): Promise<AcademicDocumentSnapshot> {
  const supabase = await createClient();
  const { data: enrollment, error: enrollmentError } = await supabase
    .from("enrollments")
    .select("id,class_id,student_user_id,enrollment_number,status,enrolled_at")
    .eq("id", enrollmentId)
    .eq("student_user_id", account.id)
    .single();
  if (enrollmentError) throw enrollmentError;

  const { data: classRow, error: classError } = await supabase
    .from("classes")
    .select("id,course_id,academic_period_id,name,code,shift")
    .eq("id", enrollment.class_id)
    .single();
  if (classError) throw classError;

  const [{ data: course, error: courseError }, { data: period, error: periodError }, { data: profile, error: profileError }] = await Promise.all([
    supabase.from("courses").select("id,campus_id,name,code,level").eq("id", classRow.course_id).single(),
    supabase.from("academic_periods").select("id,campus_id,name,year,term,starts_on,ends_on").eq("id", classRow.academic_period_id).single(),
    supabase.from("profiles").select("full_name,institutional_email").eq("id", account.id).single(),
  ]);
  const firstError = [courseError, periodError, profileError].find(Boolean);
  if (firstError) throw firstError;

  const { data: campus, error: campusError } = await supabase
    .from("campuses")
    .select("id,name,code,city,state")
    .eq("id", course!.campus_id)
    .single();
  if (campusError) throw campusError;

  const report = await getStudentReport(account.id, classRow.id);

  return {
    version: 1,
    holder: {
      fullName: profile?.full_name?.trim() || account.fullName,
      email: profile?.institutional_email?.trim() || account.email,
      enrollmentNumber: enrollment.enrollment_number,
    },
    institution: {
      name: "Instituto Federal de Educação, Ciência e Tecnologia de Mato Grosso",
      campusName: campus.name,
      campusCode: campus.code,
      city: campus.city,
      state: campus.state,
    },
    course: {
      name: course?.name ?? "Curso",
      code: course?.code ?? "",
      level: course?.level ?? "",
    },
    class: {
      name: classRow.name,
      code: classRow.code,
      shift: classRow.shift,
    },
    period: {
      name: period?.name ?? "Período letivo",
      year: period?.year ?? new Date().getFullYear(),
      term: period?.term ?? 1,
      startsOn: period?.starts_on ?? "",
      endsOn: period?.ends_on ?? "",
    },
    enrollment: {
      status: enrollment.status,
      enrolledAt: enrollment.enrolled_at,
    },
    report,
  };
}

export async function listAcademicDocuments(): Promise<AcademicDocumentListItem[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_documents")
    .select("id,document_type,verification_code,issued_at,revoked_at,revocation_reason,snapshot")
    .order("issued_at", { ascending: false })
    .limit(80);
  if (error) throw error;

  return (data ?? []).map((row) => {
    const snapshot = row.snapshot as unknown as AcademicDocumentSnapshot;
    return {
      id: row.id,
      documentType: row.document_type as AcademicDocumentType,
      verificationCode: row.verification_code,
      issuedAt: row.issued_at,
      revokedAt: row.revoked_at,
      revocationReason: row.revocation_reason,
      holderName: snapshot?.holder?.fullName ?? "Estudante",
    };
  });
}

export async function getAcademicDocumentById(id: string): Promise<AcademicDocumentRecord | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_documents")
    .select("id,student_user_id,enrollment_id,document_type,verification_code,issued_at,revoked_at,revocation_reason,snapshot")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;
  const snapshot = data.snapshot as unknown as AcademicDocumentSnapshot;
  return {
    id: data.id,
    studentUserId: data.student_user_id,
    enrollmentId: data.enrollment_id,
    documentType: data.document_type as AcademicDocumentType,
    verificationCode: data.verification_code,
    issuedAt: data.issued_at,
    revokedAt: data.revoked_at,
    revocationReason: data.revocation_reason,
    holderName: snapshot?.holder?.fullName ?? "Estudante",
    snapshot,
  };
}

export async function verifyAcademicDocument(code: string): Promise<AcademicDocumentRecord | null> {
  const normalized = code.trim().toUpperCase();
  if (!/^SIF-[A-Z0-9]{16}$/.test(normalized)) return null;

  const client = createPublicClient(supabaseUrl, supabasePublishableKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    global: { headers: { "x-verification-code": normalized } },
  });
  const { data, error } = await client
    .from("academic_documents")
    .select("id,student_user_id,enrollment_id,document_type,verification_code,issued_at,revoked_at,revocation_reason,snapshot")
    .eq("verification_code", normalized)
    .maybeSingle();
  if (error || !data) return null;
  const snapshot = data.snapshot as unknown as AcademicDocumentSnapshot;
  return {
    id: data.id,
    studentUserId: data.student_user_id,
    enrollmentId: data.enrollment_id,
    documentType: data.document_type as AcademicDocumentType,
    verificationCode: data.verification_code,
    issuedAt: data.issued_at,
    revokedAt: data.revoked_at,
    revocationReason: data.revocation_reason,
    holderName: snapshot?.holder?.fullName ?? "Estudante",
    snapshot,
  };
}
