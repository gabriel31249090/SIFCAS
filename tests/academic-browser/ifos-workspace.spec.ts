import { expect, test, type BrowserContext, type Locator, type Page } from "@playwright/test";

async function actor(context: BrowserContext, name = "student") {
  const response = await context.request.get(`http://127.0.0.1:54331/__fixture/session?actor=${name}`);
  expect(response.ok()).toBeTruthy();
  const fixture = await response.json();
  expect(fixture.synthetic).toBe(true);
  await context.clearCookies();
  await context.addCookies([fixture.cookie]);
}

async function desktop(page: Page) {
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ifos");
  await expect(page.getByRole("main", { name: "IFOS, área de trabalho do SIFCAS", exact: true })).toBeVisible();
  await expect.poll(() => workspaceKeys(page)).not.toHaveLength(0);
}

async function workspaceKeys(page: Page) {
  return page.evaluate(() => Object.keys(localStorage).filter((key) => key.startsWith("sifcas:ifos-workspace:v1:")));
}

async function geometry(window: Locator) {
  return window.evaluate((element) => {
    const { left, top, width, height } = (element as HTMLElement).style;
    return { x: parseFloat(left), y: parseFloat(top), width: parseFloat(width), height: parseFloat(height) };
  });
}

test("IFOS restores geometry, window ordering, minimization and the desktop for its account", async ({ page, context }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await actor(context);
  await desktop(page);
  const apps = page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true });
  await apps.getByRole("button", { name: "Boletim e frequência", exact: true }).click();
  const grades = page.getByRole("dialog", { name: "Boletim e frequência", exact: true, includeHidden: true });
  const resize = grades.getByRole("button", { name: /^Redimensionar janela/ });
  await resize.focus();
  await page.keyboard.press("ArrowRight");
  await page.keyboard.press("Shift+ArrowDown");
  await grades.getByRole("button", { name: /^Mover janela/ }).focus();
  await page.keyboard.press("ArrowRight");
  const changed = await geometry(grades);
  expect(changed.width).toBe(560);
  expect(changed.height).toBe(530);
  await grades.getByRole("button", { name: "Minimizar Boletim e frequência", exact: true }).click();
  await apps.getByRole("button", { name: "Agenda acadêmica", exact: true }).click();
  const agenda = page.getByRole("dialog", { name: "Agenda acadêmica", exact: true });
  await agenda.getByRole("button", { name: "Maximizar Agenda acadêmica", exact: true }).click();
  await page.reload();
  await expect(grades).toBeHidden();
  await expect(agenda).toBeVisible();
  await expect(agenda).toHaveClass(/osMaximized/);
  expect(await geometry(grades)).toEqual(changed);
  expect(await page.locator(".osWindow").evaluateAll((elements) => elements.map((element) => element.getAttribute("aria-label")))).toEqual(["Boletim e frequência", "Agenda acadêmica"]);
  await page.getByRole("button", { name: "Restaurar janela Boletim e frequência", exact: true }).click();
  await expect(grades).toBeVisible();
  await page.getByRole("button", { name: "Mostrar área de trabalho", exact: true }).click();
  await page.reload();
  await expect(page.getByRole("button", { name: "Restaurar janelas", exact: true })).toHaveAttribute("aria-pressed", "true");
  await expect(grades).toBeHidden();
  await expect(agenda).toBeHidden();
  await page.getByRole("button", { name: "Restaurar janelas", exact: true }).click();
  await grades.getByRole("button", { name: "Fechar Boletim e frequência", exact: true }).click();
  await page.reload();
  await expect(grades).toHaveCount(0);
  await expect(agenda).toBeVisible();
  await page.setViewportSize({ width: 390, height: 844 });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Disponível em computadores", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 1440, height: 1000 });
  await expect(agenda).toBeVisible();
  await expect(agenda).toHaveClass(/osMaximized/);
  expect(errors).toEqual([]);
});

test("IFOS mouse and keyboard resizing stay usable inside a smaller viewport", async ({ page, context }) => {
  await actor(context);
  await desktop(page);
  await page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true }).getByRole("button", { name: "Boletim e frequência", exact: true }).click();
  const grades = page.getByRole("dialog", { name: "Boletim e frequência", exact: true });
  const resize = grades.getByRole("button", { name: /^Redimensionar janela/ });
  const initial = await geometry(grades);
  const handle = await resize.boundingBox();
  if (!handle) throw new Error("Alça de redimensionamento indisponível.");
  await page.mouse.move(handle.x + 14, handle.y + 14);
  await page.mouse.down();
  await page.mouse.move(handle.x + 94, handle.y + 74, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => geometry(grades)).toEqual({ ...initial, width: initial.width + 80, height: initial.height + 60 });
  await page.setViewportSize({ width: 900, height: 580 });
  await expect.poll(async () => {
    const bounds = await grades.boundingBox();
    return Boolean(bounds && bounds.x >= 10 && bounds.y >= 72 && bounds.x + bounds.width <= 890 && bounds.y + bounds.height <= 511);
  }).toBe(true);
  await resize.focus();
  for (let i = 0; i < 20; i++) await page.keyboard.press("Shift+ArrowLeft");
  expect((await geometry(grades)).width).toBe(320);
  for (let i = 0; i < 20; i++) await page.keyboard.press("Shift+ArrowUp");
  expect((await geometry(grades)).height).toBe(240);
  await expect(grades.getByRole("button", { name: "Fechar Boletim e frequência", exact: true })).toBeInViewport();
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.getByRole("heading", { name: "Disponível em computadores", exact: true })).toBeVisible();
  await page.setViewportSize({ width: 900, height: 580 });
  await expect(grades).toBeVisible();
  await expect(resize).toBeInViewport();
  await page.screenshot({ path: "test-results/ifos-workspace-900.png" });
});

