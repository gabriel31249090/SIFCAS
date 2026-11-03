import { listPublicNoticePublications, listPublicationCampuses } from "@/lib/institutional";
import { reviewedPublicNotices } from "@/lib/public-notices-data";
import { isOfficialNoticeUrl, noticeLocalDate, type PublicNotice } from "@/lib/public-notices";

export async function loadPublicNoticeCatalog() {
  const notices = [...reviewedPublicNotices];
  // The editorial snapshot is independent of private integrations and remains available offline.
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY) {
    return { notices, editorialStatus: "unconfigured" as const };
  }
  try {
    const [rows, campuses] = await Promise.all([listPublicNoticePublications(), listPublicationCampuses()]);
    const campusNames = new Map(campuses.map((campus) => [campus.id, campus.city || campus.name]));
    for (const row of rows) {
      // Public editorial records require an official canonical source before appearing here.
      if (!row.externalUrl || !isOfficialNoticeUrl(row.externalUrl)) continue;
      if (notices.some((notice) => new URL(notice.canonicalUrl).pathname === new URL(row.externalUrl!).pathname && new URL(notice.canonicalUrl).hostname === new URL(row.externalUrl!).hostname)) continue;
      const reference = row.referenceCode?.match(/(\d+)\s*\/\s*(\d{4})/);
      const date = (value: string | null) => value ? { date: noticeLocalDate(new Date(value)) } : null;
      notices.push({
        id: `editorial-${row.id}`, sourceId: "sifcas-editorial", sourceRecordId: row.id,
        number: reference?.[1] ?? row.referenceCode ?? "Sem número", year: Number(reference?.[2] ?? row.publishedAt?.slice(0, 4)),
        issuer: "Publicação editorial do SIFCAS", campus: row.campusId ? campusNames.get(row.campusId) ?? "Campus a confirmar" : "Institucional",
        category: "Editorial", audience: "Requisitos na fonte oficial", title: row.title, summary: row.summary, sourceSummary: null,
        canonicalUrl: row.externalUrl, publishedOn: date(row.publishedAt)?.date ?? null,
        opens: date(row.startsAt), closes: date(row.endsAt), declaredStatus: "unknown", registrationUrl: null,
        verifiedOn: date(row.updatedAt)?.date ?? "1970-01-01", revision: row.updatedAt,
        reviewReasons: ["Metadados editoriais; confirme cronograma, fuso e situação no edital oficial."], documents: [], internalPublicationId: row.id,
      } satisfies PublicNotice);
    }
    return { notices, editorialStatus: "available" as const };
  } catch {
    // No deletion or fabricated synchronization on dependency failure; no personal payload logging.
    return { notices, editorialStatus: "unavailable" as const };
  }
}
