import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { newPasswordError, NEW_PASSWORD_MAX_LENGTH, NEW_PASSWORD_MIN_LENGTH } from "../lib/password-policy.ts";
import { safeInternalPath } from "../lib/safe-path.ts";

for (const value of ["/", "/boletim", "/agenda-aluno?turma=2#hoje", "/buscar?q=vida%20academica"]) {
  test("keeps internal destination " + value, () => assert.equal(safeInternalPath(value), value));
}
for (const value of [undefined, null, "", "https://example.invalid", "//example.invalid", "/\\example.invalid", "/%5cexample.invalid", "/%2fexample.invalid", "/%252fexample.invalid", "/%255cexample.invalid", "/a/..//example.invalid", "/%0a/example.invalid", "/%0d/example.invalid", "/%09/example.invalid", "javascript:alert(1)", "/%zz"]) {
  test("rejects unsafe destination " + String(value), () => assert.equal(safeInternalPath(value, "/aplicativos"), "/aplicativos"));
}
test("normalizes internal dot segments without leaving the origin", () => assert.equal(safeInternalPath("/campus/../boletim"), "/boletim"));

test("new passwords use the stronger creation and recovery policy", () => {
  assert.equal(NEW_PASSWORD_MIN_LENGTH, 12);
  assert.equal(newPasswordError("a".repeat(NEW_PASSWORD_MIN_LENGTH - 1)), "A senha deve ter pelo menos 12 caracteres.");
  assert.equal(newPasswordError("a".repeat(NEW_PASSWORD_MIN_LENGTH)), null);
  assert.equal(newPasswordError("a".repeat(NEW_PASSWORD_MAX_LENGTH + 1)), "A senha deve ter no máximo 128 caracteres.");
});

test("general administrator protection is role-based, not identity-based", () => {
  const source = readFileSync("app/gestao-academica/actions.ts", "utf8");
  assert.match(source, /select\("is_general_admin"\)/);
  assert.match(source, /currentRole\?\.is_general_admin/);
  assert.doesNotMatch(source, /GENERAL_ADMIN_EMAIL/);
  assert.doesNotMatch(source, /[\w.+-]+@(?:gmail|outlook|hotmail)\.[a-z]{2,}/i);
});

test("local Supabase auth mirrors the minimum password policy", () => {
  const config = readFileSync("supabase/config.toml", "utf8");
  assert.match(config, /minimum_password_length = 12/);
  assert.match(config, /enable_confirmations = true/);
  assert.match(config, /secure_password_change = true/);
  assert.match(config, /max_frequency = "60s"/);
});
