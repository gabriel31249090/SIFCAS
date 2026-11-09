import path from "node:path";
import { createHash } from "node:crypto";
import type { Page } from "playwright";

export function routeSlug(url: string) {
  const parsed = new URL(url);
  const pathname = parsed.pathname;
  const slug = pathname.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "") || "root";
  return parsed.search ? `${slug}-${createHash("sha256").update(parsed.search).digest("hex").slice(0, 8)}` : slug;
}

export async function captureScreenshot(page: Page, directory: string, url: string, viewport: { width: number; height: number }) {
  const file = path.join(directory, `${routeSlug(url)}-${viewport.width}x${viewport.height}.png`);
  await page.screenshot({ path: file, fullPage: true, animations: "disabled", timeout: 20_000 });
  return file;
}
