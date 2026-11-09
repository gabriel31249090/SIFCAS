import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import { fetchRobots, probePublicRoute } from "./crawler/routes.ts";

const project = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const reports = path.join(project, "reports");
const origin = new URL(process.env.SIFCAS_AUDIT_ORIGIN ?? "http://127.0.0.1:3000").origin;
const hostname = new URL(origin).hostname;
if (!["127.0.0.1", "localhost", "::1", "[::1]"].includes(hostname)) {
  throw new Error("Lighthouse está restrito à instância local para não executar auditorias remotas sem controle.");
}

async function main() {
  const policy = await fetchRobots(origin);
  const probe = await probePublicRoute(new URL("/noticias", origin).toString(), origin, policy);
  if (probe.outcome !== "ready") throw new Error(`Página Lighthouse indisponível: ${probe.reason ?? probe.outcome}`);
  const target = probe.finalUrl;
  if (!policy.allows(target)) throw new Error(`robots.txt não permite Lighthouse em ${target}`);
  const fullReport = await fs.readFile(path.join(reports, "full-audit.md"), "utf8");
  const resourceSection = fullReport.split(/## (?:Recursos de terceiros não carregados|Requisições de recursos bloqueados)/)[1]?.split("\n## ")[0] ?? "";
  const externalResources = [...resourceSection.matchAll(/^\s*-\s+(https?:\/\/\S+)/gm)].map((match) => new URL(match[1]).origin);
  const blockedUrlPatterns = [
    ...policy.rules.filter((rule) => !rule.allow).map((rule) => `${origin}${rule.path.replace(/\$$/, "")}`),
    ...[...new Set(externalResources)].map((externalOrigin) => `${externalOrigin}/*`),
  ];
  const chrome = await launch({
    chromePath: chromium.executablePath(),
    chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"],
  });
  try {
    const result = await lighthouse(target, {
      port: chrome.port,
      output: "json",
      logLevel: "error",
      onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
      blockedUrlPatterns,
      maxWaitForLoad: 45_000,
      disableStorageReset: false,
    });
    if (!result) throw new Error("Lighthouse returned no report.");
    const lhr = result.lhr;
    if (!policy.allows(lhr.finalDisplayedUrl)) {
      throw new Error(`Lighthouse foi redirecionado para uma rota não permitida: ${lhr.finalDisplayedUrl}`);
    }
    const metrics = Object.fromEntries([
      "first-contentful-paint", "largest-contentful-paint", "speed-index",
      "total-blocking-time", "cumulative-layout-shift", "interactive",
      "server-response-time",
    ].map((id) => {
      const audit = lhr.audits[id];
      return [id, audit ? { value: audit.numericValue ?? null, display: audit.displayValue ?? null, score: audit.score ?? null, error: audit.errorMessage ?? null } : "N/D"];
    }));
    const categories = Object.fromEntries(Object.entries(lhr.categories).map(([id, category]) => [
      id,
      { score: category.score, title: category.title },
    ]));
    const findings = Object.values(lhr.audits)
      .filter((audit) => audit.score !== null && audit.score < 0.9 && audit.details?.type !== "opportunity")
      .map((audit) => ({
        id: audit.id,
        title: audit.title,
        description: audit.description,
        score: audit.score,
        displayValue: audit.displayValue ?? null,
      }));
    const lighthouseReport = {
      tested: true,
      target,
      mode: process.env.SIFCAS_AUDIT_CONTEXT ?? "Local development server; scores are not production benchmarks and the data configuration was not verified by the auditor",
      generatedAt: new Date().toISOString(),
      finalUrl: lhr.finalDisplayedUrl,
      runtimeError: lhr.runtimeError ?? null,
      categories,
      metrics,
      findings,
      warnings: lhr.runWarnings,
      blockedUrlPatterns,
      note: "Same-origin robots.txt disallow rules and known third-party resource hosts were blocked. INP is not reported without representative interaction data.",
    };
    await fs.writeFile(path.join(reports, "lighthouse.json"), `${JSON.stringify(lighthouseReport, null, 2)}\n`, "utf8");
    const performancePath = path.join(reports, "performance.json");
    const performance = JSON.parse(await fs.readFile(performancePath, "utf8"));
    performance.lighthouse = lighthouseReport;
    await fs.writeFile(performancePath, `${JSON.stringify(performance, null, 2)}\n`, "utf8");

    const summaryPath = path.join(reports, "executive-summary.md");
    let summary = await fs.readFile(summaryPath, "utf8");
    const performanceSummary = `- Performance: Lighthouse local/dev scores — ${Object.entries(categories).map(([name, value]) => `${name} ${(value as { score: number | null }).score === null ? "N/D" : Math.round((value as { score: number }).score * 100)}`).join(", ")}; métricas de campo não coletadas; INP N/D.`;
    summary = summary.replace(/^- Performance:.*$/m, performanceSummary);
    await fs.writeFile(summaryPath, summary, "utf8");
    const fullPath = path.join(reports, "full-audit.md");
    const full = await fs.readFile(fullPath, "utf8");
    const fullWithoutPreviousLighthouse = full
      .replace(/^- Performance:.*$/m, performanceSummary)
      .replace(/\n## Lighthouse local[\s\S]*$/, "")
      .trimEnd();
    await fs.writeFile(fullPath, `${fullWithoutPreviousLighthouse}\n\n## Lighthouse local\n\n- Página: ${target}\n- Modo: desenvolvimento local com configuração Supabase fictícia; não representa benchmark de produção.\n- Categorias: ${JSON.stringify(categories)}\n- Métricas: ${JSON.stringify(metrics, null, 2)}\n- Recursos/paths bloqueados: ${JSON.stringify(blockedUrlPatterns)}\n- INP: N/D, sem interações representativas.\n- Avisos: ${JSON.stringify(lhr.runWarnings)}\n`, "utf8");
    console.log("Lighthouse local concluído:", categories);
  } finally {
    await chrome.kill();
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
