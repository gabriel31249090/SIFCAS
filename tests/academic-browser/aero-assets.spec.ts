import { expect, test, type BrowserContext, type Page } from "@playwright/test";

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
  const tab = page.getByRole("tablist", { name: "Categorias da coleção Aero", exact: true }).getByRole("tab", { name: new RegExp(`^${name}`) });
  await tab.click();
  await expect(tab).toHaveAttribute("aria-selected", "true");
}

test("local scenery persists and displays the selected source tile in IFOS", async ({ page, context }) => {
  await actor(context, "admin");
  await page.setViewportSize({ width: 1440, height: 1000 });
  const source = await context.request.get("/assets/aero/aero-landscapes.png");
  expect(source.ok()).toBeTruthy();
  expect(source.headers()["content-type"]).toMatch(/^image\/png/);

  await collection(page);
  const scenery = page.getByRole("button", { name: "Cenário Cidade nas nuvens", exact: true });
  await scenery.click();
  await expect(scenery).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
  await expect(scenery).toHaveAttribute("aria-pressed", "true");

  await page.goto("/ifos");
  const desktop = page.getByRole("main", { name: "IFOS, área de trabalho do SIFCAS", exact: true });
  await expect(desktop).toBeVisible();
  const artwork = desktop.locator(".experienceArtworkWallpaper svg");
  await expect(artwork).toBeVisible();
  await expect(artwork).toHaveAttribute("viewBox", "5 5 386 386");
  await expect(artwork.locator("image")).toHaveAttribute("href", "/assets/aero/aero-landscapes.png");
  await page.screenshot({ path: "test-results/aero-assets-ifos.png", fullPage: true });
});

test("avatar, profile art, button skin and desktop sticker stay with their account", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await collection(page);
  for (const [tab, name] of [
    ["Avatares", "Avatar Água viva"], ["Faixas", "Faixa Janela no jardim"], ["Molduras", "Moldura Estrelas de prata"],
    ["Botões", "Botão Cromo azul"], ["Adesivos", "Adesivo Nota musical"],
  ]) {
    await category(page, tab);
    const choice = page.getByRole("button", { name, exact: true });
    await choice.click();
    await expect(choice).toHaveAttribute("aria-pressed", "true");
  }

  await page.goto("/perfil");
  const avatar = page.locator(".topbar [data-experience-avatar]");
  await expect(avatar).toHaveCSS("background-image", /glass-avatars\.png/);
  await expect(page.locator(".profileIdentity .experienceArtworkBanner image")).toHaveAttribute("href", "/assets/aero/aero-banners.png");
  await expect(page.locator(".profileIdentity .experiencePortrait.hasArtFrame")).toBeVisible();
  await expect(page.locator(".profileIdentity .experiencePortrait > svg image")).toHaveAttribute("href", "/assets/aero/aero-frames-alpha.png");
  expect(await page.getByRole("button", { name: "Salvar alterações", exact: true }).evaluate((element) => getComputedStyle(element, "::after").backgroundImage)).toMatch(/glossy-buttons\.png/);
  const selectedAvatarPosition = await avatar.evaluate((element) => getComputedStyle(element).backgroundPosition);
  const selectedBannerCrop = await page.locator(".profileIdentity .experienceArtworkBanner svg").getAttribute("viewBox");
  const selectedFrameCrop = await page.locator(".profileIdentity .experiencePortrait > svg").getAttribute("viewBox");
  await page.screenshot({ path: "test-results/aero-assets-profile.png", fullPage: true });
  await page.goto("/ifos");
  await expect(page.locator(".experienceDesktopSticker image")).toHaveAttribute("href", "/assets/aero/aero-stickers-alpha.png");
  await page.getByRole("button", { name: "Abrir menu de aplicativos", exact: true }).click();
  await expect(page.locator(".osMenuAvatar")).toHaveCSS("background-image", /glass-avatars\.png/);

  await actor(context, "otherStudent");
  await page.goto("/perfil");
  await expect(avatar).toHaveCSS("background-image", /glass-avatars\.png/);
  await expect(avatar).not.toHaveCSS("background-position", selectedAvatarPosition);
  await expect(page.locator(".profileIdentity .experienceArtworkBanner svg")).not.toHaveAttribute("viewBox", selectedBannerCrop ?? "");
  await expect(page.locator(".profileIdentity .experiencePortrait > svg")).not.toHaveAttribute("viewBox", selectedFrameCrop ?? "");
  await actor(context);
  await page.goto("/perfil");
  await expect(avatar).toHaveCSS("background-image", /glass-avatars\.png/);
  await expect(page.locator(".profileIdentity .experiencePortrait.hasArtFrame")).toBeVisible();
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
  await page.getByRole("button", { name: "Avatar Céu azul", exact: true }).click();
  await expect(page.getByRole("button", { name: "Avatar Céu azul", exact: true })).toHaveAttribute("aria-pressed", "true");
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
  await expect(page.getByRole("button", { name: "Avatar Céu azul", exact: true })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Usar minhas iniciais", exact: true }).click();
  await expect(page.getByRole("button", { name: "Avatar Céu azul", exact: true })).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByRole("button", { name: "Usar minhas iniciais", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(page.locator(".topbar [data-experience-avatar]")).not.toHaveCSS("background-image", /data:image|glass-avatars/);
  await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(1);
  await page.screenshot({ path: "test-results/aero-assets-mobile.png", fullPage: true });
});
