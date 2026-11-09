import type { RobotsRule } from "./routes.ts";

export function lighthouseBlockedPatterns(origin: string, rules: RobotsRule[], fullReport: string) {
  const resourceSection = fullReport.split(/## (?:Recursos de terceiros não carregados|Requisições de recursos bloqueados)/)[1]?.split("\n## ")[0] ?? "";
  const externalOrigins = [...resourceSection.matchAll(/^\s*-\s+(https?:\/\/\S+)/gm)]
    .map((match) => new URL(match[1]).origin)
    .filter((resourceOrigin) => resourceOrigin !== origin);
  return [
    ...rules.filter((rule) => !rule.allow).map((rule) => `${origin}${rule.path.replace(/\$$/, "")}${rule.path.endsWith("$") ? "" : "*"}`),
    ...[...new Set(externalOrigins)].map((externalOrigin) => `${externalOrigin}/*`),
  ];
}
