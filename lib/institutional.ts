import type { AppRole } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { publicationSearchTerm } from "@/lib/search-utils";

export type PublicationKind = "news" | "notice" | "edital" | "event";
export type PublicationStatus = "draft" | "published" | "archived";
export type PublicationVisibility = "public" | "authenticated";

export const publicationKindLabels: Record<PublicationKind, string> = {
  news: "Notícia",
  notice: "Comunicado",
  edital: "Edital",
  event: "Evento",
};

export const publicationStatusLabels: Record<PublicationStatus, string> = {
  draft: "Rascunho",
  published: "Publicado",
  archived: "Arquivado",
};

export type InstitutionalPublication = {
  id: string;
  campusId: string | null;
  kind: PublicationKind;
  referenceCode: string | null;
  title: string;
  summary: string;
  content: string;
  status: PublicationStatus;
  visibility: PublicationVisibility;
  audienceRoles: AppRole[];
  startsAt: string | null;
  endsAt: string | null;
  expiresAt: string | null;
  location: string | null;
  externalUrl: string | null;
  createdBy: string;
  updatedBy: string | null;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type PublicationAttachment = {
  id: string;
  publicationId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: number;
  createdAt: string;
};

export type SifcasNotification = {
  id: string;
  title: string;
  body: string;
  href: string;
  sourceType: string;
  sourceId: string | null;
  readAt: string | null;
  createdAt: string;
};

const PUBLICATION_COLUMNS = "id,campus_id,kind,reference_code,title,summary,content,status,visibility,audience_roles,starts_at,ends_at,expires_at,location,external_url,created_by,updated_by,published_at,created_at,updated_at";

function mapPublication(row: any): InstitutionalPublication {
  return {
    id: row.id,
    campusId: row.campus_id ?? null,
    kind: row.kind as PublicationKind,
    referenceCode: row.reference_code ?? null,
    title: row.title,
    summary: row.summary ?? "",
    content: row.content ?? "",
    status: row.status as PublicationStatus,
    visibility: row.visibility as PublicationVisibility,
    audienceRoles: (row.audience_roles ?? []) as AppRole[],
    startsAt: row.starts_at ?? null,
    endsAt: row.ends_at ?? null,
    expiresAt: row.expires_at ?? null,
    location: row.location ?? null,
    externalUrl: row.external_url ?? null,
    createdBy: row.created_by,
    updatedBy: row.updated_by ?? null,
    publishedAt: row.published_at ?? null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function listPublishedPublications(kinds?: PublicationKind[], limit = 60) {
  const supabase = await createClient();
  let query = supabase
    .from("institutional_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(limit);

  if (kinds?.length) query = query.in("kind", kinds);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapPublication);
}

export async function listAgendaPublications() {
  const rows = await listPublishedPublications(["event", "notice", "edital"], 120);
  const now = Date.now();
  const recentCutoff = now - 1000 * 60 * 60 * 24 * 30;

  return rows
    .filter((row) => {
      const end = row.endsAt ? new Date(row.endsAt).getTime() : null;
      const start = row.startsAt ? new Date(row.startsAt).getTime() : null;
      const published = row.publishedAt ? new Date(row.publishedAt).getTime() : new Date(row.createdAt).getTime();
      if (end !== null) return end >= now;
      if (start !== null) return start >= recentCutoff;
      return published >= recentCutoff;
    })
    .sort((a, b) => {
      const aDate = new Date(a.startsAt ?? a.endsAt ?? a.publishedAt ?? a.createdAt).getTime();
      const bDate = new Date(b.startsAt ?? b.endsAt ?? b.publishedAt ?? b.createdAt).getTime();
      return aDate - bDate;
    });
}

export async function listManagedPublications(limit = 120) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("institutional_publications")
    .select(PUBLICATION_COLUMNS)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map(mapPublication);
}

export async function getPublicationById(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("institutional_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapPublication(data) : null;
}

export async function listPublicationAttachments(publicationId: string): Promise<PublicationAttachment[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("publication_attachments")
    .select("id,publication_id,file_name,mime_type,size_bytes,created_at")
    .eq("publication_id", publicationId)
    .order("created_at");
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    publicationId: row.publication_id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: Number(row.size_bytes ?? 0),
    createdAt: row.created_at,
  }));
}

export async function listPublicationCampuses() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("campuses")
    .select("id,name,code,city,state")
    .eq("active", true)
    .order("name");
  if (error) throw error;
  return data ?? [];
}

export async function searchAccessiblePublications(rawQuery: string) {
  const query = publicationSearchTerm(rawQuery);
  if (query.length < 2) return [] as InstitutionalPublication[];
  const supabase = await createClient();
  const { data, error } = await supabase.from("institutional_publications")
    .select(PUBLICATION_COLUMNS)
    .eq("status", "published")
    .or(`title.ilike.%${query}%,summary.ilike.%${query}%,content.ilike.%${query}%,reference_code.ilike.%${query}%`)
    .order("published_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []).map(mapPublication);
}

export async function getUnreadNotificationCount(userId: string) {
  const supabase = await createClient();
  const { count, error } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .is("read_at", null);
  if (error) return 0;
  return count ?? 0;
}

export async function listNotifications(userId: string, limit = 80) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("notifications")
    .select("id,title,body,href,source_type,source_id,read_at,created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []).map((row): SifcasNotification => ({
    id: row.id,
    title: row.title,
    body: row.body ?? "",
    href: row.href || "/",
    sourceType: row.source_type,
    sourceId: row.source_id ?? null,
    readAt: row.read_at ?? null,
    createdAt: row.created_at,
  }));
}
