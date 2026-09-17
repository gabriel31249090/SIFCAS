"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount } from "@/lib/auth";
import {
  buildAcademicDocumentSnapshot,
  getDocumentEligibility,
  type AcademicDocumentType,
} from "@/lib/documents";
import { createClient } from "@/lib/supabase/server";

const allowedTypes = new Set<AcademicDocumentType>([
  "enrollment_declaration",
  "academic_record",
  "completion_certificate",
]);

export async function issueAcademicDocument(formData: FormData) {
  const account = await requireAccount();
  if (account.role !== "student") redirect("/acesso-negado");

  const documentType = String(formData.get("documentType") ?? "") as AcademicDocumentType;
  if (!allowedTypes.has(documentType)) {
    redirect("/documentos-academicos?error=Tipo+de+documento+inválido");
  }

  const eligibility = await getDocumentEligibility(account.id);
  const enrollmentId = documentType === "enrollment_declaration"
    ? eligibility.enrollmentDeclarationId
    : documentType === "academic_record"
      ? eligibility.academicRecordId
      : eligibility.completionCertificateId;

  if (!enrollmentId) {
    const message = documentType === "completion_certificate"
      ? "Certificado disponível somente para matrícula concluída."
      : "Não há matrícula elegível para este documento.";
    redirect(`/documentos-academicos?error=${encodeURIComponent(message)}`);
  }

  const snapshot = await buildAcademicDocumentSnapshot(account, enrollmentId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("academic_documents")
    .insert({
      student_user_id: account.id,
      enrollment_id: enrollmentId,
      document_type: documentType,
      snapshot,
      issued_by: account.id,
    })
    .select("id")
    .single();

  if (error || !data) {
    redirect(`/documentos-academicos?error=${encodeURIComponent("Não foi possível emitir o documento agora.")}`);
  }

  revalidatePath("/documentos-academicos");
  redirect(`/documentos-academicos/${data.id}`);
}

export async function revokeAcademicDocument(formData: FormData) {
  const account = await requireAccount();
  if (!["manager", "admin"].includes(account.role)) redirect("/acesso-negado");

  const id = String(formData.get("id") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  if (!id) redirect("/documentos-academicos?error=Documento+inválido");

  const supabase = await createClient();
  const { error } = await supabase
    .from("academic_documents")
    .update({
      revoked_at: new Date().toISOString(),
      revoked_by: account.id,
      revocation_reason: reason || "Revogado pela gestão acadêmica",
    })
    .eq("id", id)
    .is("revoked_at", null);

  if (error) {
    redirect(`/documentos-academicos?error=${encodeURIComponent("Não foi possível revogar o documento.")}`);
  }

  revalidatePath("/documentos-academicos");
  revalidatePath(`/documentos-academicos/${id}`);
  redirect("/documentos-academicos?message=Documento+revogado");
}
