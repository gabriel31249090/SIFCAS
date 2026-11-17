import type { Page } from "playwright";

export async function extractAssets(page: Page) {
  return page.evaluate(() => {
    const records: Array<Record<string, unknown>> = [];
    for (const image of Array.from(document.images)) {
      const rect = image.getBoundingClientRect();
      records.push({
        kind: "img",
        url: image.currentSrc || image.src,
        alt: image.alt,
        intrinsic: { width: image.naturalWidth || null, height: image.naturalHeight || null },
        rendered: { width: rect.width, height: rect.height },
        complete: image.complete,
        alpha: "N/D (não inferido pelo navegador)",
      });
    }
    for (const image of Array.from(document.querySelectorAll("svg image"))) {
      const rect = image.getBoundingClientRect();
      records.push({
        kind: "svg-image",
        url: image.getAttribute("href") || image.getAttributeNS("http://www.w3.org/1999/xlink", "href"),
        intrinsic: {
          width: Number(image.getAttribute("width")) || null,
          height: Number(image.getAttribute("height")) || null,
        },
        rendered: { width: rect.width, height: rect.height },
        alpha: "not determined",
      });
    }
    for (const element of Array.from(document.querySelectorAll<HTMLElement>("body *"))) {
      const backgroundImage = getComputedStyle(element).backgroundImage;
      if (!backgroundImage || backgroundImage === "none") continue;
      for (const match of backgroundImage.matchAll(/url\((["']?)(.*?)\1\)/g)) {
        const rect = element.getBoundingClientRect();
        records.push({
          kind: "css-background",
          url: match[2],
          selector: element.id ? `#${CSS.escape(element.id)}` : element.tagName.toLowerCase(),
          backgroundSize: getComputedStyle(element).backgroundSize,
          backgroundPosition: getComputedStyle(element).backgroundPosition,
          rendered: { width: rect.width, height: rect.height },
          intrinsic: { width: null, height: null },
          alpha: "not determined",
        });
      }
    }
    return records;
  });
}
