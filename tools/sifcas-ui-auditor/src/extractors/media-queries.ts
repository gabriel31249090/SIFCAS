import type { Page } from "playwright";

export async function extractMediaQueries(page: Page) {
  return page.evaluate(() => {
    const queries = new Set<string>();
    const inaccessible: string[] = [];
    const visit = (rules: CSSRuleList) => {
      for (const rule of Array.from(rules)) {
        if (rule instanceof CSSMediaRule) {
          queries.add(rule.conditionText);
          visit(rule.cssRules);
        } else if ("cssRules" in rule) {
          try {
            visit((rule as CSSGroupingRule).cssRules);
          } catch {
            continue;
          }
        }
      }
    };
    for (const sheet of Array.from(document.styleSheets)) {
      try {
        if (sheet.cssRules) visit(sheet.cssRules);
      } catch {
        inaccessible.push(sheet.href ?? "inline stylesheet");
      }
    }
    return {
      queries: [...queries].sort(),
      inaccessibleStylesheets: inaccessible,
      evidence: "CSSOM accessible on the measured page only; observed layout changes are reported separately.",
    };
  });
}
