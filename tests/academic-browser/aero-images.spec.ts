import { expect, test } from "@playwright/test";
import fs from "node:fs/promises";

test("Aero gallery renders local cropped images and preserves selected artwork across reloads", async ({ page, context }) => {
  const response = await context.request.get("http://127.0.0.1:54331/__fixture/session?actor=student");
  const fixture = await response.json();
  expect(fixture.synthetic).toBe(true);
  await context.addCookies([fixture.cookie]);
  const images = new Map<string, number>();
  const transfers: Promise<void>[] = [];
  page.on("response", (resource) => {
    // Revalidation responses (304) contain no image body to count again.
    if (resource.status() !== 200 || !new URL(resource.url()).pathname.startsWith("/assets/aero/")) return;
    transfers.push(resource.body().then((body) => { images.set(new URL(resource.url()).pathname, body.length); }));
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/personalizacao");
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  for (const category of ["Cenários", "Avatares", "Faixas", "Molduras", "Botões", "Adesivos"]) {
    await page.getByRole("tab", { name: category, exact: true }).click();
    const gallery = page.locator(".aeroAssetThumb img");
    expect(await gallery.count()).toBeGreaterThanOrEqual(10);
    for (const image of [gallery.first(), gallery.last()]) {
      await image.scrollIntoViewIfNeeded();
      await expect(image).toHaveAttribute("src", /\/optimized\/asset-[a-z]+-\d+-thumb\.webp$/);
      await expect(image).toHaveAttribute("loading", "lazy");
      await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0)).toBe(true);
    }
  }
  await page.getByRole("tab", { name: "Cenários", exact: true }).click();
  await page.getByRole("button", { name: "Cenário Aquário de vidro Frutiger Aero", exact: true }).click();
  await expect(page.locator(".experienceArtworkWallpaper img").first()).toHaveAttribute("src", /asset-landscape-2\.webp$/);
  await page.reload();
  await expect(page.locator("html")).toHaveAttribute("data-experience-wallpaper", "asset-landscape-2");
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  await expect(page.getByRole("button", { name: "Cenário Aquário de vidro Frutiger Aero", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.screenshot({ path: "test-results/aero-gallery-optimized.png", fullPage: true });
  await Promise.all(transfers);
  expect(images.size).toBeGreaterThan(5);
  expect([...images.keys()].every((url) => url.includes("/optimized/") && url.endsWith(".webp"))).toBe(true);
  await fs.mkdir("tools/sifcas-ui-auditor/evidence/2026-11-12", { recursive: true });
  await fs.writeFile("tools/sifcas-ui-auditor/evidence/2026-11-12/aero-image-network.json", `${JSON.stringify({
    generatedAt: new Date().toISOString(), context: "Navegação local com conta sintética; seis categorias e recarregamento de escolha. Tamanhos são corpos HTTP das imagens Aero, sem headers; sem extrapolar para o domínio publicado.",
    originalSheetsRequested: 0, uniqueImages: images.size, bytes: [...images.values()].reduce((sum, bytes) => sum + bytes, 0), images: Object.fromEntries(images),
  }, null, 2)}\n`);
});
