import { test } from "node:test";
import assert from "node:assert/strict";
import { createServer, type RequestListener } from "node:http";
import type { Page } from "playwright";
import { fetchRobots, normalizeCandidate, parseRobotsTxt, probePublicRoute } from "../src/crawler/routes.ts";
import { discoverRoutes } from "../src/crawler/discovery.ts";
import { routeSlug } from "../src/crawler/screenshots.ts";
import { fitAsset } from "../src/analysis/asset-matching.ts";
import { validateAssetRegistry } from "../src/integration/asset-registry.ts";

test("robots rules apply most-specific path with Allow winning ties", () => {
  const policy = parseRobotsTxt("https://example.test", "User-agent: *\nDisallow: /\nAllow: /accounts/login/$\n");
  assert.equal(policy.allows("https://example.test/accounts/login/"), true);
  assert.equal(policy.allows("https://example.test/"), false);
  assert.equal(policy.allows("https://example.test/accounts/login/extra"), false);
  assert.equal(policy.allows("https://other.test/accounts/login/"), false);
});

test("asset fitter preserves dimensions and makes a deterministic recommendation", () => {
  const result = fitAsset({ width: 1200, height: 320 }, { filename: "hero.webp", width: 2400, height: 640 });
  assert.equal(result.container.aspectRatio, 3.75);
  assert.equal(result.asset.aspectRatio, 3.75);
  assert.equal(result.recommended.objectFit, "contain");
  assert.equal(result.recommended.compatible, true);
  assert.equal(result.recommended.upscaleFactor, 0.5);
});

test("asset registry rejects missing and invalid intrinsic sizes", () => {
  assert.equal(validateAssetRegistry([{ filename: "ok.png", width: 100, height: 100 }]).valid, true);
  assert.equal(validateAssetRegistry([{ filename: "broken.png", width: 0, height: 100 }]).valid, false);
});

async function publicFixture(handler: RequestListener) {
  const server = createServer(handler);
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  if (!address || typeof address === "string") throw new Error("Test fixture has no HTTP port.");
  return {
    origin: `http://127.0.0.1:${address.port}`,
    close: async () => {
      server.closeAllConnections();
      await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
    },
  };
}

test("specific auditor robots groups take precedence over wildcard groups", () => {
  const policy = parseRobotsTxt("https://example.test", "User-agent: *\nAllow: /\n\nUser-agent: SIFCAS-UI-Auditor\nDisallow: /\nAllow: /public/\n");
  assert.equal(policy.allows("https://example.test/private"), false);
  assert.equal(policy.allows("https://example.test/public/article"), true);
  const otherPolicy = parseRobotsTxt("https://example.test", "User-agent: *\nDisallow: /private\nUser-agent: sifcas-ui-auditor\nAllow: /public/\n");
  assert.equal(otherPolicy.allows("https://example.test/private"), true, "An unrelated wildcard group is not merged into the specific group.");
});

test("URL normalization rejects credentials and outside schemes or origins", () => {
  const origin = "https://example.test";
  for (const candidate of ["https://user:password@example.test/public", "https://outside.test/public", "javascript:alert(1)", "file:///public"]) {
    assert.equal(normalizeCandidate(candidate, origin, origin), null);
    assert.equal(parseRobotsTxt(origin, "User-agent: *\nAllow: /\n").allows(candidate), false);
  }
  assert.equal(normalizeCandidate("/public?q=one#section", origin, origin), "https://example.test/public?q=one");
});

test("public probing never requests login or another prohibited redirect destination", async (t) => {
  const requested: string[] = [];
  const fixture = await publicFixture((request, response) => {
    requested.push(request.url ?? "");
    if (request.url === "/start") response.writeHead(302, { location: "/login" });
    else response.writeHead(200);
    response.end("public fixture");
  });
  t.after(fixture.close);
  const policy = parseRobotsTxt(fixture.origin, "User-agent: *\nDisallow: /login\n");
  const probe = await probePublicRoute(`${fixture.origin}/start`, fixture.origin, policy);
  assert.equal(probe.outcome, "blocked-redirect");
  assert.equal(probe.finalUrl, `${fixture.origin}/login`);
  assert.deepEqual(requested, ["/start"]);
  const blocked = await probePublicRoute(`${fixture.origin}/login`, fixture.origin, policy);
  assert.equal(blocked.outcome, "blocked");
  assert.deepEqual(requested, ["/start"], "A forbidden initial target is not requested either.");
});

test("public probing never follows a cross-origin redirect", async (t) => {
  let outsideRequests = 0;
  const outside = await publicFixture((_request, response) => { outsideRequests += 1; response.end("outside"); });
  t.after(outside.close);
  const fixture = await publicFixture((_request, response) => { response.writeHead(302, { location: `${outside.origin}/elsewhere` }); response.end(); });
  t.after(fixture.close);
  const probe = await probePublicRoute(`${fixture.origin}/start`, fixture.origin, parseRobotsTxt(fixture.origin, ""));
  assert.equal(probe.outcome, "blocked-redirect");
  assert.equal(outsideRequests, 0);
});

