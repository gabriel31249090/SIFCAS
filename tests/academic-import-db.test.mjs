import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";
import { parseAcademicCsv } from "../lib/academic-import.ts";

const teacher = "10000000-0000-0000-0000-000000000001";
const other = "10000000-0000-0000-0000-000000000002";
const student = "10000000-0000-0000-0000-000000000003";
const student2 = "10000000-0000-0000-0000-000000000004";
const manager = "10000000-0000-0000-0000-000000000005";
const admin = "10000000-0000-0000-0000-000000000006";
const suspended = "10000000-0000-0000-0000-000000000007";
const diaryId = "20000000-0000-0000-0000-000000000005";
const rows = parseAcademicCsv(readFileSync("public/modelo-importacao-academica.csv", "utf8")).records;

test("isolated PostgreSQL academic import executes atomic/RLS/idempotency contract", async (t) => {
  const db = new PGlite();
  await db.waitReady;
  await db.exec(readFileSync("supabase/isolated/academic-import.fixture.sql", "utf8"));
  await db.exec(readFileSync("supabase/isolated/academic-import.sql", "utf8"));
  await db.exec(readFileSync("supabase/isolated/academic-import.seed.sql", "utf8"));
  async function as(user) { await db.exec("reset role"); await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]); await db.exec("set role authenticated"); }
  async function preview(records = rows, diary = diaryId) {
    const result = await db.query("select public.preview_academic_import($1,'000123','2026/2','sintetico.csv',$2::jsonb) as id", [diary, JSON.stringify(records)]);
    return result.rows[0].id;
  }
  let batch;
  await t.test("teacher previews real fixture, reads own payload and applies coherent diary once", async () => {
    await as(teacher); batch = await preview();
    assert.equal((await db.query("select status,total_rows from public.academic_import_batches where id=$1", [batch])).rows[0].total_rows, rows.length);
    const result = await db.query("select public.apply_academic_import($1) as receipt", [batch]);
    assert.equal(result.rows[0].receipt.inserted, rows.length);
    assert.equal((await db.query("select count(*)::int as count from public.academic_import_records")).rows[0].count, rows.length);
    assert.equal((await db.query("select payload from public.academic_import_batches where id=$1", [batch])).rows[0].payload, null);
  });
  await t.test("same import and repeated confirmation return same receipt without duplicate records", async () => {
    await as(teacher); assert.equal(await preview(), batch);
    await Promise.all([db.query("select public.apply_academic_import($1)", [batch]), db.query("select public.apply_academic_import($1)", [batch])]);
    assert.equal((await db.query("select count(*)::int as count from public.academic_import_records")).rows[0].count, rows.length);
  });
  await t.test("another teacher, student, unscoped manager and suspended teacher cannot invoke import RPC", async () => {
    for (const user of [other, student, manager, admin, suspended]) {
      await as(user); await assert.rejects(preview(), /permissão/i);
      await assert.rejects(db.query("select public.apply_academic_import($1)", [batch]), /encontrado|permissão/i);
    }
  });
  await t.test("student RLS exposes only own grades/attendance/enrollment and shared schedule", async () => {
    await as(student);
    const result = await db.query("select kind,student_user_id from public.academic_import_records");
    assert.ok(result.rows.some((r) => r.kind === "grade"));
    assert.ok(result.rows.some((r) => r.kind === "schedule"));
    assert.ok(result.rows.every((r) => r.student_user_id === null || r.student_user_id === student));
    assert.equal((await db.query("select count(*)::int as count from public.academic_import_batches")).rows[0].count, 0);
    await as(student2);
    assert.ok((await db.query("select student_user_id from public.academic_import_records")).rows.every((r) => r.student_user_id === null || r.student_user_id === student2));
  });
  await t.test("foreign diary and student IDs are denied even through direct RPC", async () => {
    await as(teacher);
    await assert.rejects(preview(rows, "20000000-0000-0000-0000-000000000006"), /permissão/i);
    const invalid = structuredClone(rows); invalid.find((r) => r.kind === "enrollment").student_external_id = "unverified";
    await assert.rejects(preview(invalid), /Vínculo/);
  });
  await t.test("manager and admin require an explicit scope and cannot read another owner's batch", async () => {
    for (const operator of [manager, admin]) {
      await db.exec("reset role");
      await db.query("insert into public.academic_import_operator_scopes values($1,'20000000-0000-0000-0000-000000000003')", [operator]);
      await as(operator);
      assert.equal((await db.query("select count(*)::int as count from public.academic_import_batches where id=$1", [batch])).rows[0].count, 0);
      const ownBatch = await preview();
      const result = await db.query("select public.apply_academic_import($1) as receipt", [ownBatch]);
      assert.equal(result.rows[0].receipt.unchanged, rows.length);
      await db.exec("reset role");
      await db.query("delete from public.academic_import_operator_scopes where user_id=$1", [operator]);
      await as(operator);
      await assert.rejects(db.query("select public.apply_academic_import($1)", [ownBatch]), /revogada/);
      assert.equal((await db.query("select count(*)::int as count from public.academic_import_audit")).rows[0].count, 0);
    }
  });
  await t.test("direct RPC rejects duplicate academic identities hidden behind new external IDs", async () => {
    await as(teacher);
    for (const kind of ["grade", "attendance", "enrollment"]) {
      const invalid = structuredClone(rows);
      invalid.push({ ...structuredClone(invalid.find((row) => row.kind === kind)), external_id: `alternate-${kind}` });
      await assert.rejects(preview(invalid), /duplicad/);
    }
    await assert.rejects(db.query("select public.preview_academic_import($1,null,'2026/2','synthetic.csv',$2::jsonb)", [diaryId, JSON.stringify(rows)]), /diverge/);
  });
  await t.test("direct RPC rejects missing assessment maximum, excessive grade and extra PII", async () => {
    await as(teacher);
    const invalid = structuredClone(rows); delete invalid.find((r) => r.kind === "assessment").payload.max_score;
    await assert.rejects(preview(invalid), /Escala/);
    const high = structuredClone(rows); high.find((r) => r.kind === "grade").payload.score = 99;
    await assert.rejects(preview(high), /escala/);
    const pii = structuredClone(rows); pii[0].payload.cpf = "synthetic-not-stored";
    await assert.rejects(preview(pii), /sensível|desconhecido/);
  });
  await t.test("conflict preview preserves existing records and rejects whole batch atomically", async () => {
    await as(teacher);
    const changed = structuredClone(rows); changed.find((r) => r.kind === "session").payload.content = "Alteração divergente";
    const conflict = await preview(changed);
    assert.equal((await db.query("select conflicts from public.academic_import_batches where id=$1", [conflict])).rows[0].conflicts.length, 1);
    await assert.rejects(db.query("select public.apply_academic_import($1)", [conflict]), /Conflito/);
    assert.equal((await db.query("select count(*)::int as count from public.academic_import_records")).rows[0].count, rows.length);
    assert.notEqual((await db.query("select payload from public.academic_import_records where kind='session'")).rows[0].payload.content, "Alteração divergente");
    await db.query("select public.cancel_academic_import($1)", [conflict]);
    assert.equal((await db.query("select payload,status from public.academic_import_batches where id=$1", [conflict])).rows[0].status, "cancelled");
    await assert.rejects(db.query("select public.apply_academic_import($1)", [conflict]), /cancelado|expirado/);
  });
  await t.test("expired previews cannot apply and purge discards private temporary payload", async () => {
    await as(teacher);
    const changed = structuredClone(rows); changed[0].payload.title = "Nova prévia expirada";
    const expired = await preview(changed);
    await db.exec("reset role");
    await db.query("update public.academic_import_batches set expires_at=now()-interval '1 minute' where id=$1", [expired]);
    await as(teacher); await assert.rejects(db.query("select public.apply_academic_import($1)", [expired]), /expirado/);
    await db.exec("reset role"); await db.query("select public.purge_expired_academic_imports()");
    assert.equal((await db.query("select payload from public.academic_import_batches where id=$1", [expired])).rows[0].payload, null);
  });
  await t.test("authenticated users cannot write mapping, scope, snapshots or audit directly", async () => {
    await as(teacher);
    for (const table of ["academic_import_diaries", "academic_import_student_links", "academic_import_operator_scopes", "academic_import_records", "academic_import_batches", "academic_import_audit"]) await assert.rejects(db.query(`delete from public.${table}`), /permission denied/);
  });
  await t.test("isolated rollback removes only extension and preserves original academic tables", async () => {
    await db.exec("reset role");
    await db.exec(readFileSync("supabase/isolated/academic-import.rollback.sql", "utf8"));
    assert.equal((await db.query("select count(*)::int as count from public.enrollments")).rows[0].count, 2);
  });
  await db.close();
});
