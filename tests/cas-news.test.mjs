import assert from "node:assert/strict";
import test from "node:test";
import { getCasNews, parseCasNewsPayload } from "../lib/cas-news.ts";

const casPost = (overrides = {}) => ({
  id: 123,
  date: "2026-10-16T09:06:14",
  link: "https://cas.ifmt.edu.br/noticia-publica/",
  title: { rendered: "Campus Cáceres &amp; comunidade" },
  ...overrides,
});

test("public CAS posts are normalized to safe text, dates, and same-host links", () => {
  assert.deepEqual(parseCasNewsPayload([casPost()]), {
    status: "ready",
    skipped: 0,
    items: [{
      id: 123,
      title: "Campus Cáceres & comunidade",
      publishedOn: "2026-10-16",
      url: "https://cas.ifmt.edu.br/noticia-publica/",
    }],
  });
});

test("CAS feed rejects unsafe destinations and malformed public posts", () => {
  const result = parseCasNewsPayload([
    casPost({ link: "https://attacker.example/noticia/" }),
    casPost({ link: "http://cas.ifmt.edu.br/noticia/" }),
    casPost({ link: "https://cas.ifmt.edu.br/noticia/?token=private" }),
    casPost({ id: 0 }),
    casPost({ title: { rendered: "<b>   </b>" } }),
    casPost({ date: "not-a-date" }),
    casPost({ date: "2026-02-31T09:00:00" }),
  ]);
  assert.equal(result.status, "partial");
  assert.equal(result.items.length, 0);
  assert.equal(result.skipped, 7);
  assert.equal(parseCasNewsPayload({ posts: [] }).status, "unavailable");
});

test("CAS feed fetch is fixed to its public API and reports service failures", async () => {
  let requestedUrl = "";
  const result = await getCasNews(async (input, init) => {
    requestedUrl = String(input);
    assert.equal(init.redirect, "error");
    assert.equal(init.headers.accept, "application/json");
    return Response.json([casPost()]);
  });
  assert.match(requestedUrl, /^https:\/\/cas\.ifmt\.edu\.br\/wp-json\/wp\/v2\/posts\?/);
  assert.equal(result.status, "ready");

  const unavailable = await getCasNews(async () => new Response(null, { status: 503 }));
  assert.equal(unavailable.status, "unavailable");
  assert.equal(unavailable.items.length, 0);
});
