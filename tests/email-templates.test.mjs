import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

const root = new URL("../", import.meta.url);
const manifest = JSON.parse(await readFile(new URL("supabase/email-templates.json", root), "utf8"));

test("os templates pertencem ao projeto Supabase do SIFCAS", () => {
  assert.equal(manifest.projectRef, "xqhilujzacwebeexljaf");
  assert.equal(manifest.templates.confirmation.subject, "Confirme seu e-mail no SIFCAS");
  assert.equal(manifest.templates.recovery.subject, "Redefina sua senha do SIFCAS");
});

for (const [kind, template] of Object.entries(manifest.templates)) {
  test(`template ${kind} usa link SSR seguro e identidade SIFCAS`, async () => {
    const html = await readFile(new URL(template.contentPath, root), "utf8");
    assert.match(html, /lang="pt-BR"/);
    assert.match(html, /SIFCAS/);
    assert.match(html, /\{\{ \.SiteURL \}\}\/icon\.png/);
    assert.match(html, /token_hash=\{\{ \.TokenHash \}\}/);
    assert.doesNotMatch(html, /<script\b/i);
    assert.doesNotMatch(html, /<form\b/i);
    assert.ok(Buffer.byteLength(html) < 30_000, "template deve permanecer leve");
  });
}

test("confirmação direciona para a validação de e-mail", async () => {
  const html = await readFile(new URL(manifest.templates.confirmation.contentPath, root), "utf8");
  assert.match(html, /type=email&amp;next=\//);
});

test("recuperação cria sessão antes da página de nova senha", async () => {
  const html = await readFile(new URL(manifest.templates.recovery.contentPath, root), "utf8");
  assert.match(html, /type=recovery&amp;next=\/nova-senha/);
  const confirmationRoute = await readFile(new URL("app/auth/confirm/route.ts", root), "utf8");
  assert.match(confirmationRoute, /verifyOtp\(\{ token_hash: tokenHash, type \}\)/);
});
