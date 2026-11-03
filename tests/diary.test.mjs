import { test } from "node:test";
import assert from "node:assert/strict";
import {
  diaryDate, diaryGrade, diaryPage, DiaryValidationError, readDiaryIds, readDiaryPage, readDiaryRows,
  requireDiaryAccess, requireDiaryRecord, requireDiaryStudents, selectDiaryRecord,
} from "../lib/diary-security.ts";

const classSubject = "10000000-0000-4000-8000-000000000001";
const otherSubject = "10000000-0000-4000-8000-000000000002";
const classId = "20000000-0000-4000-8000-000000000001";
const teacherId = "30000000-0000-4000-8000-000000000001";
const studentId = "40000000-0000-4000-8000-000000000001";
const outsiderId = "40000000-0000-4000-8000-000000000002";
const recordId = "50000000-0000-4000-8000-000000000001";
const teacher = { id: teacherId, role: "teacher", accountStatus: "active" };

// Authenticated-client contract double; these tests do not certify remote RLS.
function database(tables = {}, failureTable) {
  const reads = [];
  return {
    reads,
    from(table) {
      const filters = [];
      let range = null;
      let limit = Infinity;
      const execute = (single = false) => {
        reads.push({ table, filters: [...filters] });
        if (table === failureTable) return { data: null, error: { code: "42501" } };
        let rows = (tables[table] ?? []).filter((row) => filters.every(([column, predicate]) => predicate(row[column])));
        if (range) rows = rows.slice(range[0], range[1] + 1);
        rows = rows.slice(0, limit);
        return { data: single ? rows[0] ?? null : rows, error: null };
      };
      const query = {
        select() { return query; },
        eq(column, value) { filters.push([column, (candidate) => candidate === value]); return query; },
        in(column, values) { filters.push([column, (candidate) => values.includes(candidate)]); return query; },
        order() { return query; },
        limit(value) { limit = value; return query; },
        range(from, to) { range = [from, to]; return query; },
        maybeSingle() { return Promise.resolve(execute(true)); },
        then(resolve, reject) { return Promise.resolve(execute()).then(resolve, reject); },
      };
      return query;
    },
  };
}

function scopedDatabase(overrides = {}) {
  return database({
    class_subjects: [{ id: classSubject, class_id: classId, active: true }],
    teaching_assignments: [{ class_subject_id: classSubject, teacher_user_id: teacherId }],
    enrollments: [{ id: "enrollment", student_user_id: studentId, class_id: classId, status: "active" }],
    academic_assessments: [{ id: recordId, class_subject_id: classSubject, max_score: "10.00" }],
    class_sessions: [{ id: recordId, class_subject_id: classSubject }],
    ...overrides,
  });
}

test("diary access verifies a teaching assignment even when the class row is readable", async () => {
  await assert.rejects(requireDiaryAccess(scopedDatabase({ teaching_assignments: [] }), teacher, classSubject), DiaryValidationError);
  assert.deepEqual(await requireDiaryAccess(scopedDatabase(), teacher, classSubject), { classId, classSubjectId: classSubject });
});

test("forged class ID, pending accounts, and student roles fail closed", async () => {
  const client = scopedDatabase();
  await assert.rejects(requireDiaryAccess(client, teacher, otherSubject), /permissão/);
  for (const actor of [{ ...teacher, role: "student" }, { ...teacher, accountStatus: "pending" }, { ...teacher, accountStatus: "suspended" }]) {
    await assert.rejects(requireDiaryAccess(client, actor, classSubject), /permissão/);
  }
  const untouched = scopedDatabase();
  await assert.rejects(requireDiaryAccess(untouched, teacher, "not-an-id"), /inválido/);
  assert.equal(untouched.reads.length, 0);
});

test("manager and administrator still require a row visible to the authenticated database client", async () => {
  for (const role of ["manager", "admin"]) {
    await assert.rejects(requireDiaryAccess(database(), { ...teacher, role }, classSubject), /permissão/);
    await assert.rejects(requireDiaryAccess(database({}, "class_subjects"), { ...teacher, role }, classSubject), /permissão/);
  }
});

test("a forged assessment or session is rejected even if it exists in another class", async () => {
  for (const table of ["class_sessions", "academic_assessments"]) {
    const client = scopedDatabase({ [table]: [{ id: recordId, class_subject_id: otherSubject, max_score: 1000 }] });
    await assert.rejects(requireDiaryRecord(client, table, recordId, classSubject), /não pertence/);
  }
});

