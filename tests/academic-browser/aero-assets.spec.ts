import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";

async function actor(context: BrowserContext, name = "student") {
  const response = await context.request.get(`http://127.0.0.1:54331/__fixture/session?actor=${name}`);
  expect(response.ok()).toBeTruthy();
  const fixture = await response.json();
  expect(fixture.synthetic).toBe(true);
  await context.clearCookies();
  await context.addCookies([fixture.cookie]);
}

async function collection(page: Page) {
  await page.goto("/personalizacao");
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  await expect(page.getByRole("tablist", { name: "Categorias da coleção Aero", exact: true })).toBeVisible();
}

async function category(page: Page, name: string) {
  const tab = page.getByRole("tablist", { name: "Categorias da coleção Aero", exact: true }).getByRole("tab", { name, exact: true });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

async function artwork(image: Locator, asset: string, thumbnail = false) {
  await expect(image).toHaveAttribute("src", `/assets/aero/optimized/${asset}${thumbnail ? "-thumb" : ""}.webp`);
  await expect(image).toHaveAttribute("alt", "");
  await expect(image).toHaveAttribute("aria-hidden", "true");
  await image.scrollIntoViewIfNeeded();
  await expect(image).toBeVisible();
  await expect.poll(() => image.evaluate((element: HTMLImageElement) => element.complete && element.naturalWidth > 0 && element.naturalHeight > 0)).toBe(true);
}

test("local scenery persists and displays the selected WebP crop in IFOS", async ({ page, context }) => {
  await actor(context, "admin");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const source = await context.request.get("/assets/aero/optimized/asset-landscape-2.webp");
  expect(source.ok()).toBeTruthy();
  expect(source.headers()["content-type"]).toMatch(/^image\/webp/);

  await collection(page);
  // Pick a different crop from the default so persistence cannot pass accidentally.
  const scenery = page.getByRole("button", { name: "Cenário Aquário de vidro Frutiger Aero", exact: true });
  await artwork(scenery.locator("img"), "asset-landscape-2", true);
  await expect(scenery.locator("img")).toHaveAttribute("loading", "lazy");
  await scenery.click();
  await expect(scenery).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".aeroAssetGrid button[aria-pressed='true']")).toHaveCount(1);
  await page.reload();
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  await expect(scenery).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-experience-wallpaper", "asset-landscape-2");

  await page.goto("/ifos");
  const desktop = page.getByRole("main", { name: "IFOS, área de trabalho do SIFCAS", exact: true });
  await expect(desktop).toBeVisible();
  const wallpaper = desktop.locator(".experienceArtworkWallpaper img");
  await artwork(wallpaper, "asset-landscape-2");
  expect(await wallpaper.evaluate((image: HTMLImageElement) => [image.naturalWidth, image.naturalHeight])).toEqual([386, 386]);
  await page.screenshot({ path: "test-results/aero-assets-ifos.png", fullPage: true });
  await collection(page);
  await page.getByRole("button", { name: "Usar cenário padrão", exact: true }).click();
  await expect(page.getByRole("button", { name: "Usar cenário padrão", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator("html")).toHaveAttribute("data-experience-wallpaper", "sky");
  await page.goto("/ifos");
  await expect(page.locator("html")).toHaveAttribute("data-experience-wallpaper", "sky");
  await expect(desktop.locator(".experienceArtworkWallpaper")).toHaveCount(0);
});

test("avatar, profile art, button skin and desktop sticker stay with their account", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await collection(page);
  for (const [tab, name] of [
    ["Avatares", "Avatar Água viva Frutiger Aero"], ["Faixas", "Faixa Janela no jardim Frutiger Aero"], ["Molduras", "Moldura Estrelas de prata Frutiger Aero"],
    ["Botões", "Botão Cromo azul Y2K"], ["Adesivos", "Adesivo Nota musical Frutiger Aero"],
  ]) {
    await category(page, tab);
    const choice = page.getByRole("button", { name, exact: true });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
  }

  await page.goto("/perfil");
  const avatar = page.locator(".topbar [data-experience-avatar]");
  const identity = page.locator(".profileIdentity").filter({ visible: true });
  await expect(identity).toHaveCount(1);
  await expect(avatar).toHaveCSS("background-image", /\/optimized\/asset-glass-2\.webp/);
  await artwork(identity.locator(".experienceArtworkBanner img"), "asset-banner-2");
  await expect(identity.locator(".experiencePortrait.hasArtFrame")).toBeVisible();
  await artwork(identity.locator(".experiencePortrait > img"), "asset-frame-2");
  await expect(page.locator("html")).toHaveAttribute("data-experience-button-skin", "asset-button-2");
  await expect.poll(() => page.getByRole("button", { name: "Salvar alterações", exact: true }).evaluate((element) => getComputedStyle(element, "::after").backgroundImage)).toMatch(/\/optimized\/asset-button-2\.webp/);
  await page.screenshot({ path: "test-results/aero-assets-profile.png", fullPage: true });
  await page.goto("/ifos");
  await artwork(page.locator(".experienceDesktopSticker img"), "asset-sticker-2");
  await page.getByRole("button", { name: "Abrir menu de aplicativos", exact: true }).click();
  await expect(page.locator(".osMenuAvatar")).toHaveCSS("background-image", /\/optimized\/asset-glass-2\.webp/);

  await actor(context, "otherStudent");
  await page.goto("/perfil");
  await expect(avatar).toHaveCSS("background-image", /\/optimized\/asset-glass-1\.webp/);
  await artwork(identity.locator(".experienceArtworkBanner img"), "asset-banner-1");
  await artwork(identity.locator(".experiencePortrait > img"), "asset-frame-1");
  await expect(page.locator("html")).toHaveAttribute("data-experience-button-skin", "asset-button-1");
  await actor(context);
  await page.goto("/perfil");
  await expect(avatar).toHaveCSS("background-image", /\/optimized\/asset-glass-2\.webp/);
  await artwork(identity.locator(".experienceArtworkBanner img"), "asset-banner-2");
  await artwork(identity.locator(".experiencePortrait > img"), "asset-frame-2");
  await expect(page.locator("html")).toHaveAttribute("data-experience-button-skin", "asset-button-2");
  await page.goto("/ifos");
  await artwork(page.locator(".experienceDesktopSticker img"), "asset-sticker-2");
});

