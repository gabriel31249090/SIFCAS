/** Public, reviewed metadata only. This domain never fetches a supplied URL. */
export type NoticeStatus = "open" | "closed" | "cancelled" | "scheduled" | "review";
export type NoticeDate = { date: string; time?: string; timeZone?: "America/Cuiaba" };
export type NoticeDocument = {
  kind: "original" | "correction" | "extension" | "call" | "result" | "cancellation";
  title: string;
  url: string;
  verifiedOn: string;
  publishedOn?: string;
  personalData?: boolean;
};
export type PublicNotice = {
  id: string;
  sourceId: string;
  sourceRecordId: string;
  number: string;
  year: number;
  issuer: string;
  campus: string;
  category: string;
  audience: string;
  title: string;
  summary: string;
  sourceSummary: string | null;
  canonicalUrl: string;
  publishedOn: string | null;
  opens: NoticeDate | null;
  closes: NoticeDate | null;
  declaredStatus: "open" | "closed" | "cancelled" | "unknown";
  registrationUrl: string | null;
  verifiedOn: string;
  revision: string;
  reviewReasons: string[];
  documents: NoticeDocument[];
  previousVersions?: Array<{ revision: string; verifiedOn: string; summary: string }>;
  internalPublicationId?: string;
};

export const noticeStatusLabels: Record<NoticeStatus, string> = {
  open: "Aberto na fonte", closed: "Encerrado", cancelled: "Cancelado",
  scheduled: "Inscrições futuras", review: "A confirmar",
};

export const noticeDocumentLabels: Record<NoticeDocument["kind"], string> = {
  original: "Documento original", correction: "Retificação", extension: "Prorrogação",
  call: "Chamada", result: "Resultado na origem", cancellation: "Cancelamento",
};

export function isOfficialNoticeUrl(raw: string, purpose: "source" | "document" | "registration" = "source") {
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password || url.port || /[\r\n]/.test(raw)) return false;
    const hosts = purpose === "source" ? ["ifmt.edu.br", "www.ifmt.edu.br", "cas.ifmt.edu.br", "seletivo.ifmt.edu.br"]
      : purpose === "document" ? ["ifmt.edu.br", "www.ifmt.edu.br", "cas.ifmt.edu.br", "drive.google.com"]
        : ["ifmt.edu.br", "cas.ifmt.edu.br", "seletivo.ifmt.edu.br", "forms.gle", "docs.google.com"];
    if (!hosts.includes(url.hostname)) return false;
    if (url.hostname === "drive.google.com" && !/^\/file\/d\/[A-Za-z0-9_-]+\/view\/?$/.test(url.pathname)) return false;
    // Signed/private calendar links and credential-like query strings are never metadata.
    if ([...url.searchParams.keys()].some((key) => /token|secret|password|auth|key/i.test(key))) return false;
    return true;
  } catch { return false; }
}

export function noticeLocalDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
  return ["year", "month", "day"].map((type) => parts.find((part) => part.type === type)?.value).join("-");
}

export function validNoticeDate(value: unknown): value is NoticeDate {
  if (!value || typeof value !== "object" || !("date" in value) || typeof value.date !== "string") return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) return false;
  const instant = new Date(`${value.date}T12:00:00Z`);
  if (!Number.isFinite(instant.getTime()) || instant.toISOString().slice(0, 10) !== value.date) return false;
  if ("time" in value && (typeof value.time !== "string" || !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(value.time))) return false;
  return !("timeZone" in value) || value.timeZone === "America/Cuiaba";
}

function confirmedInstant(value: NoticeDate) {
  // A timezone is used only when confirmed by editorial review of the source.
  return value.time && value.timeZone === "America/Cuiaba" ? Date.parse(`${value.date}T${value.time}:00-04:00`) : null;
}

export function noticeIsStale(notice: PublicNotice, now = new Date()) {
  return noticeLocalDate(now) > addNoticeDays(notice.verifiedOn, 7);
}

