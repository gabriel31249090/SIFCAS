import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { launchBrowser } from "./crawler/browser.ts";
import { discoverRoutes } from "./crawler/discovery.ts";
import { fetchRobots, probePublicRoute } from "./crawler/routes.ts";
import { extractGeometry, extractViewport } from "./extractors/geometry.ts";
import { extractAssets } from "./extractors/assets.ts";
import { auditAccessibility } from "./extractors/accessibility.ts";
import { inspectSafeStates } from "./extractors/states.ts";
import { extractPerformance } from "./extractors/performance.ts";
import { extractMediaQueries } from "./extractors/media-queries.ts";
import { inventoryComponents } from "./analysis/components.ts";
import { extractDesignTokens } from "./analysis/design-tokens.ts";
import { findInconsistencies } from "./analysis/inconsistencies.ts";
import { matchAssetsToElements } from "./analysis/asset-matching.ts";
import { captureScreenshot } from "./crawler/screenshots.ts";

const root = path.dirname(fileURLToPath(import.meta.url));
const project = path.resolve(root, "..");
const origin = new URL(process.env.SIFCAS_AUDIT_ORIGIN ?? "http://127.0.0.1:3000").origin;
const requestedMaxRoutes = Number(process.env.SIFCAS_AUDIT_MAX_ROUTES ?? 30);
if (!Number.isInteger(requestedMaxRoutes) || requestedMaxRoutes < 1 || requestedMaxRoutes > 100) throw new Error("SIFCAS_AUDIT_MAX_ROUTES deve ser um inteiro entre 1 e 100.");
const maxRoutes = requestedMaxRoutes;
const auditContext = process.env.SIFCAS_AUDIT_CONTEXT ?? "Instância local autorizada; a configuração dos dados não foi verificada pelo auditor.";
const isLoopback = ["127.0.0.1", "localhost", "::1", "[::1]"].includes(new URL(origin).hostname);
if (!isLoopback && process.env.SIFCAS_AUDIT_ALLOW_REMOTE !== "1") {
  throw new Error("Auditoria remota bloqueada. Use localhost; para um ambiente remoto autorizado, defina SIFCAS_AUDIT_ALLOW_REMOTE=1.");
}
const viewports = [
  { width: 320, height: 640 }, { width: 375, height: 812 }, { width: 430, height: 932 },
  { width: 768, height: 1024 }, { width: 1024, height: 768 }, { width: 1440, height: 900 },
  { width: 1920, height: 1080 }, { width: 2560, height: 1440 },
];
const seeds = ["/noticias", "/editais", "/agenda-institucional", "/campus", "/transparencia", "/verificar-documento"]
  .map((item) => new URL(item, origin).toString());
const reportsDir = path.join(project, "reports");
const screenshotsDir = path.join(project, "screenshots");
const referenceJsonPath = process.env.SIFCAS_AUDIT_REFERENCE_JSON;
const referenceCsvPath = process.env.SIFCAS_AUDIT_REFERENCE_CSV;
let activeBrowser: Awaited<ReturnType<typeof launchBrowser>> | null = null;

async function writeJson(name: string, value: unknown) {
  await fs.writeFile(path.join(reportsDir, name), `${JSON.stringify(value, null, 2)}\n`, "utf8");
}

async function loadReferenceFiles() {
  const references: Record<string, unknown> = {};
  for (const [label, file] of [["json", referenceJsonPath], ["csv", referenceCsvPath]] as const) {
    if (!file) {
      references[label] = null;
      continue;
    }
    try {
      const contents = await fs.readFile(file, "utf8");
      references[label] = label === "json" ? JSON.parse(contents) : contents;
    } catch {
      references[label] = null;
    }
  }
  return references;
}

function parseCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let quoted = false;
  for (let index = 0; index < text.length; index += 1) {
    const character = text[index];
    if (character === '"' && quoted && text[index + 1] === '"') {
      field += '"';
      index += 1;
    } else if (character === '"') {
      quoted = !quoted;
    } else if (character === "," && !quoted) {
      row.push(field);
      field = "";
    } else if ((character === "\n" || character === "\r") && !quoted) {
      if (character === "\r" && text[index + 1] === "\n") index += 1;
      row.push(field);
      if (row.some(Boolean)) rows.push(row);
      row = [];
      field = "";
    } else {
      field += character;
    }
  }
  if (field || row.length) {
    row.push(field);
    rows.push(row);
  }
  return rows;
}

