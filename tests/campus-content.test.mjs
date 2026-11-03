import assert from "node:assert/strict";
import test from "node:test";
import { campusCategories, campusEntries, findCampusEntries, getCampusEntry } from "../lib/campus-content.ts";

test("every public guide has a unique URL and an official source", () => {
  const slugs = new Set();
  for (const entry of campusEntries) {
    assert.match(entry.slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/);
    assert.ok(!slugs.has(entry.slug), `duplicate slug: ${entry.slug}`);
    slugs.add(entry.slug);
    assert.ok(campusCategories.includes(entry.category));
    assert.ok(entry.title && entry.summary && entry.body.length && entry.sourceLabel);
    const source = new URL(entry.source);
    assert.equal(source.protocol, "https:");
    assert.ok(source.hostname === "ifmt.edu.br" || source.hostname.endsWith(".ifmt.edu.br"));
    for (const link of entry.links ?? []) {
      const url = new URL(link.href);
      if (url.protocol === "mailto:") {
        assert.match(url.pathname, /^[a-z0-9._-]+@(?:[a-z0-9.-]+\.)?ifmt\.edu\.br$/);
        assert.equal(url.search, "");
        continue;
      }
      assert.equal(url.protocol, "https:");
      assert.ok(url.hostname === "ifmt.edu.br" || url.hostname.endsWith(".ifmt.edu.br") || url.hostname === "drive.google.com");
    }
  }
  assert.equal(getCampusEntry("nao-existe"), undefined);
});

test("search ignores accents and supports categories and multiple terms", () => {
  assert.deepEqual(findCampusEntries("informatica", "Cursos").map((entry) => entry.slug), ["informatica"]);
  assert.ok(findCampusEntries("QUÍMICA", "Cursos").some((entry) => entry.slug === "quimica"));
  assert.ok(findCampusEntries("recuperar senha").some((entry) => entry.slug === "recuperar-senha-suap"));
  assert.equal(findCampusEntries("termo-inexistente-xyz").length, 0);
  assert.equal(findCampusEntries("", "Cursos").length, 8);
  assert.ok(findCampusEntries("secretaria.cas@ifmt.edu.br").some((entry) => entry.slug === "secretaria"));
});

test("academic guides distinguish official systems from SIFCAS records", () => {
  assert.match(getCampusEntry("suap").note, /independente/);
  assert.match(getCampusEntry("ava-moodle").note, /não sincroniza/);
  assert.match(getCampusEntry("boletim-suap").note, /não são importados/);
  assert.match(getCampusEntry("calendario-academico").note, /não são sincronizadas/);
});
