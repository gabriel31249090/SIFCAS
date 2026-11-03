import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

test("personal calendar PostgreSQL contract isolates accounts and applies atomically", async (t) => {
  const db = new PGlite();
  try {
    await db.waitReady;
    await db.exec(readFileSync("supabase/isolated/academic-import.fixture.sql", "utf8"));
    // Mirrors only own profile visibility, not the unverified remote profile policies.
    await db.exec("alter table public.profiles enable row level security; grant select on public.profiles to authenticated; create policy own_profile on public.profiles for select to authenticated using(id=auth.uid());");
    await db.exec(readFileSync("supabase/isolated/personal-calendar.sql", "utf8"));
    const student = "10000000-0000-0000-0000-000000000003";
    const other = "10000000-0000-0000-0000-000000000004";
    const suspended = "10000000-0000-0000-0000-000000000007";
    const event = { uid: "0001", title: "Evento sintético", date: "2026-11-04", time: "01:00:00", timezone: "UTC", cancelled: false };
    const as = async (user, role = "authenticated") => {
      await db.exec("reset role");
      await db.query("select set_config('request.jwt.claim.sub',$1,false)", [user]);
      await db.exec(`set role ${role}`);
    };
    const ingest = (events) => db.query("select public.import_personal_calendar($1::jsonb) as count", [JSON.stringify(events)]);
    await t.test("imports and reimports one UID without duplicates", async () => {
      await as(student);
      assert.equal((await ingest([event])).rows[0].count, 1);
      await ingest([{ ...event, title: "Título atualizado" }]);
      assert.equal((await db.query("select count(*)::int as count from public.personal_calendar_events")).rows[0].count, 1);
    });
    await t.test("other accounts see no events and cannot directly write or delete", async () => {
      await as(other);
      assert.equal((await db.query("select count(*)::int as count from public.personal_calendar_events")).rows[0].count, 0);
      await assert.rejects(db.exec("delete from public.personal_calendar_events"), /permission denied/);
    });
    await t.test("direct RPC rejects forged owner, impossible dates, missing fields and invalid timezones", async () => {
      await as(student);
      for (const invalid of [{ ...event, owner_id: other }, { ...event, date: "2026-02-30" }, { ...event, timezone: "Europe/Paris" }, { ...event, cancelled: undefined }]) {
        await assert.rejects(ingest([{ ...event, uid: "new-event" }, invalid]));
        assert.equal((await db.query("select count(*)::int as count from public.personal_calendar_events")).rows[0].count, 1);
      }
    });
    await t.test("anonymous and suspended accounts cannot import", async () => {
      await as(suspended); await assert.rejects(ingest([event]), /ativa/);
      await as("", "anon"); await assert.rejects(ingest([event]), /permission denied/);
    });
    await t.test("clearing one calendar preserves other accounts and official academic tables", async () => {
      await as(other); await ingest([{ ...event, uid: "other" }]);
      await as(student); await db.query("select public.clear_personal_calendar()");
      assert.equal((await db.query("select count(*)::int as count from public.personal_calendar_events")).rows[0].count, 0);
      await as(other); assert.equal((await db.query("select count(*)::int as count from public.personal_calendar_events")).rows[0].count, 1);
      await db.exec("reset role");
      await db.exec(readFileSync("supabase/isolated/personal-calendar-rollback.sql", "utf8"));
      assert.equal((await db.query("select count(*)::int as count from public.enrollments")).rows[0].count, 2);
    });
  } finally { await db.close(); }
});
