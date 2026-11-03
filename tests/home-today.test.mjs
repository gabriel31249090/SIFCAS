import test from "node:test";
import assert from "node:assert/strict";
import { buildToday, calendarInCuiaba, nextScheduleDate } from "../lib/home-today.ts";

const now = new Date("2026-11-04T02:00:00Z"); // still November 3 in Cuiabá
const source = (status = "ready") => ({ id: "local", label: "SIFCAS", status, detail: "", href: "/agenda-aluno", updatedAt: null });
const item = (override = {}) => ({ id: "001", kind: "assessment", title: "Avaliação", detail: "", date: "2026-11-03", time: "19:00", href: "/avaliacoes", sourceId: "local", sourceLabel: "SIFCAS", imported: false, timeZone: "America/Cuiaba", updatedAt: null, ...override });

test("Today respects Cuiaba near UTC midnight and retains source identities", () => {
  const result = buildToday([item(), item(), item({ sourceId: "ava" }), item({ date: "2026-11-02", id: "past" })], [source()], now);
  assert.equal(result.today, "2026-11-03");
  assert.equal(result.todayItems.length, 2);
});

test("source failure or lack of connection can never imply all obligations are fulfilled", () => {
  assert.match(buildToday([], [source("unavailable")], now).emptyMessage, /indisponíveis/);
  assert.equal(buildToday([], [source("not_configured")], now).incomplete, true);
  assert.match(buildToday([], [source("not_configured")], now).emptyMessage, /SUAP e o AVA/);
});

test("UTC calendar dates convert before grouping, date-only and unknown zones remain literal", () => {
  assert.deepEqual(calendarInCuiaba({ date: "2026-11-04", time: "01:30:00", timezone: "UTC" }), { date: "2026-11-03", time: "21:30", timeZone: "America/Cuiaba" });
  assert.deepEqual(calendarInCuiaba({ date: "2026-11-04", time: null, timezone: null }), { date: "2026-11-04", time: null, timeZone: null });
  assert.equal(calendarInCuiaba({ date: "2026-02-30", time: null, timezone: null }), null);
  assert.equal(calendarInCuiaba({ date: "2026-11-04", time: "08:00", timezone: null }).timeZone, null);
});

test("weekly import Sunday=0 and local Sunday=7 can be normalized without moving the source time", () => {
  assert.equal(nextScheduleDate("2026-11-03", 0), "2026-11-08");
  assert.equal(nextScheduleDate("2026-11-03", 2), "2026-11-03");
  assert.equal(nextScheduleDate("2026-11-03", 7), null);
});
