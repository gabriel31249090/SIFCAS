import { parseCsv } from "./csv.ts";

export const ACADEMIC_IMPORT_MAX_BYTES = 750 * 1024;
export const ACADEMIC_IMPORT_MAX_ROWS = 10000;
export const academicImportKinds = ["diary", "enrollment", "session", "attendance", "assessment", "grade", "schedule", "event"] as const;
export type AcademicImportKind = typeof academicImportKinds[number];
export type AcademicImportRecord = { kind: AcademicImportKind; external_id: string; student_external_id: string | null; payload: Record<string, string | number | null>; source_row: number };
export type AcademicImportFile = { version: "sifcas-academic-v1"; diaryExternalId: string; period: string; records: AcademicImportRecord[]; counts: Record<string, number> };

export const academicImportColumns = ["kind", "external_id", "diary_id", "period", "student_id", "title", "date", "starts_at", "ends_at", "content", "session_id", "assessment_id", "status", "score", "max_score", "weight", "weekday", "room", "url"] as const;
type Column = typeof academicImportColumns[number];
export type AcademicColumnMapping = Partial<Record<Column, string>>;

function date(raw: string, row: number) {
  const br = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(raw);
  const value = br ? `${br[3]}-${br[2]}-${br[1]}` : raw;
  const parsed = new Date(`${value}T12:00:00Z`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(parsed.getTime()) || parsed.toISOString().slice(0, 10) !== value) throw new Error(`Linha ${row}: data inválida (use AAAA-MM-DD ou DD/MM/AAAA).`);
  return value;
}

function decimal(raw: string, row: number, positive = false) {
  if (!/^\d+(?:[.,]\d{1,4})?$/.test(raw)) throw new Error(`Linha ${row}: decimal inválido; não use separador de milhares nem fórmulas.`);
  const value = Number(raw.replace(",", "."));
  if (!Number.isFinite(value) || value > 1000 || (positive && value <= 0)) throw new Error(`Linha ${row}: valor fora da escala permitida.`);
  return value;
}

function identifier(value: string, field: string, row: number) {
  if (!value || value.length > 160 || /[\u0000-\u001f\u007f]/.test(value) || /^[=+@-]/.test(value)) throw new Error(`Linha ${row}: ${field} inválido.`);
  return value;
}