test("collection fits a narrow screen, supports keyboard categories and resets a chosen avatar", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await collection(page);
  const tabs = page.getByRole("tablist", { name: "Categorias da coleção Aero", exact: true });
  await tabs.getByRole("tab", { name: /^Cenários/ }).focus();
  await page.keyboard.press("End");
  await expect(tabs.getByRole("tab", { name: /^Adesivos/ })).toBeFocused();
  await expect(tabs.getByRole("tab", { name: /^Adesivos/ })).toHaveAttribute("aria-selected", "true");
  await page.keyboard.press("Home");
  await expect(tabs.getByRole("tab", { name: /^Cenários/ })).toBeFocused();
  await category(page, "Avatares");
  const chosenAvatar = page.getByRole("button", { name: "Avatar Céu azul Frutiger Aero", exact: true });
  await chosenAvatar.focus();
  await page.keyboard.press("Enter");
  await expect(chosenAvatar).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
  const photo = await page.evaluate(() => {
    const canvas = document.createElement("canvas");
    canvas.width = 2; canvas.height = 2;
    const paint = canvas.getContext("2d");
    if (!paint) throw new Error("Canvas indisponível no cenário de teste.");
    paint.fillStyle = "#25aec7"; paint.fillRect(0, 0, 2, 2);
    return canvas.toDataURL("image/png").split(",")[1];
  });
  await page.getByLabel("Foto de perfil", { exact: true }).setInputFiles({ name: "foto-sintetica.png", mimeType: "image/png", buffer: Buffer.from(photo, "base64") });
  await expect(page.locator(".topbar [data-experience-avatar]")).toHaveCSS("background-image", /data:image\/png/);
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  await category(page, "Avatares");
  await expect(chosenAvatar).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Usar minhas iniciais", exact: true }).click();
  await expect(chosenAvatar).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Usar minhas iniciais", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".topbar [data-experience-avatar]")).not.toHaveCSS("background-image", /data:image|\/optimized\/asset-/);
  await page.reload();
  await expect(page.locator(".topbar [data-experience-avatar]")).not.toHaveCSS("background-image", /data:image|\/optimized\/asset-/);
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  await category(page, "Avatares");
  await expect(page.getByRole("button", { name: "Usar minhas iniciais", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/aero-assets-mobile.png", fullPage: true });
});
