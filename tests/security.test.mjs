import { test } from "node:test";
import assert from "node:assert/strict";
import { safeInternalPath } from "../lib/safe-path.ts";

for (const value of ["/", "/boletim", "/agenda-aluno?turma=2#hoje", "/buscar?q=vida%20academica"]) {
  test("keeps internal destination " + value, () => assert.equal(safeInternalPath(value), value));
}
for (const value of [undefined, null, "", "https://example.invalid", "//example.invalid", "/\\example.invalid", "/%5cexample.invalid", "/%2fexample.invalid", "/%252fexample.invalid", "/%255cexample.invalid", "/a/..//example.invalid", "/%0a/example.invalid", "/%0d/example.invalid", "/%09/example.invalid", "javascript:alert(1)", "/%zz"]) {
  test("rejects unsafe destination " + String(value), () => assert.equal(safeInternalPath(value, "/aplicativos"), "/aplicativos"));
}
test("normalizes internal dot segments without leaving the origin", () => assert.equal(safeInternalPath("/campus/../boletim"), "/boletim"));
