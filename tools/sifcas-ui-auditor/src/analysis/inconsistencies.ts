export function findInconsistencies(responsive: Array<{ route: string; viewport: { width: number; height: number; horizontalOverflow: boolean; clippedElements: unknown[] } }>) {
  return responsive.flatMap((entry) => {
    const issues = [];
    if (entry.viewport.horizontalOverflow) issues.push({ severity: "medium", kind: "horizontal-overflow", evidence: "document scroll width exceeds viewport width" });
    if (entry.viewport.clippedElements.length) issues.push({ severity: "low", kind: "offscreen-elements", count: entry.viewport.clippedElements.length, evidence: "visible boxes extend beyond viewport bounds" });
    return issues.map((issue) => ({ route: entry.route, viewport: `${entry.viewport.width}x${entry.viewport.height}`, ...issue }));
  });
}
