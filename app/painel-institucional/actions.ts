"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireAccount, type AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import type { PublicationKind, PublicationStatus, PublicationVisibility } from "@/lib/institutional";

const validKinds = new Set<PublicationKind>(["news", "notice", "edital", "event"]);
const validStatuses = new Set<PublicationStatus>(["draft", "published", "archived"]);
const validVisibility = new Set<PublicationVisibility>(["public", "authenticated"]);
const validRoles = new Set<AppRole>(["student", "teacher", "staff", "manager", "admin"]);

function text(formData: FormData, name: string) {
  return String(formData.get(name) ?? "").trim();
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
    if (!['http:', 'https:'].includes(url.protocol)) return null;
    return url.toString();
  } catch {
    return null;
  }
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
  const audienceRoles = formData.getAll("audience").map((value) => String(value) as AppRole).filter((role) => validRoles.has(role));

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
  refreshInstitutional(data.id);
  done(publishNow ? "Publicação criada e publicada. As notificações foram distribuídas." : "Rascunho criado com sucesso.");
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
