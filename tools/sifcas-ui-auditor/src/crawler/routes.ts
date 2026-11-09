export type RobotsRule = { allow: boolean; path: string };
export type RobotsPolicy = {
  origin: string;
  rules: RobotsRule[];
  source: string;
  status: number;
  allows(url: string): boolean;
};

export type RouteProbeOutcome = "ready" | "http-error" | "blocked" | "blocked-redirect" | "navigation-error";
export type RouteProbeResult = {
  requestedUrl: string;
  finalUrl: string;
  status: number | null;
  outcome: RouteProbeOutcome;
  reason?: string;
};

const auditorAgent = "sifcas-ui-auditor";
const auditorUserAgent = "SIFCAS-UI-Auditor/1.0";

function ruleMatches(pattern: string, pathname: string) {
  const endAnchored = pattern.endsWith("$");
  const rawPattern = endAnchored ? pattern.slice(0, -1) : pattern;
  const regex = new RegExp(`^${rawPattern.split("*").map(escapeRegex).join(".*")}${endAnchored ? "$" : ""}`);
  return regex.test(pathname);
}

function escapeRegex(value: string) {
  return value.replace(/[.+?^${}()|[\]\\]/g, "\\$&");
}

export function parseRobotsTxt(origin: string, text: string, status = 200): RobotsPolicy {
  const groups: { agents: string[]; rules: RobotsRule[] }[] = [];
  let current: { agents: string[]; rules: RobotsRule[] } | null = null;
  let hasDirective = false;
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.replace(/#.*/, "").trim();
    const separator = line.indexOf(":");
    if (separator < 0) continue;
    const field = line.slice(0, separator).trim().toLowerCase();
    const value = line.slice(separator + 1).trim();
    if (field === "user-agent") {
      if (!current || hasDirective) {
        current = { agents: [], rules: [] };
        groups.push(current);
        hasDirective = false;
      }
      current.agents.push(value.toLowerCase());
    } else if (current && (field === "allow" || field === "disallow")) {
      hasDirective = true;
      if (value) current.rules.push({ allow: field === "allow", path: value });
    }
  }

  const agentSpecificity = (agents: string[]) => Math.max(0, ...agents
    .filter((agent) => agent !== "*" && agent.length > 0 && auditorAgent.includes(agent))
    .map((agent) => agent.length));
  const mostSpecificAgent = Math.max(0, ...groups.map((group) => agentSpecificity(group.agents)));
  const matchingGroups = groups.filter((group) => mostSpecificAgent > 0
    ? agentSpecificity(group.agents) === mostSpecificAgent
    : group.agents.includes("*"));
  const rules = matchingGroups.flatMap((group) => group.rules);
  const policy: RobotsPolicy = {
    origin,
    rules,
    source: text,
    status,
    allows(url: string) {
      const normalized = normalizeCandidate(url, origin, origin);
      if (!normalized) return false;
      const parsed = new URL(normalized);
      const matched = rules.filter((rule) => ruleMatches(rule.path, `${parsed.pathname}${parsed.search}`));
      if (!matched.length) return true;
      const specificity = Math.max(...matched.map((rule) => rule.path.replace(/[*$]/g, "").length));
      const mostSpecific = matched.filter((rule) => rule.path.replace(/[*$]/g, "").length === specificity);
      return mostSpecific.some((rule) => rule.allow);
    },
  };
  return policy;
}

export async function fetchRobots(origin: string): Promise<RobotsPolicy> {
  const response = await fetch(new URL("/robots.txt", origin), {
    headers: { "user-agent": auditorUserAgent },
    redirect: "error",
    credentials: "omit",
    signal: AbortSignal.timeout(15_000),
  });
  if (!response.ok) throw new Error(`robots.txt returned HTTP ${response.status}`);
  return parseRobotsTxt(origin, await response.text(), response.status);
}

export function normalizeCandidate(candidate: string, base: string, origin: string) {
  try {
    const url = new URL(candidate, base);
    if (url.origin !== origin || !["http:", "https:"].includes(url.protocol) || url.username || url.password) return null;
    url.hash = "";
    return url.toString();
  } catch {
    return null;
  }
}

/** Checks every HTTP destination before requesting it; forbidden redirects are never followed. */
export async function probePublicRoute(url: string, origin: string, policy: RobotsPolicy): Promise<RouteProbeResult> {
  let current = normalizeCandidate(url, origin, origin);
  if (!current || !policy.allows(current)) {
    return { requestedUrl: url, finalUrl: current ?? url, status: null, outcome: "blocked", reason: "The requested URL is outside the permitted origin or robots policy, or contains credentials." };
  }
  const visited = new Set<string>();
  let status: number | null = null;
  for (let redirects = 0; ; redirects += 1) {
    if (visited.has(current)) {
      return { requestedUrl: url, finalUrl: current, status, outcome: "navigation-error", reason: "HTTP redirect loop detected." };
    }
    visited.add(current);
    let response: Response;
    try {
      response = await fetch(current, {
        headers: { "user-agent": auditorUserAgent }, redirect: "manual", credentials: "omit",
        signal: AbortSignal.timeout(15_000),
      });
      status = response.status;
      // A probe needs headers only; release streaming responses without consuming the page.
      await response.body?.cancel().catch(() => undefined);
    } catch {
      return { requestedUrl: url, finalUrl: current, status, outcome: "navigation-error", reason: "The public route could not be requested within the navigation timeout." };
    }
    if (![301, 302, 303, 307, 308].includes(status)) {
      return { requestedUrl: url, finalUrl: current, status, outcome: status >= 200 && status < 300 ? "ready" : "http-error", ...(status >= 200 && status < 300 ? {} : { reason: `HTTP ${status}; this response is not an auditable public page.` }) };
    }
    const location = response.headers.get("location");
    if (!location) {
      return { requestedUrl: url, finalUrl: current, status, outcome: "navigation-error", reason: "HTTP redirect has no Location header." };
    }
    const next = normalizeCandidate(location, current, origin);
    if (!next || !policy.allows(next)) {
      let destination = location;
      try { destination = new URL(location, current).toString(); } catch { /* Preserve the rejected value as evidence. */ }
      return { requestedUrl: url, finalUrl: destination, status, outcome: "blocked-redirect", reason: "The redirect destination is outside the permitted origin or robots policy, or contains credentials; it was not requested." };
    }
    if (redirects >= 8) {
      return { requestedUrl: url, finalUrl: current, status, outcome: "navigation-error", reason: "HTTP redirect limit reached (maximum 8 redirects)." };
    }
    current = next;
  }
}