/** Layout SIFCAS; nunca identificado como exportação nativa do SUAP. */
export function parseAcademicCsv(text: string, mapping: AcademicColumnMapping = {}): AcademicImportFile {
  const table = parseCsv(text, { maxBytes: ACADEMIC_IMPORT_MAX_BYTES, maxRows: ACADEMIC_IMPORT_MAX_ROWS });
  const indexes = new Map<Column, number>();
  for (const column of academicImportColumns) {
    const header = mapping[column] ?? column;
    const index = table.headers.indexOf(header);
    if (index >= 0) indexes.set(column, index);
  }
  if ([...indexes.values()].length !== new Set(indexes.values()).size) throw new Error("Uma coluna de origem não pode mapear campos diferentes.");
  for (const column of ["kind", "external_id", "diary_id", "period"] as const) if (!indexes.has(column)) throw new Error(`Coluna obrigatória ausente: ${mapping[column] ?? column}.`);
  let diaryExternalId = "";
  let period = "";
  const seen = new Set<string>();
  const naturalKeys = new Set<string>();
  const records: AcademicImportRecord[] = table.rows.map(({ values, sourceRow }) => {
    const get = (column: Column) => values[indexes.get(column) ?? -1]?.trim() ?? "";
    const kind = get("kind") as AcademicImportKind;
    if (!academicImportKinds.includes(kind)) throw new Error(`Linha ${sourceRow}: tipo de registro desconhecido.`);
    const external_id = identifier(get("external_id"), "external_id", sourceRow);
    const diaryId = identifier(get("diary_id"), "diary_id", sourceRow);
    const rowPeriod = identifier(get("period"), "period", sourceRow);
    diaryExternalId ||= diaryId;
    period ||= rowPeriod;
    if (diaryId !== diaryExternalId || rowPeriod !== period) throw new Error("Selecione um único diário e período por arquivo. Separe os diários antes de importar.");
    const key = `${kind}:${external_id}`;
    if (seen.has(key)) throw new Error(`Linha ${sourceRow}: identificador duplicado no mesmo tipo de registro.`);
    seen.add(key);
    const student_external_id = ["enrollment", "attendance", "grade"].includes(kind) ? identifier(get("student_id"), "student_id", sourceRow) : null;
    const payload: AcademicImportRecord["payload"] = {};
    const need = (column: Column) => identifier(get(column), column, sourceRow);
    if (["diary", "assessment", "event"].includes(kind)) payload.title = need("title");
    if (["session", "assessment", "event"].includes(kind)) payload.date = date(get("date"), sourceRow);
    if (["session", "schedule", "event"].includes(kind)) {
      for (const column of ["starts_at", "ends_at"] as const) {
        const raw = get(column);
        if (raw && !/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(raw)) throw new Error(`Linha ${sourceRow}: horário inválido.`);
        payload[column] = raw || null;
      }
      if (payload.starts_at && payload.ends_at && payload.ends_at <= payload.starts_at) throw new Error(`Linha ${sourceRow}: término deve ser posterior ao início.`);
    }
    if (["session", "event"].includes(kind)) {
      const content = get("content");
      if ((kind === "session" && !content) || content.length > 5000 || /^[=+@]/.test(content)) throw new Error(`Linha ${sourceRow}: conteúdo ausente, fórmula ou limite excedido.`);
      payload.content = content;
    }
    if (kind === "enrollment") {
      if (!["active", "inactive"].includes(get("status"))) throw new Error(`Linha ${sourceRow}: matrícula deve ser active ou inactive.`);
      payload.status = get("status");
    }
    if (kind === "attendance") {
      if (!["present", "absent", "late", "justified"].includes(get("status"))) throw new Error(`Linha ${sourceRow}: frequência inválida. Falta não é nota.`);
      payload.status = get("status"); payload.session_id = need("session_id");
    }
    if (kind === "assessment") {
      payload.max_score = decimal(get("max_score"), sourceRow, true);
      payload.weight = get("weight") ? decimal(get("weight"), sourceRow, true) : 1;
    }
    if (kind === "grade") {
      payload.assessment_id = need("assessment_id");
      const status = get("status");
      if (!["graded", "missing", "exempt", "unreported"].includes(status)) throw new Error(`Linha ${sourceRow}: nota exige status graded, missing, exempt ou unreported.`);
      if (status !== "graded" && get("score")) throw new Error(`Linha ${sourceRow}: apenas graded pode conter nota.`);
      payload.status = status;
      payload.score = status === "graded" ? decimal(get("score"), sourceRow) : null;
    }
    if (kind === "schedule") {
      if (!/^[0-6]$/.test(get("weekday")) || !payload.starts_at || !payload.ends_at) throw new Error(`Linha ${sourceRow}: horário exige dia 0–6, início e término.`);
      payload.weekday = Number(get("weekday")); payload.room = get("room").slice(0, 120);
    }
    if (kind === "event" && get("url")) {
      const url = new URL(get("url"));
      if (url.protocol !== "https:" || url.username || url.password || url.search || url.hash || !["online.ifmt.edu.br", "suap.ifmt.edu.br"].includes(url.hostname)) throw new Error(`Linha ${sourceRow}: use link HTTPS público da atividade, sem token ou parâmetros.`);
      payload.url = url.href;
    }
    if (["enrollment", "attendance", "grade"].includes(kind)) {
      const natural = JSON.stringify([kind, student_external_id, payload.session_id ?? payload.assessment_id ?? null]);
      if (naturalKeys.has(natural)) throw new Error(`Linha ${sourceRow}: registro duplicado para a mesma matrícula/aula/avaliação.`);
      naturalKeys.add(natural);
    }
    return { kind, external_id, student_external_id, payload, source_row: sourceRow };
  });
  if (!records.length || records.filter((row) => row.kind === "diary").length !== 1) throw new Error("O arquivo deve conter exatamente um registro diary e dados de um único diário.");
  const assessments = new Map(records.filter((r) => r.kind === "assessment").map((r) => [r.external_id, r]));
  const sessions = new Set(records.filter((r) => r.kind === "session").map((r) => r.external_id));
  const students = new Set(records.filter((r) => r.kind === "enrollment").map((r) => r.student_external_id));
  for (const row of records) {
    if (["attendance", "grade"].includes(row.kind) && !students.has(row.student_external_id)) throw new Error(`Linha ${row.source_row}: estudante sem matrícula no arquivo.`);
    if (row.kind === "attendance" && !sessions.has(String(row.payload.session_id))) throw new Error(`Linha ${row.source_row}: aula referenciada ausente.`);
    if (row.kind === "grade") {
      const assessment = assessments.get(String(row.payload.assessment_id));
      if (!assessment) throw new Error(`Linha ${row.source_row}: avaliação referenciada ausente.`);
      if (row.payload.score !== null && Number(row.payload.score) > Number(assessment.payload.max_score)) throw new Error(`Linha ${row.source_row}: nota excede a escala da avaliação.`);
    }
  }
  const counts: Record<string, number> = {};
  for (const row of records) counts[row.kind] = (counts[row.kind] ?? 0) + 1;
  return { version: "sifcas-academic-v1", diaryExternalId, period, records, counts };
}
