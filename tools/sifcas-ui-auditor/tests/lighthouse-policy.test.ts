import assert from "node:assert/strict";
import test from "node:test";
import { lighthouseBlockedPatterns } from "../src/crawler/lighthouse-policy.ts";

test("Lighthouse blocks external resource hosts without blocking the audited origin", () => {
  const patterns = lighthouseBlockedPatterns("http://127.0.0.1:3100", [], `## Requisições de recursos bloqueados

- https://example.com/analytics.js
- https://example.com/other.js
- http://127.0.0.1:3100/__nextjs_original-stack-frames

## Referências

- https://reference.example/page
`);
  assert.deepEqual(patterns, ["https://example.com/*"]);
});

test("Lighthouse preserves forbidden path prefixes and anchored paths", () => {
  assert.deepEqual(lighthouseBlockedPatterns("http://localhost:3100", [
    { allow: true, path: "/noticias" },
    { allow: false, path: "/api/" },
    { allow: false, path: "/login$" },
  ], ""), ["http://localhost:3100/api/*", "http://localhost:3100/login"]);
});
