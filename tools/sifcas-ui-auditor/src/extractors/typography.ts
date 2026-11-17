export const tokenProperties = [
  "color", "backgroundColor", "fontFamily", "fontSize", "fontWeight", "lineHeight",
  "letterSpacing", "borderRadius", "boxShadow", "gap", "paddingTop", "marginTop",
] as const;

export function collectTokenValues(elements: Array<{ computed?: Record<string, string> }>) {
  const values = Object.fromEntries(tokenProperties.map((property) => [property, new Map<string, number>()]));
  for (const element of elements) {
    for (const property of tokenProperties) {
      const value = element.computed?.[property];
      if (!value || value === "normal" || value === "none" || value === "0px") continue;
      const map = values[property];
      map.set(value, (map.get(value) ?? 0) + 1);
    }
  }
  return Object.fromEntries(Object.entries(values).map(([property, map]) => [
    property,
    [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 40).map(([value, occurrences]) => ({ value, occurrences, evidence: "computed-dom" })),
  ]));
}
