import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { parseAcademicCsv, academicImportColumns } from "../lib/academic-import.ts";

const fixture = readFileSync("public/modelo-importacao-academica.csv", "utf8");
function csv(rows) {
  return [academicImportColumns, ...rows.map((r) => academicImportColumns.map((key) => ({ diary_id: "000123", period: "2026/2", ...r })[key] ?? ""))]
    .map((row) => row.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(";")).join("\r\n");
}
const diary = { kind: "diary", external_id: "000123", title: "Matemática sintética" };
const enrollment = { kind: "enrollment", external_id: "E001", student_id: "000001", status: "active" };
const assessment = { kind: "assessment", external_id: "AV001", title: "Prova", date: "2026-11-03", max_score: "10", weight: "1" };
const grade = { kind: "grade", external_id: "N001", student_id: "000001", assessment_id: "AV001", status: "graded", score: "0" };

test("academic fixture imports coherent complete diary and preserves identifiers and multiline content", () => {
  const result = parseAcademicCsv(fixture);
  assert.equal(result.diaryExternalId, "000123");
  assert.equal(result.period, "2026/2");
  assert.deepEqual(result.counts, { diary: 1, enrollment: 2, session: 1, attendance: 2, assessment: 1, grade: 2, schedule: 1, event: 1 });
  assert.equal(result.records.find((r) => r.kind === "enrollment").student_external_id, "000001");
  assert.match(result.records.find((r) => r.kind === "session").payload.content, /Matrizes; operações\nExercícios sintéticos/);
  assert.equal(result.records.find((r) => r.kind === "session").payload.date, "2026-11-03");
});
test("grade zero, missing, exempt and unreported are distinct", () => {
  for (const status of ["graded", "missing", "exempt", "unreported"]) {
    const record = parseAcademicCsv(csv([diary, enrollment, assessment, { ...grade, status, score: status === "graded" ? "0" : "" }])).records.at(-1);
    assert.equal(record.payload.status, status);
    assert.equal(record.payload.score, status === "graded" ? 0 : null);
  }
});
test("academic import supports reviewed column mapping and Brazilian decimals", () => {
  const source = csv([diary, enrollment, assessment, { ...grade, score: "7,5" }]).replace('"external_id"', '"registro"');
  assert.equal(parseAcademicCsv(source, { external_id: "registro" }).records.at(-1).payload.score, 7.5);
});
test("academic parser rejects missing grade instead of converting empty cell to zero", () => assert.throws(() => parseAcademicCsv(csv([diary, enrollment, assessment, { ...grade, score: "" }])), /decimal inválido/));
test("academic parser rejects score above persisted assessment scale", () => assert.throws(() => parseAcademicCsv(csv([diary, enrollment, assessment, { ...grade, score: "10,01" }])), /excede/));
test("academic parser rejects orphan student and assessment references", () => {
  assert.throws(() => parseAcademicCsv(csv([diary, assessment, grade])), /sem matrícula/);
  assert.throws(() => parseAcademicCsv(csv([diary, enrollment, grade])), /avaliação referenciada/);
});
test("academic parser rejects foreign diary, duplicates and impossible dates", () => {
  assert.throws(() => parseAcademicCsv(csv([diary, { ...assessment, diary_id: "000124" }])), /único diário/);
  assert.throws(() => parseAcademicCsv(csv([diary, enrollment, enrollment])), /duplicado/);
  assert.throws(() => parseAcademicCsv(csv([diary, { ...assessment, date: "2026-02-30" }])), /data inválida/);
});
test("academic parser rejects attendance as grade and formulas", () => {
  assert.throws(() => parseAcademicCsv(csv([diary, enrollment, assessment, { ...grade, score: "absent" }])), /decimal inválido/);
  assert.throws(() => parseAcademicCsv(csv([diary, enrollment, assessment, { ...grade, score: "=2+2" }])), /decimal inválido/);
  assert.throws(() => parseAcademicCsv(csv([{ ...diary, external_id: "=cmd()" }])), /external_id inválido/);
});
test("academic parser refuses non-grade states with numeric values", () => assert.throws(() => parseAcademicCsv(csv([diary, enrollment, assessment, { ...grade, status: "missing", score: "0" }])), /apenas graded/));
test("academic parser refuses private token URLs and invalid schedules", () => {
  assert.throws(() => parseAcademicCsv(csv([diary, { kind: "event", external_id: "EV", title: "Evento", date: "2026-11-03", url: "https://online.ifmt.edu.br/calendar/export_execute.php?token=secret" }])), /sem token/);
  assert.throws(() => parseAcademicCsv(csv([diary, { kind: "schedule", external_id: "H", weekday: "1", starts_at: "09:00", ends_at: "08:00" }])), /posterior/);
});
