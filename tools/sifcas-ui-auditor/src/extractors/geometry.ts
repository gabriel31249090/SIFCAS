import type { Page } from "playwright";

export const geometrySelectors = [
  "button", "a", "input", "textarea", "select", "[role]", "img", "svg",
  "nav", "aside", "header", "footer", "main", "section", "article", "table",
  "[class*='card']", "[class*='banner']", "[class*='hero']", "[class*='avatar']",
  "[class*='modal']", "[class*='toast']", "[class*='tab']", "[class*='dropdown']",
].join(",");

export async function extractGeometry(page: Page) {
  return page.evaluate((selector) => {
    const values = Array.from(document.querySelectorAll<HTMLElement>(selector)).slice(0, 4000);
    const uniqueSelector = (element: HTMLElement): string => {
      if (element.id) return `#${CSS.escape(element.id)}`;
      const testId = element.getAttribute("data-testid");
      if (testId) return `[data-testid="${CSS.escape(testId)}"]`;
      const classes = Array.from(element.classList).slice(0, 3);
      const base = `${element.tagName.toLowerCase()}${classes.map((name) => `.${CSS.escape(name)}`).join("")}`;
      if (document.querySelectorAll(base).length === 1) return base;
      const parent = element.parentElement;
      if (!parent) return base;
      return `${uniqueSelector(parent)} > ${base}:nth-child(${Array.from(parent.children).indexOf(element) + 1})`;
    };
    const properties = [
      "display", "position", "flexDirection", "flexWrap", "justifyContent", "alignItems", "gap",
      "gridTemplateColumns", "gridTemplateRows", "zIndex", "overflow", "objectFit", "objectPosition",
      "fontFamily", "fontSize", "fontWeight", "lineHeight", "letterSpacing", "textAlign",
      "textTransform", "textDecoration", "whiteSpace", "backgroundColor", "backgroundImage",
      "color", "borderColor", "borderRadius", "boxShadow", "opacity", "filter",
      "backdropFilter", "transform", "transitionDuration", "transitionTimingFunction", "boxSizing",
      "marginTop", "marginRight", "marginBottom", "marginLeft", "paddingTop", "paddingRight",
      "paddingBottom", "paddingLeft", "borderTopWidth", "borderRightWidth", "borderBottomWidth", "borderLeftWidth",
    ] as const;
    return values.map((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      const computed = Object.fromEntries(properties.map((property) => [property, style[property]]));
      const image = element instanceof HTMLImageElement ? {
        currentSrc: element.currentSrc,
        naturalWidth: element.naturalWidth,
        naturalHeight: element.naturalHeight,
        renderedWidth: rect.width,
        renderedHeight: rect.height,
        complete: element.complete,
        alt: element.alt,
      } : null;
      return {
        selector: uniqueSelector(element),
        tagName: element.tagName.toLowerCase(),
        id: element.id || null,
        classList: Array.from(element.classList),
        role: element.getAttribute("role"),
        ariaLabel: element.getAttribute("aria-label"),
        ariaDescribedBy: element.getAttribute("aria-describedby"),
        alt: element.getAttribute("alt"),
        title: element.getAttribute("title"),
        tabIndex: element.tabIndex,
        disabled: "disabled" in element ? Boolean((element as HTMLButtonElement).disabled) : null,
        text: (element.innerText || "").trim().slice(0, 180),
        visible: rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" && style.display !== "none",
        geometry: {
          width: rect.width, height: rect.height, x: rect.x, y: rect.y, top: rect.top, right: rect.right,
          bottom: rect.bottom, left: rect.left, offsetWidth: element.offsetWidth, offsetHeight: element.offsetHeight,
          clientWidth: element.clientWidth, clientHeight: element.clientHeight, scrollWidth: element.scrollWidth,
          scrollHeight: element.scrollHeight, aspectRatio: rect.height ? rect.width / rect.height : null,
        },
        box: {
          marginTop: style.marginTop, marginRight: style.marginRight, marginBottom: style.marginBottom,
          marginLeft: style.marginLeft, paddingTop: style.paddingTop, paddingRight: style.paddingRight,
          paddingBottom: style.paddingBottom, paddingLeft: style.paddingLeft,
          borderWidth: style.borderWidth, borderRadius: style.borderRadius, boxSizing: style.boxSizing,
        },
        computed,
        image,
      };
    });
  }, geometrySelectors);
}

export async function extractViewport(page: Page) {
  return page.evaluate(() => {
    const viewportWidth = document.documentElement.clientWidth;
    const viewportHeight = document.documentElement.clientHeight;
    const elements = Array.from(document.querySelectorAll<HTMLElement>("body *"));
    const clipped = elements.filter((element) => {
      const rect = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return rect.width > 0 && rect.height > 0 && style.visibility !== "hidden" &&
        (rect.left < -1 || rect.right > viewportWidth + 1);
    }).slice(0, 100);
    return {
      width: innerWidth, height: innerHeight, devicePixelRatio,
      documentWidth: document.documentElement.scrollWidth,
      documentHeight: document.documentElement.scrollHeight,
      horizontalOverflow: document.documentElement.scrollWidth > innerWidth,
      clippedElements: clipped.map((element) => ({
        tag: element.tagName.toLowerCase(),
        id: element.id || null,
        className: typeof element.className === "string" ? element.className : "",
        left: element.getBoundingClientRect().left,
        right: element.getBoundingClientRect().right,
      })),
      hiddenCount: elements.filter((element) => {
        const style = getComputedStyle(element);
        return style.display === "none" || style.visibility === "hidden";
      }).length,
    };
  });
}
