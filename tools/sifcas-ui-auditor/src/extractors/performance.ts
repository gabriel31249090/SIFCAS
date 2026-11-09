import type { Page } from "playwright";

export async function extractPerformance(page: Page) {
  return page.evaluate(async () => {
    let lcp: number | null = null;
    let cls = 0;
    let longTaskMs = 0;
    const observers: PerformanceObserver[] = [];
    const observe = (type: string, callback: (entry: PerformanceEntry) => void) => {
      try {
        const observer = new PerformanceObserver((list) => list.getEntries().forEach(callback));
        observer.observe({ type, buffered: true });
        observers.push(observer);
      } catch {
        return;
      }
    };
    observe("largest-contentful-paint", (entry) => { lcp = entry.startTime; });
    observe("layout-shift", (entry) => {
      const shift = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
      if (!shift.hadRecentInput) cls += shift.value ?? 0;
    });
    observe("longtask", (entry) => { longTaskMs += Math.max(0, entry.duration - 50); });
    await new Promise((resolve) => setTimeout(resolve, 50));
    observers.forEach((observer) => observer.disconnect());
    const navigation = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
    const resources = performance.getEntriesByType("resource") as PerformanceResourceTiming[];
    return {
      lcpMs: lcp === null ? "N/D" : Math.round(lcp),
      cls: Math.round(cls * 1000) / 1000,
      inp: "N/D (sem interações representativas)",
      totalBlockingTimeMs: Math.round(longTaskMs),
      navigation: navigation ? {
        responseStartMs: Math.round(navigation.responseStart),
        domContentLoadedMs: Math.round(navigation.domContentLoadedEventEnd),
        loadMs: navigation.loadEventEnd > 0 ? Math.round(navigation.loadEventEnd) : "N/D",
        transferSizeBytes: navigation.transferSize || "N/D",
      } : "N/D",
      resourceBytes: resources.reduce((sum, resource) => sum + resource.transferSize, 0) || "N/D",
      resourceCount: resources.length,
      measurement: "Performance APIs em Chromium local; não equivale a Lighthouse nem a dados de campo.",
    };
  });
}
