import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import test from "node:test";

for (const path of ["app/manifest.ts", "app/robots.ts", "app/sitemap.ts", "app/opengraph-image.tsx"]) {
  test(`${path} is versioned`, () => assert.ok(existsSync(path)));
}

test("sitemap contains public content and excludes account areas", () => {
  const source = readFileSync("app/sitemap.ts", "utf8");
  for (const route of ["/noticias", "/editais", "/agenda-institucional", "/campus", "/transparencia", "/verificar-documento"]) {
    assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
  }
  for (const route of ["/usuarios", "/monitoramento", "/perfil"]) assert.doesNotMatch(source, new RegExp(route.replaceAll("/", "\\/")));
});

test("robots blocks sensitive and query-driven routes", () => {
  const source = readFileSync("app/robots.ts", "utf8");
  for (const route of ["/api/", "/auth/", "/login", "/buscar", "/gestao-academica", "/usuarios"]) {
    assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
  }
});

test("discovery and social endpoints bypass authentication", () => {
  const source = readFileSync("lib/supabase/proxy.ts", "utf8");
  for (const route of ["/manifest.webmanifest", "/opengraph-image", "/robots.txt", "/sitemap.xml"]) {
    assert.match(source, new RegExp(route.replaceAll("/", "\\/")));
  }
});

test("Vercel observability is mounted in the root layout", () => {
  const source = readFileSync("app/layout.tsx", "utf8");
  assert.match(source, /<Analytics \/>/);
  assert.match(source, /<SpeedInsights \/>/);
});
