import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { moduleCatalog, getAccessibleModules } from "../lib/module-catalog.ts";
import { normalizeSearch, matchesSearch, publicationSearchTerm } from "../lib/search-utils.ts";

test("visitors only see public modules", () => assert.ok(getAccessibleModules(null).every((item) => item.public)));
test("students never see management modules", () => assert.ok(getAccessibleModules("student").every((item) => item.group !== "Gestão")));
test("teachers see diary but not account administration", () => {
  const routes = getAccessibleModules("teacher").map((item) => item.href);
  assert.ok(routes.includes("/diario-professor"));
  assert.ok(!routes.includes("/usuarios"));
});
test("administrators see institutional identities and monitoring", () => {
  const routes = getAccessibleModules("admin").map((item) => item.href);
  for (const route of ["/usuarios", "/vinculos-institucionais", "/monitoramento"]) assert.ok(routes.includes(route));
});
test("staff do not get student-only shortcuts", () => assert.ok(!getAccessibleModules("staff").some((item) => item.href === "/boletim")));
test("catalog is unique and points to existing pages", () => {
  assert.equal(new Set(moduleCatalog.map((item) => item.href)).size, moduleCatalog.length);
  for (const item of moduleCatalog) {
    assert.ok(fs.existsSync("app" + (item.href === "/" ? "" : item.href) + "/page.tsx"), item.href);
  }
});
test("search ignores accents and case and matches multiple words", () => {
  assert.equal(normalizeSearch("  Frequência  "), "frequencia");
  assert.ok(matchesSearch("Boletim e frequência", "FREQUENCIA boletim"));
  assert.ok(matchesSearch("Editais edital bolsas", "edital"));
  assert.ok(!matchesSearch("Minha agenda", "documentos"));
});
test("publication filter removes PostgREST operators", () => {
  assert.equal(publicationSearchTerm('a%,x.eq.1(test)_*:"b'), "a x eq 1 test b");
  assert.equal(publicationSearchTerm("  Bolsa de extensão  "), "Bolsa de extensão");
  assert.ok(publicationSearchTerm("a".repeat(200)).length <= 100);
});