test("IFOS isolates accounts and restores only currently authorized apps from validated storage", async ({ page, context }) => {
  await actor(context);
  await desktop(page);
  await page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true }).getByRole("button", { name: "Boletim e frequência", exact: true }).click();
  const studentKey = (await workspaceKeys(page))[0];
  await actor(context, "otherStudent");
  await page.goto("/ifos");
  await expect(page.locator(".osWindow")).toHaveCount(0);
  await expect.poll(() => workspaceKeys(page)).toHaveLength(2);
  await actor(context);
  await page.goto("/ifos");
  await expect(page.getByRole("dialog", { name: "Boletim e frequência", exact: true })).toBeVisible();
  await page.addInitScript((key) => {
    const pending = sessionStorage.getItem("ifos-synthetic-pending-layout");
    if (pending === null) return;
    localStorage.setItem(key, pending);
    sessionStorage.removeItem("ifos-synthetic-pending-layout");
  }, studentKey);
  await page.evaluate(() => sessionStorage.setItem("ifos-synthetic-pending-layout", JSON.stringify({ version: 1, windows: [
    { href: "/usuarios", x: 100, y: 100, width: 550, height: 480, minimized: false, maximized: false },
    { href: "https://example.com", x: 100, y: 100, width: 550, height: 480, minimized: false, maximized: false },
    { href: "/boletim", x: 99999, y: -99999, width: 99999, height: 1, minimized: false, maximized: false, app: { label: "Forged content" }, grades: [10] },
  ], showDesktop: false })));
  await page.reload();
  const grades = page.getByRole("dialog", { name: "Boletim e frequência", exact: true });
  await expect(grades).toBeVisible();
  await expect(page.locator(".osWindow")).toHaveCount(1);
  await expect(grades.getByRole("link", { name: "Abrir aplicativo", exact: true })).toHaveAttribute("href", "/boletim");
  expect(await geometry(grades)).toEqual({ x: 10, y: 72, width: 1420, height: 240 });
  await page.evaluate(() => sessionStorage.setItem("ifos-synthetic-pending-layout", "{broken"));
  await page.reload();
  await expect(page.locator(".osWindow")).toHaveCount(0);
  await page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true }).getByRole("button", { name: "Boletim e frequência", exact: true }).click();
  await expect(grades).toBeVisible();
});

test("IFOS storage failure gives a dismissible notice while windows still work", async ({ page, context }) => {
  await actor(context);
  await page.addInitScript(() => {
    const getItem = Storage.prototype.getItem;
    const setItem = Storage.prototype.setItem;
    Storage.prototype.getItem = function(key: string) {
      if (key.startsWith("sifcas:ifos-workspace:")) throw new DOMException("Synthetic denial", "SecurityError");
      return getItem.call(this, key);
    };
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key.startsWith("sifcas:ifos-workspace:")) throw new DOMException("Synthetic quota", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ifos");
  const notice = page.getByRole("status").filter({ hasText: /Não foi possível (carregar|salvar) a organização/ });
  await expect(notice).toBeVisible();
  await page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true }).getByRole("button", { name: "Boletim e frequência", exact: true }).click();
  const grades = page.getByRole("dialog", { name: "Boletim e frequência", exact: true });
  await expect(grades).toBeVisible();
  await grades.getByRole("button", { name: /^Redimensionar janela/ }).focus();
  await page.keyboard.press("ArrowRight");
  expect((await geometry(grades)).width).toBe(560);
  await page.getByRole("button", { name: "Fechar aviso sobre armazenamento de janelas", exact: true }).click();
  await expect(notice).toHaveCount(0);
});

test("IFOS restores the focus window without resuming its timer", async ({ page, context }) => {
  await actor(context);
  await desktop(page);
  await page.getByRole("button", { name: "Começar sessão de foco", exact: true }).click();
  const focus = page.getByRole("dialog", { name: "Meu foco", exact: true });
  await focus.getByRole("button", { name: "Iniciar foco", exact: true }).click();
  await expect(focus.getByRole("button", { name: "Pausar", exact: true })).toBeVisible();
  await page.reload();
  await expect(focus).toBeVisible();
  await expect(focus.getByRole("button", { name: "Iniciar foco", exact: true })).toBeVisible();
  await expect(focus.locator(".studioFocusClock")).toHaveAttribute("data-running", "false");
});
