import test from "node:test";
import assert from "node:assert/strict";
import { summarizeTeacherCopy, filterTeacherClasses, scopedTeacherCopies, isVerifiedActivityUrl } from "../lib/teacher-workspace-domain.ts";

const source = (records = []) => ({ id: "diary-a", classSubjectId: "subject-a", label: "Diário sintético", period: "2026/2", instance: "sifcas-layout", updatedAt: null, records });
const record = (status, score = null) => ({ kind: "grade", externalId: status, payload: { status, score } });

test("teacher summary keeps zero, missing, exempt and unreported grades distinct", () => {
  const result = summarizeTeacherCopy(source([
    record("graded", 0), record("graded", 9), record("missing"), record("exempt"), record("unreported"),
    { kind: "attendance", externalId: "absence", payload: { status: "absent" } },
  ]));
  assert.equal(result.gradedGrades, 2);
  assert.equal(result.zeroGrades, 1);
  assert.equal(result.missingGrades, 1);
  assert.equal(result.exemptGrades, 1);
  assert.equal(result.unreportedGrades, 1);
});

test("missing records do not become pending grades or a correction queue", () => {
  const result = summarizeTeacherCopy(source([
    { kind: "enrollment", externalId: "enrollment", payload: { status: "active" } },
    { kind: "assessment", externalId: "assessment", payload: { max_score: 10 } },
  ]));
  assert.equal(result.enrollments, 1);
  assert.equal(result.assessments, 1);
  assert.equal(result.unreportedGrades, 0);
  assert.equal(result.missingGrades, 0);
  assert.equal(result.gradedGrades, 0);
  assert.ok(!("correctionQueue" in result));
});

test("copies are intersected with the caller's verified class IDs", () => {
  const copies = [source(), { ...source(), id: "foreign", classSubjectId: "subject-b" }];
  assert.deepEqual(scopedTeacherCopies(copies, ["subject-a"]).map((copy) => copy.id), ["diary-a"]);
  assert.deepEqual(scopedTeacherCopies(copies, []), []);
});

test("period filtering never assigns local counts from another period to an imported copy", () => {
  const card = { id: "subject-a", className: "Informática", subjectName: "Matemática", code: "001", localPeriod: "2026/2", periods: ["2026/1", "2026/2"], local: { status: "ready", enrollments: 20, sessions: 7, assessments: 3 }, copies: [summarizeTeacherCopy(source()), summarizeTeacherCopy({ ...source(), id: "older", period: "2026/1" })] };
  const [filtered] = filterTeacherClasses([card], "informatica matematica", "2026/1");
  assert.equal(filtered.copies.length, 1);
  assert.equal(filtered.copies[0].id, "older");
  assert.equal(filtered.local.sessions, null);
  assert.equal(filtered.local.status, "unavailable");
  assert.equal(card.local.sessions, 7);
  assert.deepEqual(filterTeacherClasses([card], "not-present"), []);
});

test("activity links only use validated public origin URLs without private tokens", () => {
  for (const value of ["http://127.0.0.1/", "https://online.ifmt.edu.br.evil.invalid/", "https://online.ifmt.edu.br/?token=private", "https://u:p@suap.ifmt.edu.br/diary", "javascript:alert(1)", "https://online.ifmt.edu.br/"]) assert.equal(isVerifiedActivityUrl(value), false);
  assert.equal(isVerifiedActivityUrl("https://online.ifmt.edu.br/mod/assign/view/123"), true);
  const summary = summarizeTeacherCopy(source([
    { kind: "event", externalId: "safe", payload: { title: "Tarefa", url: "https://online.ifmt.edu.br/mod/assign/view/123" } },
    { kind: "event", externalId: "unsafe", payload: { title: "Não exibir", url: "https://online.ifmt.edu.br/calendar/export_execute.php?token=private" } },
  ]));
  assert.equal(summary.activities.length, 1);
  assert.equal(summary.activities[0].title, "Tarefa");
});
