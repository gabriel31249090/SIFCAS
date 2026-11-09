import { collectTokenValues } from "../extractors/typography.ts";
import { extractColorInventory } from "../extractors/colors.ts";

export function extractDesignTokens(elements: Array<{ computed?: Record<string, string> }>) {
  return {
    observed: collectTokenValues(elements),
    colorInventory: extractColorInventory(elements),
    documented: {
      fontFamily: { value: "Open Sans", evidence: "supplied partial report; not verified against live DOM" },
      iconFamily: { value: "Font Awesome", evidence: "supplied partial report; not verified against live DOM" },
      paletteFamilies: {
        value: ["Primary", "Grey", "Info", "Warning", "Caution", "Danger", "Success", "Violet", "Lime", "Pink", "Cyan", "Brown", "Steel"],
        evidence: "supplied partial report; hex values not provided",
      },
    },
    suggested: {
      spacing: ["4px", "8px", "12px", "16px", "24px", "32px"],
      pointerTarget: "24x24 CSS px minimum criterion subject to WCAG exceptions; 44x44 px ergonomic recommendation",
      evidence: "recommendation, not an observed token",
    },
  };
}
