import test from "node:test";
import assert from "node:assert/strict";
import { resolveSupabaseConfiguration } from "../lib/supabase/config-policy.ts";

test("missing config never falls back to production", () => {
  const config = resolveSupabaseConfiguration({ nodeEnv: "test" });
  assert.equal(config.configured, false);
  assert.equal(config.url, "http://127.0.0.1:54321");
  assert.equal(config.key, "");
});

test("development and test refuse the production project even with explicit configuration", () => {
  for (const nodeEnv of ["development", "test", undefined]) {
    const config = resolveSupabaseConfiguration({ url: "https://xqhilujzacwebeexljaf.supabase.co", key: "sb_publishable_synthetic", nodeEnv });
    assert.equal(config.configured, false);
  }
});

test("local/staging require both URL and public key and disallow credentials in URL", () => {
  for (const url of ["file:///tmp/db", "http://remote.invalid", "https://u:p@example.invalid", "https://example.invalid?secret=x", "https://example.invalid/path"]) {
    assert.equal(resolveSupabaseConfiguration({ url, key: "sb_publishable_synthetic", nodeEnv: "test" }).configured, false);
  }
  assert.equal(resolveSupabaseConfiguration({ url: "http://127.0.0.1:54321", key: "sb_publishable_synthetic", nodeEnv: "test" }).configured, true);
});

test("privileged JWT and secret key cannot enter the public client", () => {
  const payload = Buffer.from(JSON.stringify({ role: "service_role" })).toString("base64url");
  for (const key of ["sb_secret_synthetic", `e30.${payload}.synthetic`]) {
    assert.equal(resolveSupabaseConfiguration({ url: "https://staging.invalid", key, nodeEnv: "test" }).configured, false);
  }
});
