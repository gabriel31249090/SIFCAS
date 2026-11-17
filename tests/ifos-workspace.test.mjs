import test from "node:test";
import assert from "node:assert/strict";
import { clampIFOSGeometry, emptyIFOSWorkspace, ifosWorkspaceStorageKey, maxIFOSWindows, parseIFOSWorkspace, resizeIFOSGeometry, serializeIFOSWorkspace } from "../lib/ifos-workspace.ts";

const viewport = { width: 1440, height: 1000 };
const allowed = new Set(["/boletim", "/agenda-aluno", "#focus"]);
const savedWindow = { href: "/boletim", x: 200, y: 100, width: 550, height: 480, minimized: false, maximized: false };
const json = (windows, extra = {}) => JSON.stringify({ version: 1, windows, showDesktop: false, ...extra });

test("IFOS workspace recovers from malformed, unsupported and oversized storage", () => {
  for (const raw of [null, "{", "null", "[]", "true", '{"version":2,"windows":[]}', '{"version":1,"windows":{}}', " ".repeat(32_769)]) {
    assert.deepEqual(parseIFOSWorkspace(raw, allowed, viewport), emptyIFOSWorkspace());
  }
  const windows = [null, [], {}, { ...savedWindow, width: "550" }, { ...savedWindow, x: null }, { ...savedWindow, minimized: "false" }, { ...savedWindow, height: 1e999 }, savedWindow];
  assert.deepEqual(parseIFOSWorkspace(json(windows), allowed, viewport).windows, [savedWindow]);
});

test("IFOS restores only current authorized exact hrefs and ignores duplicate windows", () => {
  const denied = ["/usuarios", "https://example.com", "javascript:alert(1)", "/boletim?account=other", "//example.com", "/ifos"];
  const input = [...denied.map((href) => ({ ...savedWindow, href })), savedWindow, { ...savedWindow, x: 99 }, { ...savedWindow, href: "#focus" }];
  const restored = parseIFOSWorkspace(json(input, { showDesktop: true }), allowed, viewport);
  assert.deepEqual(restored.windows.map(({ href }) => href), ["/boletim", "#focus"]);
  assert.equal(restored.windows[0].x, 200);
  assert.equal(restored.showDesktop, true);
  assert.equal(parseIFOSWorkspace(json([savedWindow], { showDesktop: "true" }), allowed, viewport).showDesktop, false);
  assert.equal(parseIFOSWorkspace(json([savedWindow]), new Set(), viewport).windows.length, 0);
});

test("IFOS storage keys isolate accounts without sharing preference payloads", () => {
  const student = ifosWorkspaceStorageKey("sifcas:student-experience:v2:student");
  const teacher = ifosWorkspaceStorageKey("sifcas:student-experience:v2:teacher");
  const storage = new Map([[student, json([savedWindow])]]);
  assert.notEqual(student, teacher);
  assert.equal(student.startsWith("sifcas:student-experience:"), false);
  assert.deepEqual(parseIFOSWorkspace(storage.get(teacher) ?? null, allowed, viewport), emptyIFOSWorkspace());
  assert.equal(parseIFOSWorkspace(storage.get(student), allowed, viewport).windows.length, 1);
});

test("IFOS serializes layout and ordering without academic content or running timers", () => {
  const windows = [
    { ...savedWindow, minimized: true, grades: [10], app: { label: "Do not store" } },
    { ...savedWindow, href: "#focus", maximized: true, timerRunning: true, remaining: 2, access_token: "not stored" },
  ];
  const serialized = serializeIFOSWorkspace(windows, true);
  const restored = parseIFOSWorkspace(serialized, allowed, viewport);
  assert.deepEqual(restored.windows.map(({ href, minimized, maximized }) => ({ href, minimized, maximized })), [
    { href: "/boletim", minimized: true, maximized: false },
    { href: "#focus", minimized: false, maximized: true },
  ]);
  for (const value of ["grades", "Do not store", "timerRunning", "remaining", "access_token"]) assert.equal(serialized.includes(value), false);
  assert.equal(restored.showDesktop, true);
});

test("IFOS bounds window counts and clamps restored geometry to the current viewport", () => {
  const input = Array.from({ length: 100 }, (_, i) => ({ ...savedWindow, href: `/app-${i}`, x: 1e20, y: -1e20, width: 1e20, height: -1e20 }));
  const restored = parseIFOSWorkspace(json(input), new Set(input.map(({ href }) => href)), { width: 900, height: 580 });
  assert.equal(restored.windows.length, maxIFOSWindows);
  assert.deepEqual(restored.windows[0], { href: "/app-0", x: 10, y: 72, width: 880, height: 240, minimized: false, maximized: false });
  assert.equal(JSON.parse(serializeIFOSWorkspace(input, false)).windows.length, maxIFOSWindows);
});

test("IFOS movement and resize stay within the viewport while respecting minimum sizes", () => {
  const geometry = { x: 200, y: 100, width: 550, height: 480 };
  const resized = resizeIFOSGeometry(geometry, { width: 10, height: 50 }, viewport);
  assert.deepEqual(resized, { x: 200, y: 100, width: 560, height: 530 });
  assert.deepEqual(resizeIFOSGeometry(geometry, { width: 100_000, height: 100_000 }, viewport), { x: 200, y: 100, width: 1230, height: 831 });
  assert.deepEqual(resizeIFOSGeometry(geometry, { width: -100_000, height: -100_000 }, viewport), { x: 200, y: 100, width: 320, height: 240 });
  for (const size of [viewport, { width: 900, height: 500 }, { width: 20, height: 40 }]) {
    const result = clampIFOSGeometry({ ...geometry, x: -Infinity, y: NaN, width: Infinity, height: NaN }, size);
    assert.ok(Object.values(result).every(Number.isFinite));
    assert.ok(result.x >= 0 && result.y >= 0);
    assert.ok(result.x + result.width <= size.width);
    assert.ok(result.y + result.height <= size.height);
  }
});
