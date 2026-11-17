import assert from "node:assert/strict";
import test from "node:test";
import { readFileSync } from "node:fs";

const sql = readFileSync("supabase/patches/admin-account-status.sql", "utf8");
const action = readFileSync("app/usuarios/actions.ts", "utf8");
const page = readFileSync("app/usuarios/page.tsx", "utf8");

test("account status RPC is narrowly granted and independently authorizes active admins", () => {
  assert.match(sql, /security definer\s+set search_path = pg_catalog, public, auth/i);
  assert.match(sql, /actor\.account_status = 'active'\s+and actor_role\.role = 'admin'/i);
  assert.match(sql, /p_status not in \('active', 'pending', 'suspended'\)/i);
  assert.match(sql, /p_user_id = auth\.uid\(\) and p_status = 'suspended'/i);
  assert.match(sql, /target_is_general_admin and p_status = 'suspended'/i);
  assert.match(sql, /revoke all on function public\.admin_set_account_status\(uuid, text\) from public, anon/i);
  assert.match(sql, /grant execute on function public\.admin_set_account_status\(uuid, text\) to authenticated/i);
  assert.doesNotMatch(sql, /service_role/i);
});

test("server action calls only the guarded RPC and reports a missing database patch", () => {
  assert.match(action, /requireAdmin\(\)/);
  assert.match(action, /rpc\("admin_set_account_status",\s*\{\s*p_user_id:\s*userId,\s*p_status:\s*status\s*\}\)/);
  assert.match(action, /error\.code === "PGRST202" \|\| error\.code === "42883"/);
  assert.doesNotMatch(action, /from\("profiles"\)\.update/);
});

test("status controls permit safe activation while protecting self and general-admin suspension", () => {
  assert.match(page, /nextStatus === "suspended" && \(general \|\| row\.id === account\.id\)/);
  assert.match(page, /row\.account_status === "pending" \? "Ativar manualmente"/);
});