test("grade maximum comes from the persisted assessment and rejects tampering", async () => {
  const assessment = await requireDiaryRecord(scopedDatabase(), "academic_assessments", recordId, classSubject);
  assert.equal(assessment.maxScore, 10);
  assert.throws(() => diaryGrade("99", assessment.maxScore), /0–10/);
  assert.equal(diaryGrade("0", assessment.maxScore), 0);
  assert.equal(diaryGrade("8,75", assessment.maxScore), 8.75);
  assert.equal(diaryGrade("", assessment.maxScore), null);
  for (const raw of ["ausente", "dispensado", "falta", "=2+2", "0xA", "1e1", "Infinity", "-1", "8,2,1"]) {
    assert.throws(() => diaryGrade(raw, assessment.maxScore), DiaryValidationError);
  }
  for (const max_score of [null, "", "invalid", 0, -1]) {
    await assert.rejects(requireDiaryRecord(scopedDatabase({ academic_assessments: [{ id: recordId, class_subject_id: classSubject, max_score }] }), "academic_assessments", recordId, classSubject), /escala/);
  }
});

test("submitted students must all have an active enrollment in the authorized class", async () => {
  const client = scopedDatabase();
  assert.deepEqual(await requireDiaryStudents(client, classId, [studentId, studentId]), [studentId]);
  await assert.rejects(requireDiaryStudents(client, classId, [studentId, outsiderId]), /matrícula ativa/);
  await assert.rejects(requireDiaryStudents(scopedDatabase({ enrollments: [{ id: "e", student_user_id: studentId, class_id: classId, status: "inactive" }] }), classId, [studentId]), /matrícula ativa/);
  await assert.rejects(requireDiaryStudents(client, classId, Array(1001).fill(studentId)), /limite/);
  await assert.rejects(requireDiaryStudents(client, classId, [""]), /inválido/);
});

test("paginated diary reaches records after the former 24-record limit", async () => {
  const rows = Array.from({ length: 61 }, (_, id) => ({ id }));
  const calls = [];
  const fetch = async (from, to) => { calls.push([from, to]); return { data: rows.slice(from, to + 1), count: rows.length, error: null }; };
  const page = await readDiaryPage(fetch, 3);
  assert.equal(page.total, 61);
  assert.equal(page.pages, 3);
  assert.equal(page.page, 3);
  assert.deepEqual(page.rows, rows.slice(48));
  assert.deepEqual(calls, [[48, 71]]);
  assert.equal((await readDiaryPage(fetch, 999)).page, 3);
  const capped = await readDiaryPage(async (from, to) => ({ data: rows.slice(from, Math.min(to + 1, from + 7)), count: rows.length, error: null }), 3);
  assert.deepEqual(capped.rows, rows.slice(48));
  for (const input of ["0", "-1", "2tail", "Infinity", "999999999", "2.5"]) assert.equal(diaryPage(input), 1);
});

test("row reads traverse server caps and propagate later failures instead of reporting partial success", async () => {
  const rows = Array.from({ length: 1023 }, (_, id) => ({ id }));
  const all = await readDiaryRows(async (from, to) => ({ data: rows.slice(from, Math.min(to + 1, from + 37)), error: null }));
  assert.deepEqual(all, rows);
  const error = new Error("source unavailable");
  await assert.rejects(readDiaryRows(async (from) => from ? { data: null, error } : { data: rows.slice(0, 200), error: null }), /source unavailable/);
  await assert.rejects(readDiaryPage(async () => ({ data: [], error: null, count: null }), 1), /contagem/);
});

test("older diary selections load outside the current page and forged selections never fall back to another record", async () => {
  const current = [{ id: classSubject, title: "Current page" }];
  const older = { id: recordId, title: "An older record" };
  const load = async (id) => id === older.id ? older : null;
  assert.equal(await selectDiaryRecord(current, recordId, load), older);
  assert.equal(await selectDiaryRecord(current, undefined, load), current[0]);
  await assert.rejects(selectDiaryRecord(current, otherSubject, load), /não pertence/);
  await assert.rejects(selectDiaryRecord(current, "invalid", load), /inválido/);
  assert.equal(await selectDiaryRecord([], undefined, load), null);
});

test("identifier batches limit IN queries while preserving every row", async () => {
  const ids = Array.from({ length: 1203 }, (_, id) => String(id));
  const rows = await readDiaryIds(ids, async (group, from, to) => {
    assert.ok(group.length <= 100);
    return { data: group.slice(from, to + 1), error: null };
  });
  assert.deepEqual(rows, ids);
});

test("academic dates reject invalid days instead of rolling over silently", () => {
  assert.equal(diaryDate("2028-02-29"), true);
  for (const value of ["2026-02-29", "2026-04-31", "2026-13-01", "2026-01-00", "03/11/2026"]) assert.equal(diaryDate(value), false);
});
