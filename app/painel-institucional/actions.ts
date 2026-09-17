"use server";

import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PublicationKind, PublicationStatus, PublicationVisibility } from "@/lib/institutional";

const validKinds = new Set<PublicationKind>(["news", "notice", "edital", "event"]);
const validStatuses = new Set<PublicationStatus>(["draft", "published", "archived"]);
const validVisibility = new Set<PublicationVisibility>(["public", "authenticated"]);
const validRoles = new Set<AppRole>(["student", "teacher", "staff", "manager", "admin"]);
const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;
const allowedAttachmentTypes = new Set([
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/webp",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
]);

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
}

function attachmentFrom(formData: FormData, name = "attachment") {
  const value = formData.get(name);
  return value instanceof File && value.size > 0 ? value : null;
}

function validateAttachment(file: File | null) {
  if (!file) return;
  if (file.size > MAX_ATTACHMENT_BYTES) fail("O anexo deve ter no máximo 15 MB.");
  if (!allowedAttachmentTypes.has(file.type)) fail("Formato de anexo não permitido. Use PDF, imagem, DOCX ou XLSX.");
}

function parseLocalDateTime(raw: string) {
  if (!raw) return null;
  const normalized = raw.length === 16 ? `${raw}:00-04:00` : `${raw}-04:00`;
  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function normalizeUrl(raw: string) {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
}

function safeFileName(name: string) {
  return name.normalize("NFKD").replace(/[^a-zA-Z0-9._-]+/g, "-").replace(/-+/g, "-").slice(-120) || "arquivo";
}

async function requirePublisher() {
  const account = await requireAccount();
  if (!["staff", "manager", "admin"].includes(account.role)) redirect("/acesso-negado");
  return account;
}

function refreshInstitutional(id?: string) {
  revalidatePath("/painel-institucional");
  revalidatePath("/editais");
  revalidatePath("/noticias");
  revalidatePath("/agenda-institucional");
  revalidatePath("/notificacoes");
  revalidatePath("/buscar");
  if (id) revalidatePath(`/publicacoes/${id}`);
}

function fail(message: string): never {
  redirect(`/painel-institucional?error=${encodeURIComponent(message)}`);
}

function done(message: string): never {
  redirect(`/painel-institucional?message=${encodeURIComponent(message)}`);
}

async function storeAttachment(publicationId: string, accountId: string, file: File) {
  validateAttachment(file);
  const supabase = await createClient();
  const path = `${accountId}/${publicationId}/${randomUUID()}-${safeFileName(file.name)}`;
  const { error: uploadError } = await supabase.storage
    .from("institutional-files")
    .upload(path, file, { contentType: file.type, cacheControl: "3600", upsert: false });

  if (uploadError) return "A publicação foi salva, mas o arquivo não pôde ser enviado.";

  const { error: attachmentError } = await supabase.from("publication_attachments").insert({
    publication_id: publicationId,
    storage_path: path,
    file_name: file.name.slice(0, 240),
    mime_type: file.type,
    size_bytes: file.size,
    created_by: accountId,
  });

  if (attachmentError) {
    await supabase.storage.from("institutional-files").remove([path]);
    return "A publicação foi salva, mas o anexo não pôde ser registrado.";
  }
  return null;
}

export async function createPublication(formData: FormData) {
  const account = await requirePublisher();
  const kind = text(formData, "kind") as PublicationKind;
  const title = text(formData, "title");
  const referenceCode = text(formData, "referenceCode") || null;
  const summary = text(formData, "summary");
  const content = text(formData, "content");
  const campusId = text(formData, "campusId") || null;
  const location = text(formData, "location") || null;
  const externalUrlRaw = text(formData, "externalUrl");
  const externalUrl = normalizeUrl(externalUrlRaw);
  const visibility = text(formData, "visibility") as PublicationVisibility;
  const startsAt = parseLocalDateTime(text(formData, "startsAt"));
  const endsAt = parseLocalDateTime(text(formData, "endsAt"));
  const expiresAt = parseLocalDateTime(text(formData, "expiresAt"));
  const publishNow = text(formData, "publishNow") === "yes";
  const attachment = attachmentFrom(formData);
  const audienceRoles = formData.getAll("audience").map((value) => String(value) as AppRole).filter((role) => validRoles.has(role));

  validateAttachment(attachment);
  if (!validKinds.has(kind)) fail("Selecione um tipo de publicação válido.");
  if (title.length < 3 || title.length > 220) fail("O título deve ter entre 3 e 220 caracteres.");
  if (summary.length > 600 || content.length > 20000) fail("O conteúdo ultrapassa o limite permitido.");
  if (!validVisibility.has(visibility)) fail("Visibilidade inválida.");
  if (externalUrlRaw && !externalUrl) fail("O link externo precisa começar com http:// ou https://.");
  if (startsAt && endsAt && new Date(endsAt) < new Date(startsAt)) fail("A data final não pode ser anterior à inicial.");

  const roles = audienceRoles.length ? audienceRoles : ["student", "teacher", "staff", "manager", "admin"] as AppRole[];
  const status: PublicationStatus = publishNow ? "published" : "draft";
  const supabase = await createClient();
  const { data, error } = await supabase.from("institutional_publications").insert({
    campus_id: campusId,
    kind,
    reference_code: referenceCode,
    title,
    summary,
    content,
    status,
    visibility,
    audience_roles: roles,
    starts_at: startsAt,
    ends_at: endsAt,
    expires_at: expiresAt,
    location,
    external_url: externalUrl,
    created_by: account.id,
    updated_by: account.id,
    published_at: publishNow ? new Date().toISOString() : null,
    updated_at: new Date().toISOString(),
  }).select("id").single();

  if (error || !data) fail("Não foi possível salvar a publicação.");
  const attachmentWarning = attachment ? await storeAttachment(data.id, account.id, attachment) : null;
  refreshInstitutional(data.id);
  const baseMessage = publishNow ? "Publicação criada e publicada. As notificações foram distribuídas." : "Rascunho criado com sucesso.";
  done(attachmentWarning ? `${baseMessage} ${attachmentWarning}` : baseMessage);
}

export async function addPublicationAttachment(formData: FormData) {
  const account = await requirePublisher();
  const publicationId = text(formData, "publicationId");
  const attachment = attachmentFrom(formData);
  if (!publicationId || !attachment) fail("Selecione uma publicação e um arquivo.");
  validateAttachment(attachment);
  const warning = await storeAttachment(publicationId, account.id, attachment);
  if (warning) fail(warning);
  refreshInstitutional(publicationId);
  done("Anexo enviado com sucesso.");
}

export async function setPublicationStatus(formData: FormData) {
  const account = await requirePublisher();
  const id = text(formData, "id");
  const status = text(formData, "status") as PublicationStatus;
  if (!id || !validStatuses.has(status)) fail("Publicação ou status inválido.");

  const supabase = await createClient();
  const payload: Record<string, string | null> = {
    status,
    updated_by: account.id,
    updated_at: new Date().toISOString(),
  };
  if (status === "published") payload.published_at = new Date().toISOString();

  const { error } = await supabase.from("institutional_publications").update(payload).eq("id", id);
  if (error) fail("Não foi possível atualizar o status da publicação.");
  refreshInstitutional(id);
  done(status === "published" ? "Publicação liberada e notificações enviadas." : status === "archived" ? "Publicação arquivada." : "Publicação movida para rascunho.");
}
