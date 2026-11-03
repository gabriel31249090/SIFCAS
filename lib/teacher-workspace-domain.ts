export type TeacherSourceStatus = "ready" | "unavailable" | "not_configured";

export type TeacherCopyRecord = {
  kind: string;
  externalId: string;
  payload: Record<string, string | number | null>;
};

export type TeacherCopyInput = {
  id: string;
  classSubjectId: string;
  label: string;
  period: string;
  instance: string;
  updatedAt: string | null;
  records: TeacherCopyRecord[];
};

export type TeacherCopySummary = {
  id: string;
  label: string;
  period: string;
  instance: string;
  updatedAt: string | null;
  enrollments: number;
  sessions: number;
  assessments: number;
  missingGrades: number;
  unreportedGrades: number;
  exemptGrades: number;
  gradedGrades: number;
  zeroGrades: number;
  activities: Array<{ title: string; url: string }>;
};

export type TeacherClassCard = {
  id: string;
  className: string;
  subjectName: string;
  code: string;
  localPeriod: string | null;
  periods: string[];
  local: {
    status: TeacherSourceStatus;
    enrollments: number | null;
    sessions: number | null;
    assessments: number | null;
  };
  copies: TeacherCopySummary[];
};

export function isVerifiedActivityUrl(value: unknown): value is string {
  if (typeof value !== "string") return false;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ["online.ifmt.edu.br", "suap.ifmt.edu.br"].includes(url.hostname)
      && !url.username && !url.password && !url.port && !url.search && !url.hash
      && url.pathname !== "/" && !/[\u0000-\u0020]/.test(value);
  } catch { return false; }
}

/** Only explicit source states are counted. Missing rows never become pending grades. */
export function summarizeTeacherCopy(copy: TeacherCopyInput): TeacherCopySummary {
  const count = (kind: string) => copy.records.filter((record) => record.kind === kind).length;
  const gradeRecords = copy.records.filter((record) => record.kind === "grade");
  const explicitGradeCount = (status: string) => gradeRecords.filter((record) => record.payload.status === status).length;
  return {
    id: copy.id,
    label: copy.label,
    period: copy.period,
    instance: copy.instance,
    updatedAt: copy.updatedAt,
    enrollments: count("enrollment"),
    sessions: count("session"),
    assessments: count("assessment"),
    missingGrades: explicitGradeCount("missing"),
    unreportedGrades: explicitGradeCount("unreported"),
    exemptGrades: explicitGradeCount("exempt"),
    gradedGrades: explicitGradeCount("graded"),
    zeroGrades: gradeRecords.filter((record) => record.payload.status === "graded" && record.payload.score === 0).length,
    activities: copy.records.flatMap((record) => record.kind === "event" && isVerifiedActivityUrl(record.payload.url)
      ? [{ title: typeof record.payload.title === "string" ? record.payload.title : "Atividade na origem", url: record.payload.url }]
      : []),
  };
}

export function filterTeacherClasses(cards: TeacherClassCard[], query = "", period = "") {
  const normalize = (value: string) => value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
  const terms = normalize(query.slice(0, 100)).trim().split(/\s+/).filter(Boolean);
  return cards.filter((card) => (!period || card.periods.includes(period))
    && terms.every((term) => normalize([card.className, card.subjectName, card.code, ...card.periods].join(" ")).includes(term)))
    .map((card) => period ? {
      ...card,
      copies: card.copies.filter((copy) => copy.period === period),
      // A filtered external period must not inherit local counts from a different period.
      local: card.localPeriod === period ? card.local : { status: "unavailable" as const, enrollments: null, sessions: null, assessments: null },
    } : card);
}

/** Application-side intersection supplements, rather than replaces, session RLS. */
export function scopedTeacherCopies<T extends { classSubjectId: string }>(copies: T[], authorizedIds: string[]) {
  const allowed = new Set(authorizedIds);
  return copies.filter((copy) => allowed.has(copy.classSubjectId));
}
