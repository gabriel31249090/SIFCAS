import fs from "node:fs/promises";
import path from "node:path";
import lighthouse from "lighthouse";
import { launch } from "chrome-launcher";
import { chromium } from "playwright";
import { fetchRobots, probePublicRoute } from "./crawler/routes.ts";
import { lighthouseBlockedPatterns } from "./crawler/lighthouse-policy.ts";

const root = path.resolve(import.meta.dirname, "../../..");
const origin = "http://127.0.0.1:3102";
const date = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Cuiaba", year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
const reportPath = path.resolve(import.meta.dirname, `../evidence/${date}/production-performance.json`);
const buildId = (await fs.readFile(path.join(root, ".next/BUILD_ID"), "utf8")).trim();
const policy = await fetchRobots(origin);
const target = await probePublicRoute(`${origin}/noticias`, origin, policy);
if (target.outcome !== "ready") throw new Error(`Página pública indisponível: ${target.outcome}`);
const chrome = await launch({ chromePath: chromium.executablePath(), chromeFlags: ["--headless", "--no-sandbox", "--disable-gpu", "--disable-dev-shm-usage"] });
try {
  const result = await lighthouse(target.finalUrl, {
    port: chrome.port, output: "json", logLevel: "error",
    onlyCategories: ["performance", "accessibility", "best-practices", "seo"],
    blockedUrlPatterns: [...lighthouseBlockedPatterns(origin, policy.rules, ""), "https://va.vercel-scripts.com/*"],
    maxWaitForLoad: 45_000,
  });
  if (!result || !policy.allows(result.lhr.finalDisplayedUrl)) throw new Error("Lighthouse não concluiu em uma URL permitida.");
  const { lhr } = result;
  const ids = ["first-contentful-paint", "largest-contentful-paint", "total-blocking-time", "cumulative-layout-shift", "speed-index"];
  const report = {
    generatedAt: new Date().toISOString(), buildId, target: target.finalUrl, finalUrl: lhr.finalDisplayedUrl,
    context: "Build Next.js de produção servido localmente com PGlite sintético; não é medição do domínio publicado nem de campo. Uma execução mobile com configuração padrão do Lighthouse.",
    runtimeError: lhr.runtimeError ?? null, warnings: lhr.runWarnings,
    categories: Object.fromEntries(Object.entries(lhr.categories).map(([id, category]) => [id, category.score])),
    metrics: Object.fromEntries(ids.map((id) => [id, { value: lhr.audits[id]?.numericValue ?? null, display: lhr.audits[id]?.displayValue ?? null, error: lhr.audits[id]?.errorMessage ?? null }])),
    findings: Object.values(lhr.audits).filter((audit) => audit.score !== null && audit.score < 0.9).map((audit) => ({ id: audit.id, title: audit.title, score: audit.score, display: audit.displayValue ?? null, details: audit.details ?? null })),
    note: "INP e métricas de campo não foram coletados. Não comparar diretamente com notas obtidas no servidor de desenvolvimento.",
  };
  await fs.mkdir(path.dirname(reportPath), { recursive: true });
  await fs.writeFile(reportPath, `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ categories: report.categories, metrics: report.metrics, runtimeError: report.runtimeError, reportPath }, null, 2));
} finally { await chrome.kill(); }
