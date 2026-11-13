import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";

if (process.env.SIFCAS_PROFILE_PRODUCTION === "1") test.use({ baseURL: "http://127.0.0.1:3102" });

type Actor = "student" | "admin";
type Appearance = "artwork" | "plain" | "legacy-with-artwork" | "classic";
const accounts = {
  student: { name: "Lia Estudante", role: "Estudante" },
  admin: { name: "Admin Sintético", role: "Administrador Geral" },
};
const shortcuts = [
  { label: "Personalização", detail: "Temas, perfil e IFOS", href: "/personalizacao" },
  { label: "Notificações", detail: "Escolher categorias", href: "/preferencias-notificacoes" },
  { label: "Meus atalhos", detail: "Personalizar início", href: "/atalhos" },
  { label: "Reportar erro", detail: "Acompanhar problema", href: "/reportar-erro" },
];

async function signIn(context: BrowserContext, actor: Actor) {
  const response = await context.request.get(`http://127.0.0.1:54331/__fixture/session?actor=${actor}`);
  expect(response.ok()).toBeTruthy();
  const fixture = await response.json();
  expect(fixture.synthetic).toBe(true);
  await context.addCookies([fixture.cookie]);
}

async function configure(page: Page, theme: "light" | "dark", appearance: Appearance) {
  await page.goto("/personalizacao");
  await page.getByRole("combobox", { name: "Tema", exact: true }).selectOption(theme);
  if (appearance !== "artwork") {
    await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
    await page.getByRole("combobox", { name: "Faixa do perfil", exact: true }).selectOption(appearance === "plain" ? "none" : "aurora");
    if (appearance === "plain" || appearance === "classic") {
      await page.getByRole("tab", { name: "Coleção Aero", exact: true }).click();
      for (const [category, reset] of [["Avatares", "Usar minhas iniciais"], ["Faixas", "Usar faixa padrão"], ["Molduras", "Sem moldura artística"]]) {
        await page.getByRole("tab", { name: category, exact: true }).click();
        await page.getByRole("button", { name: reset, exact: true }).click();
      }
    }
  }
  await page.goto("/perfil");
  await expect(page.getByRole("heading", { name: "Perfil e segurança", exact: true })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-experience-resolved-theme", theme);
  await page.evaluate(() => document.fonts.ready);
}

/** Sample painted backgrounds with glyphs temporarily hidden, then calculate WCAG relative luminance. */
async function textContrast(page: Page, targets: Record<string, Locator>) {
  const records = [];
  let screenshot: Buffer;
  try {
    for (const [label, locator] of Object.entries(targets)) {
      const sample = await locator.evaluate((element) => {
        const style = getComputedStyle(element);
        const foreground = style.color.match(/[\d.]+/g)?.map(Number);
        if (!style.color.startsWith("rgb") || !foreground) throw new Error(`Unsupported foreground: ${style.color}`);
        for (let node: Element | null = element; node; node = node.parentElement) {
          if (Number(getComputedStyle(node).opacity) !== 1) throw new Error("Group opacity needs a separate contrast calculation.");
        }
        const bounds = element.getBoundingClientRect();
        let rect = bounds;
        if (element instanceof HTMLInputElement) {
          const left = bounds.left + parseFloat(style.borderLeftWidth) + parseFloat(style.paddingLeft);
          const top = bounds.top + parseFloat(style.borderTopWidth) + parseFloat(style.paddingTop);
          rect = new DOMRect(left, top, bounds.width - (left - bounds.left) - parseFloat(style.borderRightWidth) - parseFloat(style.paddingRight), bounds.height - (top - bounds.top) - parseFloat(style.borderBottomWidth) - parseFloat(style.paddingBottom));
        } else {
          const range = document.createRange();
          const text = Array.from(element.childNodes).find((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
          if (!text) throw new Error("Text sample has no direct label.");
          range.selectNodeContents(text);
          rect = range.getBoundingClientRect();
        }
        const original = element.getAttribute("style");
        const html = element as HTMLElement;
        for (const property of ["color", "-webkit-text-fill-color", "caret-color"]) html.style.setProperty(property, "transparent", "important");
        html.style.setProperty("text-shadow", "none", "important");
        return { foreground, original, rect: { x: rect.left + scrollX, y: rect.top + scrollY, width: rect.width, height: rect.height } };
      });
      records.push({ label, locator, ...sample });
    }
    // Below-fold fields are read after scrolling; fixed shell chrome must not mask their background samples.
    screenshot = await page.screenshot({ fullPage: true, animations: "disabled", scale: "css", style: ".topbar,.mobileNav{visibility:hidden!important}" });
  } finally {
    for (const record of records) await record.locator.evaluate((element, original) => {
      if (original === null) element.removeAttribute("style"); else element.setAttribute("style", original);
    }, record.original);
  }
  const { data, info } = await sharp(screenshot).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const luminance = (channels: number[]) => channels.map((channel) => {
    const srgb = channel / 255;
    return srgb <= 0.04045 ? srgb / 12.92 : ((srgb + 0.055) / 1.055) ** 2.4;
  }).reduce((sum, channel, index) => sum + channel * [0.2126, 0.7152, 0.0722][index], 0);
  return Object.fromEntries(records.map(({ label, foreground, rect }) => {
    let ratio = Infinity;
    let background: number[] = [];
    for (let y = Math.ceil(rect.y); y < Math.floor(rect.y + rect.height); y++) {
      for (let x = Math.ceil(rect.x); x < Math.floor(rect.x + rect.width); x++) {
        if (x < 0 || y < 0 || x >= info.width || y >= info.height) throw new Error(`${label}: sample outside screenshot`);
        const offset = (y * info.width + x) * info.channels;
        const pixel = [...data.subarray(offset, offset + 3)];
        const alpha = foreground[3] ?? 1;
        const ink = luminance(pixel.map((channel, index) => foreground[index] * alpha + channel * (1 - alpha)));
        const surface = luminance(pixel);
        const contrast = (Math.max(ink, surface) + 0.05) / (Math.min(ink, surface) + 0.05);
        if (contrast < ratio) { ratio = contrast; background = pixel; }
      }
    }
    if (!Number.isFinite(ratio)) throw new Error(`${label}: empty sample`);
    return [label, { ratio, foreground, worstBackgroundPixel: background }];
  }));
}

async function assertProfile(page: Page, actor: Actor, appearance: Appearance) {
  // Production navigation may retain a hidden route tree while React commits the new one.
  const identity = page.locator(".profileIdentity").filter({ visible: true });
  await expect(identity).toHaveCount(1);
  const heading = identity.getByRole("heading", { name: accounts[actor].name, exact: true });
  await expect(heading).toBeVisible();
  await expect(identity.getByText(accounts[actor].role, { exact: true })).toBeVisible();
  const geometry = await identity.evaluate((element) => {
    const rect = (selector: string) => {
      const node = element.querySelector(selector);
      if (!node) throw new Error(`Missing profile element: ${selector}`);
      const bounds = node.getBoundingClientRect();
      return { left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom, x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 };
    };
    const card = element.getBoundingClientRect();
    const pseudo = getComputedStyle(element, "::before");
    const legacyBanner = pseudo.display !== "none" && !["none", "normal", '""'].includes(pseudo.content) ? 1 : pseudo.display !== "none" && pseudo.content === '""' && parseFloat(pseudo.height) > 0 ? 1 : 0;
    const banners = Array.from(element.querySelectorAll(".experienceArtworkBanner")).filter((banner) => banner.getBoundingClientRect().height > 0);
    return { card: { left: card.left, right: card.right, top: card.top, x: card.x + card.width / 2 }, portrait: rect(".experiencePortrait"), avatar: rect("[data-experience-avatar]"), name: rect("h2"), bannerCount: banners.length + legacyBanner, bannerTop: banners[0]?.getBoundingClientRect().top };
  });
  expect(geometry.bannerCount, "One banner with artwork; no banner for the plain profile").toBe(appearance === "plain" ? 0 : 1);
  if (geometry.bannerTop !== undefined) expect(Math.abs(geometry.bannerTop - geometry.card.top)).toBeLessThanOrEqual(2);
  expect(Math.abs(geometry.portrait.x - geometry.card.x), "Portrait centered in identity card").toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.avatar.x - geometry.portrait.x), "Avatar centered inside frame").toBeLessThanOrEqual(1);
  expect(Math.abs(geometry.avatar.y - geometry.portrait.y), "Avatar centered vertically inside frame").toBeLessThanOrEqual(1);
  expect(geometry.portrait.bottom, "Portrait and name must not overlap").toBeLessThanOrEqual(geometry.name.top);
  expect(geometry.name.left).toBeGreaterThanOrEqual(geometry.card.left);
  expect(geometry.name.right).toBeLessThanOrEqual(geometry.card.right);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), "Profile fits the viewport").toBe(true);

  const targets: Record<string, Locator> = {};
  for (const label of ["Nome completo", "E-mail", "Campus", "Papel institucional"]) {
    const input = page.getByRole("textbox", { name: label, exact: true });
    await expect(input).toBeVisible();
    await expect(input).not.toHaveValue("");
    await expect(input).toHaveJSProperty("readOnly", label !== "Nome completo");
    targets[`field: ${label}`] = input;
    targets[`label: ${label}`] = input.locator("..");
  }
  await expect(page.getByRole("textbox", { name: "Nome completo", exact: true })).toHaveValue(accounts[actor].name);
  targets["identity: email"] = identity.locator(".identityMeta>span>span").nth(0);
  targets["identity: campus"] = identity.locator(".identityMeta>span>span").nth(1);
  if (appearance === "plain" || appearance === "classic") targets["identity: initials"] = identity.locator(".profileAvatar");
  for (const shortcut of shortcuts) {
    const link = page.getByRole("link", { name: `${shortcut.label} ${shortcut.detail}`, exact: true });
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", shortcut.href);
    for (const text of [shortcut.label, shortcut.detail]) {
      const label = link.getByText(text, { exact: true });
      await expect(label).toBeVisible();
      expect(await label.evaluate((element) => element.scrollWidth <= element.clientWidth), `${text} is not clipped`).toBe(true);
      targets[`shortcut: ${text}`] = label;
    }
  }
  const measurements = await textContrast(page, targets);
  await test.info().attach("profile-contrast.json", { body: JSON.stringify(measurements, null, 2), contentType: "application/json" });
  for (const [label, result] of Object.entries(measurements)) expect(result.ratio, `${label}: WCAG contrast against painted background`).toBeGreaterThanOrEqual(4.5);
  await expect(page.getByRole("link", { name: "Alterar senha", exact: true })).toHaveAttribute("href", "/recuperar-senha");
  const signout = page.getByRole("button", { name: "Sair da conta", exact: true }).locator("..");
  await expect(signout).toHaveAttribute("action", "/auth/signout");
  await expect(signout).toHaveAttribute("method", "post");
}