async function main() {
  await fs.mkdir(reportsDir, { recursive: true });
  await fs.mkdir(screenshotsDir, { recursive: true });
  const policy = await fetchRobots(origin);
  activeBrowser = await launchBrowser();
  const context = await activeBrowser.newContext({ viewport: viewports[0], deviceScaleFactor: 1, userAgent: "SIFCAS-UI-Auditor/1.0" });
  const blockedRequests: string[] = [];
  await context.route("**/*", async (route) => {
    const requestUrl = route.request().url();
    let allowed = false;
    try {
      const parsed = new URL(requestUrl);
      allowed = parsed.origin === origin && policy.allows(requestUrl) && ["GET", "HEAD"].includes(route.request().method());
    } catch {
      allowed = requestUrl.startsWith("data:") || requestUrl.startsWith("blob:");
    }
    if (allowed) {
      // A routed browser request may otherwise follow a redirect without calling the handler again.
      try {
        const response = await route.fetch({ maxRedirects: 0, timeout: 25_000 });
        if (response.status() >= 300 && response.status() < 400) {
          if (blockedRequests.length < 500) blockedRequests.push(`${requestUrl} (redirecionamento inesperado bloqueado)`);
          await route.abort("blockedbyclient");
        } else await route.fulfill({ response });
      } catch {
        await route.abort("failed");
      }
    } else {
      if (blockedRequests.length < 500) blockedRequests.push(requestUrl);
      await route.abort("blockedbyclient");
    }
  });

  const discoveryPage = await context.newPage();
  const discovered = await discoverRoutes(discoveryPage, seeds, origin, policy, maxRoutes);
  await discoveryPage.close();

  const routePages = discovered.records;
  const routeAudits = [];
  const responsiveEntries: Array<{ route: string; viewport: any }> = [];
  const geometryByViewport: Array<{ route: string; viewport: { width: number; height: number }; elements: any[] }> = [];
  const assetsByViewport: Array<{ route: string; viewport: { width: number; height: number }; assets: any[] }> = [];
  const accessibilityResults = [];
  const stateResults = [];
  const performanceResults = [];
  const mediaQueriesByRoute = [];

  for (const url of discovered.allowed) {
    for (const viewport of viewports) {
      const probe = await probePublicRoute(url, origin, policy);
      if (probe.outcome !== "ready") {
        routeAudits.push({ route: url, finalUrl: probe.finalUrl, viewport, status: probe.status, measured: false, errors: [probe.reason ?? probe.outcome] });
        continue;
      }
      const page = await context.newPage();
      await page.setViewportSize(viewport);
      const errors: string[] = [];
      page.on("pageerror", (error) => errors.push(error.message));
      let navigationStatus: number | null = null;
      try {
        const response = await page.goto(probe.finalUrl, { waitUntil: "domcontentloaded", timeout: 25_000 });
        navigationStatus = response?.status() ?? null;
        if (!policy.allows(page.url()) || navigationStatus === null || navigationStatus < 200 || navigationStatus >= 300) throw new Error(`Página final não pôde ser medida: ${page.url()} (HTTP ${navigationStatus ?? "N/D"})`);
        await page.evaluate(async () => {
          await document.fonts?.ready;
          await Promise.race([
            Promise.all(Array.from(document.images).map((image) => image.decode().catch(() => undefined))),
            new Promise((resolve) => setTimeout(resolve, 3_000)),
          ]);
        });
      } catch (error) {
        errors.push(error instanceof Error ? error.message : String(error));
        routeAudits.push({ route: url, finalUrl: page.url(), viewport, status: navigationStatus, measured: false, errors });
        await page.close();
        continue;
      }
      // Scripts can navigate after DOMContentLoaded; validate once more before reading the document.
      if (!policy.allows(page.url())) {
        routeAudits.push({ route: url, finalUrl: page.url(), viewport, status: navigationStatus, measured: false, errors: ["URL fora do escopo após carregar os recursos."] });
        await page.close();
        continue;
      }
      try {
        await page.addStyleTag({ content: "nextjs-portal { display: none !important; }" });
      } catch (error) {
        errors.push(`Could not hide the Next.js development indicator: ${error instanceof Error ? error.message : String(error)}`);
      }

      const viewportData = await extractViewport(page);
      const elements = await extractGeometry(page);
      const assets = await extractAssets(page);
      performanceResults.push({ route: url, viewport, ...(await extractPerformance(page)) });
      let screenshot = "";
      try {
        screenshot = await captureScreenshot(page, screenshotsDir, url, viewport);
      } catch (error) {
        errors.push(`Screenshot failed: ${error instanceof Error ? error.message : String(error)}`);
      }
      responsiveEntries.push({ route: url, viewport: viewportData });
      geometryByViewport.push({ route: url, viewport, elements });
      assetsByViewport.push({ route: url, viewport, assets });

      if (viewport.width === 375 && viewport.height === 812) {
        const accessibility = await auditAccessibility(page);
        accessibilityResults.push({ route: url, viewport, ...accessibility });
        stateResults.push({ route: url, viewport, ...(await inspectSafeStates(page)) });
        mediaQueriesByRoute.push({ route: url, ...(await extractMediaQueries(page)) });
      }
      routeAudits.push({
        route: url,
        finalUrl: page.url(),
        measured: true,
        viewport,
        status: navigationStatus,
        title: await page.title().catch(() => ""),
        screenshot: screenshot ? path.relative(project, screenshot) : null,
        errors,
        blockedResourceCount: blockedRequests.length,
        resourcePolicy: "Only same-origin resources explicitly allowed by this origin's robots.txt are loaded.",
      });
      await page.close();
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  }
  await activeBrowser.close();
  activeBrowser = null;

  const allElements = geometryByViewport.flatMap((entry) => entry.elements);
  const referenceData = await loadReferenceFiles();
  const referenceStatus = {
    json: !referenceJsonPath ? "not-provided" : referenceData.json === null ? "unreadable" : "provided-reference-only-not-verified",
    csv: !referenceCsvPath ? "not-provided" : referenceData.csv === null ? "unreadable" : "provided-reference-only-not-verified",
    note: "Supplied files were not promoted to live measurements.",
  };
  const csvRows = typeof referenceData.csv === "string" ? parseCsv(referenceData.csv) : [];
  const csvHeaders = csvRows[0] ?? [];
  const dashboardReferenceHints = csvRows.slice(1).map((row) => Object.fromEntries(csvHeaders.map((header, index) => [header.replace(/^\uFEFF/, ""), row[index] ?? ""])))
    .filter((record) => Object.values(record).some(Boolean));
  const previousJson = referenceData.json && typeof referenceData.json === "object" ? referenceData.json as Record<string, unknown> : null;
  const components = geometryByViewport.map((entry) => ({
    route: entry.route, viewport: entry.viewport, components: inventoryComponents(entry.elements),
  }));
  const assetResults = assetsByViewport.flatMap((entry) => entry.assets.map((asset) => ({ route: entry.route, viewport: entry.viewport, ...asset })));
  const assetMapping = matchAssetsToElements(allElements);
  const tokens = extractDesignTokens(allElements);
  const geometryFindings = findInconsistencies(responsiveEntries);
  const accessibilityFindings = accessibilityResults.flatMap((result: any) => [
    ...(result.violations ?? []).flatMap((violation: any) => violation.nodes.map((node: any) => ({
      source: "axe-core", severity: violation.impact ?? "unknown", kind: violation.id,
      description: violation.help, route: result.route, selector: node.target, evidence: node.summary,
    }))),
    ...(result.incomplete ?? []).map((item: any) => ({
      source: "axe-core", severity: item.impact ?? "unknown", kind: item.id,
      description: item.description, route: result.route, manualReviewRequired: true,
      evidence: `${item.nodes} nodes require manual review; not a confirmed violation.`,
    })),
  ]);
  const routeFindings = routePages.filter((route) => route.status !== null && route.status >= 400).map((route) => ({
    source: "route-discovery", severity: "medium", kind: "route-error", route: route.url,
    description: `HTTP ${route.status} on the allowed route candidate.`,
  }));
  const inconsistencies = [...geometryFindings, ...accessibilityFindings, ...routeFindings];
  const routesReport = {
    target: origin,
    generatedAt: new Date().toISOString(),
    context: auditContext,
    robots: { status: policy.status, rules: policy.rules, source: policy.source },
    routes: routePages,
    routeAudits,
    excludedByRobots: routePages.filter((route) => route.outcome !== "ready").map(({ url, path, finalUrl, outcome, reason }) => ({ url, path, finalUrl, outcome, reason: reason ?? "Rota não medida." })),
    authenticatedRoutes: { tested: false, reason: "No authorized session was supplied; no login or data-changing action was attempted." },
  };
  await writeJson("routes.json", routesReport);
  await writeJson("components.json", { source: "live DOM only", results: components, reference: referenceStatus, suppliedDashboardHints: dashboardReferenceHints });
  await writeJson("geometry.json", { source: "live DOM getBoundingClientRect/getComputedStyle", measurements: geometryByViewport });
  await writeJson("assets.json", { source: "live DOM img, svg image and CSS background URLs; inaccessible resources are not inferred", assets: assetResults });
  await writeJson("asset-mapping.json", { algorithm: "aspect ratio, resolution, crop estimate and transparency metadata", matches: assetMapping });
  await writeJson("responsive.json", { viewports, results: responsiveEntries, mediaQueriesByRoute, breakpoints: { values: mediaQueriesByRoute.flatMap((entry: any) => entry.queries), note: "Only queries observed in accessible CSSOM are listed; observed layout changes are not treated as CSS media-query proof." } });
  await writeJson("accessibility.json", { engine: "axe-core", results: accessibilityResults, states: stateResults, notes: "Only allowed public routes and the 375x812 viewport were tested." });
  await writeJson("performance.json", { lighthouse: { tested: false, reason: "Lighthouse has not been run for this collection; browser Performance APIs are recorded separately and are not production benchmarks." }, results: performanceResults, inp: "N/D (sem dados de interação real)" });
  await writeJson("design-tokens.json", tokens);
  await writeJson("inconsistencies.json", { findings: inconsistencies, classification: "observed geometry only; no inferred visual failures" });
  await writeJson("reference-inputs.json", {
    ...referenceStatus,
    jsonSummary: previousJson ? {
      status: previousJson.status ?? "N/D",
      scope: previousJson.scope ?? "N/D",
      routes: previousJson.routes ?? [],
      themes: previousJson.themes ?? [],
      note: "Copiado como contexto do relatório fornecido; não validado por esta execução.",
    } : null,
    dashboardHints: dashboardReferenceHints,
  });
  await fs.writeFile(path.join(reportsDir, "tokens.json"), `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
  const observedTokens = tokens.observed as Record<string, Array<{ value: string; occurrences: number }>>;
  const cssLines = [":root {"];
  for (const [property, values] of Object.entries(observedTokens)) {
    for (const [index, token] of values.slice(0, 12).entries()) {
      const name = `--sifcas-observed-${property.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`)}-${index + 1}`;
      cssLines.push(`  ${name}: ${token.value};`);
    }
  }
  cssLines.push("}");
  await fs.writeFile(path.join(reportsDir, "tokens.css"), `${cssLines.join("\n")}\n`, "utf8");
  await fs.writeFile(path.join(reportsDir, "tokens.ts"), `export const observedDesignTokens = ${JSON.stringify(tokens.observed, null, 2)} as const;\n`, "utf8");

  const excluded = routesReport.excludedByRobots.map((route) => `- ${route.url} — ${route.reason}`).join("\n") || "- Nenhuma rota inicial bloqueada.";
  const allowedSummary = routePages.filter((route) => route.outcome === "ready").map((route) => `- ${route.url}${route.finalUrl !== route.url ? ` → ${route.finalUrl}` : ""} — HTTP ${route.status ?? "N/D"} — ${route.title || "sem título"}`).join("\n") || "- Nenhuma rota foi medida.";
  const confirmedAxeCount = accessibilityFindings.filter((item: any) => item.source === "axe-core" && !item.manualReviewRequired).length;
  const manualAxeCount = accessibilityFindings.filter((item: any) => item.manualReviewRequired).length;
  const severityOrder: Record<string, number> = { critical: 0, serious: 1, high: 2, medium: 3, moderate: 4, low: 5, minor: 6 };
  const topFindings = [...inconsistencies].sort((a: any, b: any) =>
    (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9),
  ).slice(0, 10);
  const measuredCount = routeAudits.filter((audit) => audit.measured !== false).length;
  const summary = `# SIFCAS — resumo da auditoria

Gerado em ${routesReport.generatedAt}.

## Limites de coleta

${auditContext} A leitura de robots.txt precedeu a navegação. Redirecionamentos HTTP foram verificados antes de visitar cada destino; falhas e páginas fora do escopo não foram medidas. Nenhum formulário foi enviado. Referências externas são contexto, não medições.

## Rotas permitidas e verificadas

${allowedSummary}

## Candidatas excluídas

${excluded}

## Resultados

- Viewports configurados: ${viewports.map(({ width, height }) => `${width}×${height}`).join(", ")}.
- Capturas/medições realizadas: ${measuredCount} combinações de rota e viewport.
- Tentativas descartadas durante a medição: ${routeAudits.length - measuredCount}.
- Verificações axe-core: ${accessibilityResults.length}; violações automatizadas por elemento: ${confirmedAxeCount}; itens para revisão manual: ${manualAxeCount}.
- Overflow horizontal observado: ${geometryFindings.filter((item: any) => item.kind === "horizontal-overflow").length}.
- Performance: APIs do Chromium local; Lighthouse executado separadamente; métricas de campo e INP N/D.
- Rotas autenticadas: não testadas; nenhuma sessão autorizada fornecida.

## Achados prioritários

${topFindings.map((item: any, index) => `${index + 1}. ${String(item.severity).toUpperCase()} — ${item.kind} (${item.route ?? "rota N/D"}): ${item.description ?? item.evidence ?? "ver JSON"}${item.manualReviewRequired ? " Revisão manual; não é uma violação confirmada." : ""}`).join("\n") || "Nenhum achado confirmado."}

Consulte [full-audit.md](./full-audit.md) e os JSON. Valores indisponíveis permanecem N/D.
`;
  await fs.writeFile(path.join(reportsDir, "executive-summary.md"), summary, "utf8");
  const full = `${summary}
## Política de robots

\`\`\`
${policy.source.trim()}
\`\`\`

## Requisições de recursos bloqueados

${[...new Set(blockedRequests)].slice(0, 50).map((request) => `- ${request}`).join("\n") || "- Nenhum recurso foi bloqueado."}

Recursos externos são bloqueados pela política de mesma origem da ferramenta. Isso não significa que o robots.txt desses hosts foi consultado.

## Referências

${JSON.stringify(referenceStatus, null, 2)}

## Consistência e escopo

As medidas refletem apenas documentos válidos e os recursos carregados nesta execução. Não foram inferidos breakpoints, dados ausentes ou falhas visuais a partir de referências externas.
`;
  await fs.writeFile(path.join(reportsDir, "full-audit.md"), full, "utf8");
  console.log(`Auditoria concluída: ${measuredCount} combinações medidas; ${routeAudits.length - measuredCount} descartadas; ${routePages.length} rotas candidatas.`);
  console.log(`Relatórios: ${reportsDir}`);
}

main().catch(async (error) => {
  console.error(error);
  if (activeBrowser) {
    try {
      await activeBrowser.close();
    } catch (closeError) {
      console.error("Could not close the browser after the audit failed:", closeError);
    }
  }
  process.exitCode = 1;
});
