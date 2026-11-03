import test from "node:test";
import assert from "node:assert/strict";
import { parseCalendar } from "../lib/ical.ts";

const calendar = (event) => `BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\n${event}\r\nEND:VEVENT\r\nEND:VCALENDAR`;
test("ICS preserves all-day dates and discards URL tokens, attachments and descriptions", () => {
  assert.deepEqual(parseCalendar(calendar("UID:0001\r\nSUMMARY:Entrega\\, tarefa\r\nDTSTART;VALUE=DATE:20261104\r\nURL:https://online.ifmt.edu.br/?token=private\r\nDESCRIPTION:Dados descartados")), [
    { uid: "0001", title: "Entrega, tarefa", date: "2026-11-04", time: null, timezone: null, cancelled: false },
  ]);
});
test("ICS unfolds lines, preserves confirmed timezone and cancellation", () => {
  const [event] = parseCalendar(calendar("UID:0002\r\nSUMMARY:Tarefa de\r\n  exemplo\r\nDTSTART;TZID=America/Cuiaba:20261104T230000\r\nSTATUS:CANCELLED"));
  assert.equal(event.title, "Tarefa de exemplo");
  assert.equal(event.time, "23:00:00");
  assert.equal(event.timezone, "America/Cuiaba");
  assert.equal(event.cancelled, true);
});
test("UTC near midnight remains UTC without changing the source date", () => {
  const [event] = parseCalendar(calendar("UID:0003\nSUMMARY:Tarefa\nDTSTART:20261104T010000Z"));
  assert.equal(event.date, "2026-11-04");
  assert.equal(event.timezone, "UTC");
});
for (const extra of ["DTSTART:20261104T010000", "DTSTART;VALUE=DATE:20260230", "DTSTART:20261104T250000Z", "DTSTART;TZID=Europe/Paris:20261104T010000", "DTSTART;VALUE=DATE:20261104\nRRULE:FREQ=DAILY", "DTSTART;VALUE=DATE:20261104\nBEGIN:VALARM"]) {
  test("unsupported or ambiguous ICS fails as a whole: " + extra, () => assert.throws(() => parseCalendar(calendar("UID:1\nSUMMARY:Teste\n" + extra))));
}
test("missing and duplicated identifiers reject the entire file", () => {
  assert.throws(() => parseCalendar(calendar("SUMMARY:Teste\nDTSTART;VALUE=DATE:20261104")));
  assert.throws(() => parseCalendar(calendar("UID:1\nUID:2\nSUMMARY:Teste\nDTSTART;VALUE=DATE:20261104")));
});