export function effectiveNoticeStatus(notice: PublicNotice, now = new Date()): NoticeStatus {
  if (notice.declaredStatus === "cancelled") return "cancelled";
  const today = noticeLocalDate(now);
  const close = notice.closes ? confirmedInstant(notice.closes) : null;
  if (notice.declaredStatus === "closed" || (close !== null ? now.getTime() > close : !!notice.closes && today > notice.closes.date)) return "closed";
  if (notice.reviewReasons.length || noticeIsStale(notice, now) || !notice.closes) return "review";
  const open = notice.opens ? confirmedInstant(notice.opens) : null;
  if (open !== null ? now.getTime() < open : !!notice.opens && today < notice.opens.date) return "scheduled";
  return notice.declaredStatus === "open" ? "open" : "review";
}

export function formatNoticeDate(value: NoticeDate | null) {
  if (!value) return "A confirmar";
  if (!validNoticeDate(value)) return "Data inválida; revisão necessária";
  const [year, month, day] = value.date.split("-");
  return `${day}/${month}/${year}${value.time ? ` às ${value.time}${value.timeZone ? " (Cuiabá)" : " (fuso a confirmar)"}` : " · horário não informado"}`;
}

export function addNoticeDays(date: string, days: number) {
  const instant = new Date(`${date}T12:00:00Z`);
  instant.setUTCDate(instant.getUTCDate() + days);
  return instant.toISOString().slice(0, 10);
}

