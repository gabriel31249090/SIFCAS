type GeometryElement = {
  selector: string; tagName: string; classList: string[]; visible: boolean;
  geometry: { width: number; height: number; aspectRatio: number | null };
  computed: Record<string, string>;
};

const groups = [
  { category: "buttons", selector: "button, input[type=button|submit|reset], .btn", test: (item: GeometryElement) => item.tagName === "button" || /(^|\\s)btn(\\s|$)/.test(item.classList.join(" ")) || item.classList.includes("button") },
  { category: "links", selector: "a[href]", test: (item: GeometryElement) => item.tagName === "a" },
  { category: "forms", selector: "input, textarea, select", test: (item: GeometryElement) => ["input", "textarea", "select"].includes(item.tagName) },
  { category: "navigation", selector: "nav, [role=navigation]", test: (item: GeometryElement) => item.tagName === "nav" || item.classList.includes("navbar") },
  { category: "sidebars", selector: "aside, [class*=sidebar]", test: (item: GeometryElement) => item.tagName === "aside" || item.classList.some((name) => name.includes("sidebar")) },
  { category: "cards", selector: "article, [class*=card], [class*=panel]", test: (item: GeometryElement) => item.tagName === "article" || item.classList.some((name) => /card|panel/.test(name)) },
  { category: "banners/heroes", selector: "[class*=banner], [class*=hero]", test: (item: GeometryElement) => item.classList.some((name) => /banner|hero/.test(name)) },
  { category: "avatars/frames", selector: "[class*=avatar], [class*=frame]", test: (item: GeometryElement) => item.classList.some((name) => /avatar|frame/.test(name)) },
  { category: "tables", selector: "table", test: (item: GeometryElement) => item.tagName === "table" },
  { category: "dialogs", selector: "[role=dialog], dialog, [class*=modal]", test: (item: GeometryElement) => item.tagName === "dialog" || item.classList.some((name) => name.includes("modal")) || item.computed.display === "dialog" },
  { category: "tabs", selector: "[role=tab], [class*=tab]", test: (item: GeometryElement) => item.classList.some((name) => name.includes("tab")) },
];

export function inventoryComponents(elements: GeometryElement[]) {
  return groups.flatMap(({ category, selector, test }) => {
    const matches = elements.filter(test);
    if (!matches.length) return [];
    const widths = matches.map((item) => item.geometry.width);
    const heights = matches.map((item) => item.geometry.height);
    return [{
      category,
      selector,
      occurrences: matches.length,
      observed: true,
      min: { width: Math.min(...widths), height: Math.min(...heights) },
      max: { width: Math.max(...widths), height: Math.max(...heights) },
      visibleCount: matches.filter((item) => item.visible).length,
      examples: matches.slice(0, 25),
    }];
  });
}
