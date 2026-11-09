import type { Page } from "playwright";
import { normalizeCandidate, probePublicRoute, type RobotsPolicy, type RouteProbeOutcome } from "./routes.ts";

export type DiscoveredRoute = {
  url: string;
  path: string;
  title: string;
  status: number | null;
  auth: "unknown";
  discovery: "seed" | "link";
  allowedByRobots: boolean;
  finalUrl: string | null;
  outcome: RouteProbeOutcome;
  reason?: string;
};

export async function discoverRoutes(
  page: Page,
  seeds: string[],
  origin: string,
  policy: RobotsPolicy,
  maxRoutes: number,
): Promise<{ allowed: string[]; records: DiscoveredRoute[] }> {
  const queue: { url: string; discovery: "seed" | "link" }[] = seeds.map((url) => ({ url, discovery: "seed" }));
  const seen = new Set<string>();
  const records: DiscoveredRoute[] = [];
  const allowed: string[] = [];
  while (queue.length && records.length < maxRoutes) {
    const item = queue.shift()!;
    if (seen.has(item.url)) continue;
    seen.add(item.url);
    const probe = await probePublicRoute(item.url, origin, policy);
    const allowedByRobots = policy.allows(item.url);
    let pathname = "";
    try { pathname = new URL(item.url).pathname; } catch { /* Invalid seeds are recorded, never navigated. */ }
    if (probe.outcome !== "ready") {
      records.push({ url: item.url, path: pathname, title: "", status: probe.status, auth: "unknown", discovery: item.discovery, allowedByRobots, finalUrl: probe.finalUrl, outcome: probe.outcome, reason: probe.reason });
      continue;
    }
    let title = "";
    let status: number | null = null;
    let finalUrl: string | null = probe.finalUrl;
    let outcome: RouteProbeOutcome = "navigation-error";
    let reason: string | undefined;
    try {
      const response = await page.goto(probe.finalUrl, { waitUntil: "domcontentloaded", timeout: 20_000 });
      status = response?.status() ?? null;
      finalUrl = page.url();
      const normalizedFinal = normalizeCandidate(finalUrl, probe.finalUrl, origin);
      if (!normalizedFinal || !policy.allows(normalizedFinal)) {
        outcome = "blocked-redirect";
        reason = "The browser reached a non-permitted destination; no DOM was read.";
      } else if (status === null) {
        reason = "Browser navigation returned no HTTP response; no DOM was read.";
      } else if (status < 200 || status >= 300) {
        outcome = "http-error";
        reason = `Browser navigation returned HTTP ${status}; no DOM was read.`;
      } else {
        finalUrl = normalizedFinal;
        outcome = "ready";
        title = await page.title();
        const links = await page.locator("a[href]").evaluateAll((anchors) => anchors.map((anchor) => (anchor as HTMLAnchorElement).href));
        for (const link of links) {
          const normalized = normalizeCandidate(link, normalizedFinal, origin);
          if (normalized && !seen.has(normalized) && policy.allows(normalized)) queue.push({ url: normalized, discovery: "link" });
        }
        if (!allowed.includes(normalizedFinal)) allowed.push(normalizedFinal);
        seen.add(normalizedFinal);
      }
    } catch (error) {
      reason = `Navigation failed: ${error instanceof Error ? error.message : String(error)}`;
      outcome = "navigation-error";
    }
    records.push({ url: item.url, path: pathname, title, status, auth: "unknown", discovery: item.discovery, allowedByRobots, finalUrl, outcome, ...(reason ? { reason } : {}) });
  }
  return { allowed, records };
}