for (const actor of ["student", "admin"] as const) {
  for (const theme of ["light", "dark"] as const) {
    for (const appearance of ["artwork", "plain"] as const) {
      for (const width of [375, 1440]) {
        test(`${actor} profile stays readable and aligned: ${theme}, ${appearance}, ${width}px`, async ({ page, context }) => {
          await signIn(context, actor);
          await page.setViewportSize({ width, height: width === 375 ? 812 : 1000 });
          await page.emulateMedia({ reducedMotion: "reduce" });
          await configure(page, theme, appearance);
          await assertProfile(page, actor, appearance);
          if (actor === "student" && appearance === "artwork") await page.screenshot({ path: test.info().outputPath(`profile-${theme}-${width}.png`), fullPage: true, animations: "disabled" });
        });
      }
    }
  }
}

test("artwork replaces an older banner preference without duplicating it", async ({ page, context }) => {
  await signIn(context, "student");
  await page.setViewportSize({ width: 1440, height: 1000 });
  await configure(page, "dark", "legacy-with-artwork");
  await assertProfile(page, "student", "legacy-with-artwork");
});

test("classic banner remains a single aligned fallback without artwork", async ({ page, context }) => {
  await signIn(context, "student");
  await page.setViewportSize({ width: 375, height: 812 });
  await configure(page, "dark", "classic");
  await assertProfile(page, "student", "classic");
});

test("profile form submits through its existing action and keeps institutional fields readonly", async ({ page, context }) => {
  await signIn(context, "student");
  await page.goto("/perfil");
  const original = await page.getByRole("textbox", { name: "Nome completo", exact: true }).inputValue();
  await page.getByRole("textbox", { name: "Nome completo", exact: true }).fill("Nome de regressão sintético");
  const submitted = page.waitForRequest((request) => request.method() === "POST" && new URL(request.url()).pathname === "/perfil");
  await page.getByRole("button", { name: "Salvar alterações", exact: true }).click();
  expect((await submitted).postData()).toContain("Nome de regressão sintético");
  // The fixture deliberately rejects PATCH /profiles; do not fake a successful save.
  await expect(page).toHaveURL(/\/perfil\?error=/);
  await expect(page.getByText("Não foi possível salvar o perfil.", { exact: true })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("textbox", { name: "Nome completo", exact: true })).toHaveValue(original);
  for (const label of ["E-mail", "Campus", "Papel institucional"]) await expect(page.getByRole("textbox", { name: label, exact: true })).toHaveJSProperty("readOnly", true);
});
