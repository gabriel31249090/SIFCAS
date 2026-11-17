export function extractColorInventory(elements: Array<{ computed?: Record<string, string> }>) {
  const counts = new Map<string, number>();
  for (const element of elements) {
    for (const key of ["color", "backgroundColor", "borderColor"] as const) {
      const value = element.computed?.[key];
      if (!value || value === "rgba(0, 0, 0, 0)") continue;
      counts.set(value, (counts.get(value) ?? 0) + 1);
    }
  }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 100)
    .map(([value, occurrences]) => ({ value, occurrences, evidence: "computed-dom", contrast: "not inferred" }));
}