test("allowed redirects identify the final URL and 404 responses cannot become ready", async (t) => {
  const requested: string[] = [];
  const fixture = await publicFixture((request, response) => {
    requested.push(request.url ?? "");
    if (request.url === "/start") response.writeHead(307, { location: "/public" });
    else if (request.url === "/missing") response.writeHead(404);
    response.end("fixture");
  });
  t.after(fixture.close);
  const policy = parseRobotsTxt(fixture.origin, "");
  const ready = await probePublicRoute(`${fixture.origin}/start`, fixture.origin, policy);
  assert.equal(ready.outcome, "ready");
  assert.equal(ready.requestedUrl, `${fixture.origin}/start`);
  assert.equal(ready.finalUrl, `${fixture.origin}/public`);
  assert.equal(ready.status, 200);
  assert.deepEqual(requested, ["/start", "/public"]);
  const missing = await probePublicRoute(`${fixture.origin}/missing`, fixture.origin, policy);
  assert.equal(missing.outcome, "http-error");
  assert.equal(missing.status, 404);
});

test("redirect loops and redirect chains stop after a bounded number of requests", async (t) => {
  let requests = 0;
  const fixture = await publicFixture((request, response) => {
    requests += 1;
    const current = request.url ?? "/";
    const location = current === "/loop" ? "/loop" : `/chain/${Number(current.split("/").at(-1)) + 1}`;
    response.writeHead(302, { location }); response.end();
  });
  t.after(fixture.close);
  const policy = parseRobotsTxt(fixture.origin, "");
  const loop = await probePublicRoute(`${fixture.origin}/loop`, fixture.origin, policy);
  assert.equal(loop.outcome, "navigation-error");
  assert.match(loop.reason ?? "", /loop/);
  assert.equal(requests, 1);
  requests = 0;
  const chain = await probePublicRoute(`${fixture.origin}/chain/0`, fixture.origin, policy);
  assert.equal(chain.outcome, "navigation-error");
  assert.match(chain.reason ?? "", /maximum 8/);
  assert.equal(requests, 9, "The original request plus at most eight followed redirects are permitted.");
});

test("robots fetch cannot silently follow a redirected policy", async (t) => {
  let policyRequests = 0;
  const fixture = await publicFixture((request, response) => {
    if (request.url === "/robots.txt") response.writeHead(302, { location: "/another-policy" });
    else policyRequests += 1;
    response.end("User-agent: *\nAllow: /\n");
  });
  t.after(fixture.close);
  await assert.rejects(fetchRobots(fixture.origin));
  assert.equal(policyRequests, 0);
});

test("discovery does not navigate to blocked redirects or audit HTTP errors", async (t) => {
  let browserNavigations = 0;
  const fixture = await publicFixture((request, response) => {
    if (request.url === "/start") response.writeHead(302, { location: "/login" });
    else response.writeHead(404);
    response.end();
  });
  t.after(fixture.close);
  const page = { goto: async () => { browserNavigations += 1; throw new Error("Browser must not be used for these candidates."); } } as unknown as Page;
  const result = await discoverRoutes(page, [`${fixture.origin}/start`, `${fixture.origin}/missing`], fixture.origin, parseRobotsTxt(fixture.origin, "User-agent: *\nDisallow: /login\n"), 10);
  assert.deepEqual(result.allowed, []);
  assert.deepEqual(result.records.map(({ outcome }) => outcome), ["blocked-redirect", "http-error"]);
  assert.equal(browserNavigations, 0);
});

test("discovery validates the browser's final URL before reading its DOM", async (t) => {
  let domReads = 0;
  const fixture = await publicFixture((_request, response) => response.end("public"));
  t.after(fixture.close);
  const page = {
    goto: async () => ({ status: () => 200 }),
    url: () => `${fixture.origin}/login`,
    title: async () => { domReads += 1; return "must not read"; },
    locator: () => { domReads += 1; throw new Error("must not read"); },
  } as unknown as Page;
  const result = await discoverRoutes(page, [`${fixture.origin}/public`], fixture.origin, parseRobotsTxt(fixture.origin, "User-agent: *\nDisallow: /login\n"), 10);
  assert.equal(result.records[0].outcome, "blocked-redirect");
  assert.deepEqual(result.allowed, []);
  assert.equal(domReads, 0);
});

test("screenshots of query variants have distinct stable filenames", () => {
  const first = routeSlug("https://example.test/editais?campus=all");
  const second = routeSlug("https://example.test/editais?campus=caceres");
  assert.notEqual(first, second);
  assert.equal(first, routeSlug("https://example.test/editais?campus=all#section"));
  assert.equal(routeSlug("https://example.test/editais"), "editais");
});
