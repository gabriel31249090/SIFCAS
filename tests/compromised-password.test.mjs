import test from "node:test";
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import {
  validateNewPassword,
  rangeHasPassword,
  BREACHED_PASSWORD_MESSAGE,
  PASSWORD_CHECK_UNAVAILABLE_MESSAGE,
} from "../lib/compromised-password.ts";

test("breached passwords are detected from partial hashes without sending plaintext", async () => {
  const password = "sample-academic-demo-2026-unique";
  const sha1 = createHash("sha1").update(password).digest("hex").toUpperCase();
  const prefix = sha1.slice(0, 5);
  const suffix = sha1.slice(5);
  let requestedUrl = "";
  const mock = async (url) => {
    requestedUrl = String(url);
    return { ok: true, text: async () => `AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:0\r\n${suffix}:3\r\n` };
  };
  assert.equal(await validateNewPassword(password, mock), BREACHED_PASSWORD_MESSAGE);
  assert.equal(requestedUrl, `https://api.pwnedpasswords.com/range/${prefix}`);
  assert.ok(!requestedUrl.includes(password));
  assert.equal(rangeHasPassword(sha1, `${suffix}:0\r\n`), false);
});

test("unlisted passwords pass the range check", async () => {
  const password = "my-unpublished-passphrase%lunar-2026";
  const response = async () => ({ ok: true, text: async () => "AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA:2\r\n" });
  assert.equal(await validateNewPassword(password, response), null);
});

test("a failed range lookup denies new passwords but never changes existing logins", async () => {
  const password = "new-sample-passphrase-for-test-2026";
  const unavailable = async () => { throw new Error("Network failure"); };
  assert.equal(await validateNewPassword(password, unavailable), PASSWORD_CHECK_UNAVAILABLE_MESSAGE);
  assert.equal(await validateNewPassword("123456789", unavailable), "A senha deve ter pelo menos 12 caracteres.");
});
