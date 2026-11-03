import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { effectiveNoticeStatus, filterPublicNotices, formatNoticeDate, isOfficialNoticeUrl, mergePublicNoticeCatalog, noticeCalendar, noticeIdentity, noticeIsStale, validNoticeDate } from "../lib/public-notices.ts";
import { reviewedPublicNotices } from "../lib/public-notices-data.ts";

const reviewedAt = new Date("2026-11-03T16:00:00Z");
const sample = (overrides = {}) => ({ ...structuredClone(reviewedPublicNotices[0]), ...overrides });

test("reviewed official catalog distinguishes Caceres and source corrections", () => {
  const rows = filterPublicNotices(reviewedPublicNotices, { campus: "Cáceres" }, reviewedAt);
  assert.equal(rows.length, 2);
  assert.ok(rows.find((row) => row.number === "14").documents.some((doc) => doc.kind === "correction"));
  assert.equal(filterPublicNotices(reviewedPublicNotices, { campus: "all", q: "34/2026" }, reviewedAt)[0].campus, "Várzea Grande");
  assert.equal(filterPublicNotices(reviewedPublicNotices, { campus: "Cáceres", category: "Extensão", year: "2026", q: "extensao" }, reviewedAt).length, 1);
});

test("open status expires dynamically, missing deadlines never imply open", () => {
  assert.equal(effectiveNoticeStatus(sample(), reviewedAt), "open");
  assert.equal(effectiveNoticeStatus(sample(), new Date("2026-11-09T04:00:00Z")), "closed");
  assert.equal(effectiveNoticeStatus(sample({ closes: null }), reviewedAt), "review");
  assert.equal(effectiveNoticeStatus(sample({ declaredStatus: "unknown" }), reviewedAt), "review");
  assert.equal(effectiveNoticeStatus(sample({ declaredStatus: "cancelled" }), reviewedAt), "cancelled");
});

test("unconfirmed conflicting hours require review and do not emit an invented calendar deadline", () => {
  const conflict = sample({ reviewReasons: ["19h no cabeçalho e 23h59 no texto."] });
  assert.equal(effectiveNoticeStatus(conflict, reviewedAt), "review");
  assert.throws(() => noticeCalendar(conflict, reviewedAt));
  assert.equal(formatNoticeDate({ date: "2026-11-08" }), "08/11/2026 · horário não informado");
  assert.match(formatNoticeDate({ date: "2026-11-08", time: "23:59" }), /fuso a confirmar/);
});

test("confirmed Cuiaba deadlines respect timezone at the minute boundary", () => {
  const timed = sample({ closes: { date: "2026-11-08", time: "23:59", timeZone: "America/Cuiaba" } });
  assert.equal(effectiveNoticeStatus(timed, new Date("2026-11-09T03:58:59Z")), "open");
  assert.equal(effectiveNoticeStatus(timed, new Date("2026-11-09T03:59:01Z")), "closed");
  assert.match(noticeCalendar(timed, reviewedAt), /DTSTART:20261109T035900Z/);
});

test("date-only reminders preserve date precision, CRLF and alarm without fabricating a timezone", () => {
  const calendar = noticeCalendar(sample(), reviewedAt, 1);
  assert.match(calendar, /DTSTART;VALUE=DATE:20261108\r\n/);
  assert.match(calendar, /DTEND;VALUE=DATE:20261109\r\n/);
  assert.match(calendar, /TRIGGER:-P1D\r\n/);
  assert.doesNotMatch(calendar, /TZID=|DTSTART:.*T/);
  for (const line of calendar.split("\r\n")) assert.ok(Buffer.byteLength(line, "utf8") <= 75);
  assert.throws(() => noticeCalendar(sample(), reviewedAt, 0));
});

test("stale metadata is flagged, and an old unexpired open label becomes unconfirmed", () => {
  const notice = sample({ closes: { date: "2026-12-20" } });
  const later = new Date("2026-11-12T15:00:00Z");
  assert.equal(noticeIsStale(notice, later), true);
  assert.equal(effectiveNoticeStatus(notice, later), "review");
});

test("repeated ingestion is idempotent, preserves old versions and does not deduplicate by number alone", () => {
  const original = sample();
  const first = mergePublicNoticeCatalog([], [original], "ok");
  assert.equal(first.notices.length, 1);
  assert.equal(mergePublicNoticeCatalog(first.notices, [original], "ok").notices.length, 1);
  const changed = sample({ revision: "2026-11-03.2", summary: "Retificação revista." });
  const next = mergePublicNoticeCatalog(first.notices, [changed], "ok");
  assert.equal(next.notices[0].previousVersions[0].revision, original.revision);
  const otherCampus = sample({ id: "outro-campus-39-2026", campus: "Várzea Grande", sourceRecordId: "outro-campus-39-2026" });
  assert.notEqual(noticeIdentity(original), noticeIdentity(otherCampus));
  assert.equal(mergePublicNoticeCatalog(next.notices, [otherCampus], "ok").notices.length, 2);
});

test("source outage, incomplete pages and layout changes retain previous valid catalog", () => {
  const old = [sample()];
  assert.deepEqual(mergePublicNoticeCatalog(old, [], "source_unavailable").notices, old);
  assert.deepEqual(mergePublicNoticeCatalog(old, [], "layout_changed").notices, old);
  assert.deepEqual(mergePublicNoticeCatalog(old, [], "ok").notices, old);
  const broken = mergePublicNoticeCatalog(old, [sample({ closes: { date: "2026-02-31" } })], "ok");
  assert.equal(broken.state, "layout_changed");
  assert.deepEqual(broken.notices, old);
});

test("official metadata URL allowlist rejects SSRF targets, credential queries and lookalike hosts", () => {
  for (const bad of ["http://ifmt.edu.br/a", "https://127.0.0.1/", "https://ifmt.edu.br.evil.invalid/", "https://ifmt.edu.br@evil.invalid/", "https://ifmt.edu.br:444/", "file:///etc/passwd", "javascript:alert(1)", "https://ifmt.edu.br/calendar?token=private"]) assert.equal(isOfficialNoticeUrl(bad), false, bad);
  assert.equal(isOfficialNoticeUrl("https://ifmt.edu.br/painel-de-editais/"), true);
  assert.equal(isOfficialNoticeUrl("https://drive.google.com/file/d/verified-public-document/view", "document"), true);
  assert.equal(isOfficialNoticeUrl("https://drive.google.com/redirect?url=http://localhost", "document"), false);
  assert.equal(validNoticeDate({ date: "2026-02-31" }), false);
  assert.equal(validNoticeDate({ date: "2026-02-28", time: "25:99" }), false);
});

test("public editorial query constrains visibility/status even for privileged sessions", () => {
  const source = readFileSync("lib/institutional.ts", "utf8").split("export async function listPublicNoticePublications()")[1].split("export async function")[0];
  assert.match(source, /\.eq\("visibility", "public"\)/);
  assert.match(source, /\.eq\("status", "published"\)/);
  assert.match(source, /\.lte\("published_at", now\)/);
});
