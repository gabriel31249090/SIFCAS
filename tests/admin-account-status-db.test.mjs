import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const admin = "10000000-0000-0000-0000-000000000001";
const target = "10000000-0000-0000-0000-000000000002";
const generalAdmin = "10000000-0000-0000-0000-000000000003";
const suspendedAdmin = "10000000-0000-0000-0000-000000000004";
const student = "10000000-0000-0000-0000-000000000005";

test("account status RPC allows active admins despite direct update restrictions and rejects unsafe transitions", async (t) => {
  const db = new PGlite();
  t.after(() => db.close());
  await db.exec(`
    create role anon;
    create role authenticated;
    create schema auth;
    create function auth.uid() returns uuid language sql stable as $$
      select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
    $$;
    create table public.profiles (
      id uuid primary key,
      account_status text not null,
      updated_at timestamptz not null default now()
    );
    create table public.user_roles (
      user_id uuid primary key references public.profiles(id),
      role text not null,
      is_general_admin boolean not null default false,
      role_source text not null default 'manual',
      updated_at timestamptz not null default now()
    );
    insert into public.profiles(id,account_status) values
      ('${admin}','active'),('${target}','pending'),('${generalAdmin}','active'),
      ('${suspendedAdmin}','suspended'),('${student}','active');
    insert into public.user_roles(user_id,role,is_general_admin,role_source) values
      ('${admin}','admin',false,'manual'),('${target}','student',false,'unverified'),
      ('${generalAdmin}','admin',true,'manual'),('${suspendedAdmin}','admin',false,'manual'),
      ('${student}','student',false,'manual');
    grant update on public.profiles to authenticated;
    alter table public.profiles enable row level security;
    alter table public.user_roles enable row level security;
  `);
  await db.exec(readFileSync("supabase/patches/admin-account-status.sql", "utf8"));

  async function as(userId) {
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub',$1,false)", [userId]);
    await db.exec("set role authenticated");
  }

  await t.test("active admin can activate and activation provenance updates atomically", async () => {
    await as(admin);
    await assert.rejects(
      db.query("update public.profiles set account_status='active' where id=$1 returning id", [target]),
      /permission denied|row-level security/i,
    );
    await db.query("select public.admin_set_account_status($1,'active')", [target]);
    await db.exec("reset role");
    assert.equal((await db.query("select account_status from public.profiles where id=$1", [target])).rows[0].account_status, "active");
    assert.equal((await db.query("select role_source from public.user_roles where user_id=$1", [target])).rows[0].role_source, "manual");
  });

  await t.test("active admin can suspend an ordinary account", async () => {
    await as(admin);
    await db.query("select public.admin_set_account_status($1,'suspended')", [target]);
    await db.exec("reset role");
    assert.equal((await db.query("select account_status from public.profiles where id=$1", [target])).rows[0].account_status, "suspended");
  });

  await t.test("self-suspension, general-admin suspension, and invalid statuses are rejected", async () => {
    await as(admin);
    await assert.rejects(db.query("select public.admin_set_account_status($1,'suspended')", [admin]), /Self-suspension/);
    await assert.rejects(db.query("select public.admin_set_account_status($1,'suspended')", [generalAdmin]), /General administrator/);
    await assert.rejects(db.query("select public.admin_set_account_status($1,'deleted')", [target]), /Invalid account status/);
  });

  await t.test("non-admin, suspended admin, and anonymous caller are rejected", async () => {
    await as(student);
    await assert.rejects(db.query("select public.admin_set_account_status($1,'active')", [target]), /Active administrator role required/);
    await as(suspendedAdmin);
    await assert.rejects(db.query("select public.admin_set_account_status($1,'active')", [target]), /Active administrator role required/);
    await db.exec("reset role");
    await db.query("select set_config('request.jwt.claim.sub','',false)");
    await db.exec("set role authenticated");
    await assert.rejects(db.query("select public.admin_set_account_status($1,'active')", [target]), /Active administrator role required/);
  });

  await db.exec("reset role");
  const privileges = await db.query(`
    select has_function_privilege('anon','public.admin_set_account_status(uuid,text)','execute') as anon,
           has_function_privilege('authenticated','public.admin_set_account_status(uuid,text)','execute') as authenticated
  `);
  assert.deepEqual(privileges.rows[0], { anon: false, authenticated: true });
});