function normalize(value: string) {
  return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function filterPublicNotices(notices: PublicNotice[], filters: { q?: string; campus?: string; category?: string; year?: string; status?: string }, now = new Date()) {
  const terms = normalize((filters.q ?? "").slice(0, 100)).split(/\s+/).filter(Boolean);
  return notices.filter((notice) => {
    const text = normalize([notice.number, notice.year, `${notice.number}/${notice.year}`, notice.title, notice.summary, notice.category, notice.audience].join(" "));
    return terms.every((term) => text.includes(term))
      && (!filters.campus || filters.campus === "all" || normalize(notice.campus) === normalize(filters.campus))
      && (!filters.category || notice.category === filters.category)
      && (!filters.year || String(notice.year) === filters.year)
      && (!filters.status || effectiveNoticeStatus(notice, now) === filters.status);
  });
}

export function noticeIdentity(notice: PublicNotice) {
  return notice.sourceRecordId ? `${notice.sourceId}:${notice.sourceRecordId}` : [notice.issuer, notice.campus, notice.number, notice.year].map(String).map(normalize).join(":");
}

function validNoticeMetadata(notice: PublicNotice) {
  return typeof notice.id === "string" && /^[a-zA-Z0-9_-]{1,120}$/.test(notice.id)
    && typeof notice.sourceId === "string" && typeof notice.sourceRecordId === "string"
    && typeof notice.issuer === "string" && typeof notice.campus === "string" && typeof notice.number === "string"
    && Number.isInteger(notice.year) && notice.year >= 2000 && notice.year <= 2200
    && typeof notice.title === "string" && notice.title.length > 0 && notice.title.length <= 300
    && typeof notice.summary === "string" && notice.summary.length <= 1200
    && (notice.sourceSummary === null || typeof notice.sourceSummary === "string")
    && typeof notice.revision === "string" && notice.revision.length > 0
    && validNoticeDate({ date: notice.verifiedOn })
    && (!notice.publishedOn || validNoticeDate({ date: notice.publishedOn }))
    && (!notice.opens || validNoticeDate(notice.opens)) && (!notice.closes || validNoticeDate(notice.closes))
    && ["open", "closed", "cancelled", "unknown"].includes(notice.declaredStatus)
    && Array.isArray(notice.reviewReasons) && notice.reviewReasons.every((reason) => typeof reason === "string")
    && isOfficialNoticeUrl(notice.canonicalUrl)
    && (!notice.registrationUrl || isOfficialNoticeUrl(notice.registrationUrl, "registration"))
    && Array.isArray(notice.documents) && notice.documents.every((doc) => !!doc && typeof doc.title === "string" && Object.hasOwn(noticeDocumentLabels, doc.kind) && validNoticeDate({ date: doc.verifiedOn }) && isOfficialNoticeUrl(doc.url, "document"));
}

/** Replace reviewed records only; incomplete or failed collections never delete the last valid catalog. */
export function mergePublicNoticeCatalog(previous: PublicNotice[], incoming: PublicNotice[], state: "ok" | "source_unavailable" | "layout_changed") {
  if (state !== "ok") return { notices: previous, state, stale: true };
  const records = new Map(previous.map((notice) => [noticeIdentity(notice), notice]));
  for (const notice of incoming) {
    if (!notice || !validNoticeMetadata(notice)) {
      return { notices: previous, state: "layout_changed" as const, stale: true };
    }
    const identity = noticeIdentity(notice);
    const existing = records.get(identity);
    if (existing && existing.revision === notice.revision) continue;
    const prior = existing ? [...(existing.previousVersions ?? []), { revision: existing.revision, verifiedOn: existing.verifiedOn, summary: existing.summary }] : [];
    records.set(identity, { ...notice, previousVersions: prior });
  }
  return { notices: [...records.values()], state, stale: false };
}

function escapeCalendar(value: string) {
  return value.replace(/\\/g, "\\\\").replace(/\r?\n/g, "\\n").replace(/;/g, "\\;").replace(/,/g, "\\,");
}

function foldCalendarLine(value: string) {
  const result: string[] = [];
  let line = "";
  let bytes = 0;
  for (const char of value) {
    const size = new TextEncoder().encode(char).length;
    if (bytes + size > 75) { result.push(line); line = " "; bytes = 1; }
    line += char; bytes += size;
  }
  result.push(line);
  return result.join("\r\n");
}

export function noticeCalendar(notice: PublicNotice, now = new Date(), reminderDays = 1) {
  if (!notice.closes || !validNoticeDate(notice.closes) || effectiveNoticeStatus(notice, now) !== "open") throw new Error("O prazo precisa estar aberto e revisado para exportar um lembrete.");
  if (![1, 3, 7].includes(reminderDays)) throw new Error("Antecedência inválida.");
  const at = confirmedInstant(notice.closes);
  const stamp = now.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
  const lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//SIFCAS//Editais revisados//PT-BR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT",
    `UID:${escapeCalendar(notice.id)}@sifcas.local`, `DTSTAMP:${stamp}`, `SEQUENCE:${notice.documents.length}`,
    `SUMMARY:${escapeCalendar(`Prazo do edital ${notice.number}/${notice.year} · ${notice.campus}`)}`,
    `DESCRIPTION:${escapeCalendar(`${notice.title}\nConfira sempre a fonte oficial. ${notice.closes.timeZone ? "Horário de Cuiabá confirmado na revisão." : "Lembrete de data. O fuso/horário de fechamento precisa ser confirmado na fonte."}\n${notice.canonicalUrl}`)}`,
    `URL:${notice.canonicalUrl}`];
  if (at !== null) lines.push(`DTSTART:${new Date(at).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z")}`);
  else lines.push(`DTSTART;VALUE=DATE:${notice.closes.date.replace(/-/g, "")}`, `DTEND;VALUE=DATE:${addNoticeDays(notice.closes.date, 1).replace(/-/g, "")}`);
  lines.push("BEGIN:VALARM", "ACTION:DISPLAY", `TRIGGER:-P${reminderDays}D`, "DESCRIPTION:Conferir prazo e eventuais retificações na fonte oficial", "END:VALARM", "END:VEVENT", "END:VCALENDAR");
  return lines.map(foldCalendarLine).join("\r\n") + "\r\n";
}
