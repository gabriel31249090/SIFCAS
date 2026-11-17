import { createRequire } from "node:module";
import type { Page } from "playwright";

const require = createRequire(import.meta.url);
const axeSource = require("axe-core").source as string;

declare global {
  interface Window {
    axe: { run: (options?: unknown) => Promise<any> };
  }
}

export async function auditAccessibility(page: Page) {
  try {
    await page.addScriptTag({ content: axeSource });
    return await page.evaluate(async () => {
      const result = await window.axe.run({
        runOnly: { type: "tag", values: ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"] },
      });
      return {
        engine: "axe-core",
        violations: result.violations.map(({ id, impact, description, help, helpUrl, nodes }: any) => ({
          id, impact, description, help, helpUrl,
          nodes: nodes.map((node: any) => ({ target: node.target, summary: node.failureSummary, html: node.html })),
        })),
        passes: result.passes.length,
        incomplete: result.incomplete.map(({ id, impact, description, nodes }: any) => ({ id, impact, description, nodes: nodes.length })),
        inapplicable: result.inapplicable.length,
        tested: true,
      };
    });
  } catch (error) {
    return { engine: "axe-core", tested: false, error: error instanceof Error ? error.message : String(error), violations: [], passes: 0, incomplete: [], inapplicable: 0 };
  }
}
