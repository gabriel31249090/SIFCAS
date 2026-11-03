import test from "node:test";
import assert from "node:assert/strict";
import { parseCsv, decodeCsvBytes, csvCell } from "../lib/csv.ts";
import { parseInstitutionalCsv } from "../lib/institutional-import.ts";

test("CSV handles BOM, CRLF, escaped quotes, multiline cells and physical line numbers", () => {
  const csv = '\uFEFFid;nome;nota\r\n00001;"Ana\r\n""Exemplo""";"0,0"\r\n00002;B;\r\n';
  const parsed = parseCsv(csv);
  assert.equal(parsed.rows[0].values[0], "00001");
  assert.equal(parsed.rows[0].values[1], 'Ana\n"Exemplo"');
  assert.equal(parsed.rows[0].values[2], "0,0");
  assert.equal(parsed.rows[1].sourceRow, 4);
  assert.equal(parsed.rows[1].values[2], "");
});

test("delimiter detection ignores quoted separator characters", () => {
  assert.equal(parseCsv('id,"text;;;;"\n001,"A,B"').delimiter, ",");
});

for (const csv of ['a;b\n"x;y', 'a;b\nx', 'a;a\nx;y', 'a;\nx;y', 'a;b\n"x"junk;y', 'a;b\nx"z;y']) {
  test("rejects malformed CSV: " + JSON.stringify(csv), () => assert.throws(() => parseCsv(csv)));
}

test("UTF-8 decoding is strict and bounds bytes before parsing", () => {
  assert.throws(() => decodeCsvBytes(new Uint8Array([0xff, 0xfe, 0x61])));
  assert.throws(() => decodeCsvBytes(new Uint8Array(751 * 1024)));
  assert.throws(() => decodeCsvBytes(new Uint8Array([0x61, 0, 0x62])));
  assert.equal(decodeCsvBytes(new TextEncoder().encode('\uFEFFnome\nCáceres')), 'nome\nCáceres');
  assert.throws(() => parseCsv('a\n1\n2', { maxRows: 1 }));
});

test("institutional aliases and em_atividade normalize without splitting quoted records", () => {
  const rows = parseInstitutionalCsv('matrícula;nome;email;perfil;situação\r\n00012;"Nome\r\nsintético";teste@example.invalid;docente;em_atividade');
  assert.equal(rows.length, 1);
  assert.equal(rows[0].external_id, "00012");
  assert.equal(rows[0].situation, "active");
  assert.equal(rows[0].proposed_role, "teacher");
});

test("ambiguous aliases cannot select a different identity column silently", () => {
  assert.throws(() => parseInstitutionalCsv('external_id;matricula;nome;email;perfil\n1;2;X;x@example.invalid;aluno'), /ambíguas/);
});

test("institutional files cannot request administrator privileges", () => {
  assert.throws(() => parseInstitutionalCsv('matricula;nome;email;perfil\n0001;Sintético;synthetic@example.invalid;Administrador'), /não pode conceder Administrador/);
});

test("CSV export neutralizes spreadsheet formulas", () => {
  for (const cell of ['=WEBSERVICE("x")', '+1', '-1', '@SUM(A1)', '  =1', '\t=1']) {
    assert.ok(csvCell(cell).startsWith('"\''));
  }
  assert.equal(csvCell("0001"), '"0001"');
});
