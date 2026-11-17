import type { Page } from "playwright";

export async function inspectSafeStates(page: Page) {
  const targets = await page.locator("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])").evaluateAll((elements) =>
    elements.slice(0, 40).map((element) => ({
      selector: element.id ? `#${CSS.escape(element.id)}` : element.tagName.toLowerCase(),
      tag: element.tagName.toLowerCase(),
      label: element.getAttribute("aria-label") || (element as HTMLElement).innerText?.trim().slice(0, 100) || "",
    })),
  );
  const states = [];
  for (let index = 0; index < targets.length; index += 1) {
    const locator = page.locator("button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled])").nth(index);
    try {
      await locator.hover({ timeout: 800 });
      const hover = await locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return { backgroundColor: style.backgroundColor, color: style.color, boxShadow: style.boxShadow, outline: style.outline };
      });
      await locator.focus({ timeout: 800 });
      const focus = await locator.evaluate((element) => {
        const style = getComputedStyle(element);
        return { backgroundColor: style.backgroundColor, color: style.color, boxShadow: style.boxShadow, outline: style.outline };
      });
      states.push({ ...targets[index], hover, focus, active: "N/D (nenhuma ação ativada)" });
    } catch {
      states.push({ ...targets[index], hover: null, focus: null, active: "não capturado" });
    }
  }
  return { tested: targets.length > 0, count: states.length, states };
}
