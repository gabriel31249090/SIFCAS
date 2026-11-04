import { expect, test, type BrowserContext, type Page } from "@playwright/test";

async function actor(context: BrowserContext, name = "student") {
  const response = await context.request.get(`http://127.0.0.1:54331/__fixture/session?actor=${name}`);
  expect(response.ok()).toBeTruthy();
  const fixture = await response.json();
  expect(fixture.synthetic).toBe(true);
  await context.clearCookies();
  await context.addCookies([fixture.cookie]);
}

async function openStudio(page: Page) {
  await page.goto("/personalizacao");
  await expect(page.getByRole("heading", { name: /^Personalização/ })).toBeVisible();
  await expect(page.getByRole("tab", { name: "Aparência", exact: true })).toHaveAttribute("aria-selected", "true");
}

test("appearance survives reload, updates another tab and stays separate for each account", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await openStudio(page);
  await page.getByLabel("Tema", { exact: true }).selectOption("dark");
  await page.getByLabel("Paleta", { exact: true }).selectOption("bubblegum");
  await page.getByLabel("Papel de parede", { exact: true }).selectOption("aurora");
  await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
  await page.getByLabel("Saudação", { exact: true }).selectOption("Bom dia");
  await page.getByLabel("Como quer ser chamado?", { exact: true }).fill("Lia");
  await page.getByRole("tab", { name: "Início e atalhos", exact: true }).click();
  await page.getByRole("checkbox", { name: "Agenda, LUMA e importação", exact: true }).uncheck();
  await page.reload();
  await expect(page.getByLabel("Tema", { exact: true })).toHaveValue("dark");
  await expect(page.getByLabel("Paleta", { exact: true })).toHaveValue("bubblegum");
  await expect(page.locator("html")).toHaveAttribute("data-experience-resolved-theme", "dark");
  await expect(page.locator("html")).toHaveAttribute("data-experience-palette", "bubblegum");

  const otherTab = await context.newPage();
  await otherTab.goto("/");
  await expect(otherTab.getByRole("heading", { name: "Bom dia, Lia!", exact: true })).toBeVisible();
  await expect(otherTab.locator('[data-experience-widget="agenda"]')).toBeHidden();
  await page.getByLabel("Paleta", { exact: true }).selectOption("meadow");
  await expect(otherTab.locator("html")).toHaveAttribute("data-experience-palette", "meadow");
  await otherTab.close();

  await actor(context, "otherStudent");
  await openStudio(page);
  await expect(page.getByLabel("Paleta", { exact: true })).toHaveValue("aqua");
  await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
  await expect(page.getByLabel("Como quer ser chamado?", { exact: true })).toHaveValue("");
  await actor(context);
  await openStudio(page);
  await expect(page.getByLabel("Paleta", { exact: true })).toHaveValue("meadow");
  await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
  await expect(page.getByLabel("Como quer ser chamado?", { exact: true })).toHaveValue("Lia");
  await page.screenshot({ path: "test-results/student-personalization.png", fullPage: true });
});

test("preference files export, reject unrelated JSON, import and restore with confirmation", async ({ page, context }) => {
  await actor(context);
  await openStudio(page);
  await page.getByLabel("Tema", { exact: true }).selectOption("dark");
  await page.getByRole("tab", { name: "Seus dados", exact: true }).click();
  const downloadPending = page.waitForEvent("download");
  await page.getByRole("button", { name: "Exportar", exact: true }).click();
  const download = await downloadPending;
  expect(download.suggestedFilename()).toBe("sifcas-preferencias.json");
  const stream = await download.createReadStream();
  if (!stream) throw new Error("O navegador não disponibilizou o arquivo exportado.");
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(Buffer.from(chunk));
  const exported = JSON.parse(Buffer.concat(chunks).toString("utf8"));
  expect(exported.theme).toBe("dark");
  expect(exported).not.toHaveProperty("grades");
  expect(exported).not.toHaveProperty("access_token");

  await page.getByLabel("Importar preferências JSON", { exact: true }).setInputFiles({ name: "invalido.json", mimeType: "application/json", buffer: Buffer.from('{"unrelated":true}') });
  await expect(page.getByRole("status").filter({ hasText: "Arquivo inválido" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-experience-resolved-theme", "dark");
  await page.getByLabel("Importar preferências JSON", { exact: true }).setInputFiles({ name: "sifcas-preferencias.json", mimeType: "application/json", buffer: Buffer.from(JSON.stringify({ ...exported, theme: "light", displayName: "Eva", focusDuration: 7 })) });
  await expect(page.getByRole("status").filter({ hasText: "Preferências importadas" })).toBeVisible();
  await expect(page.locator("html")).toHaveAttribute("data-experience-resolved-theme", "light");
  await page.getByRole("tab", { name: "Rotina e foco", exact: true }).click();
  await expect(page.getByLabel("Duração do foco (minutos)", { exact: true })).toHaveValue("7");
  await expect(page.locator(".studioFocusClock")).toContainText("07:00");
  await page.getByRole("tab", { name: "Seus dados", exact: true }).click();
  await page.getByRole("button", { name: "Restaurar padrão", exact: true }).click();
  await page.getByRole("button", { name: "Manter minhas escolhas", exact: true }).click();
  await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
  await expect(page.getByLabel("Como quer ser chamado?", { exact: true })).toHaveValue("Eva");
  await page.getByRole("tab", { name: "Seus dados", exact: true }).click();
  await page.getByRole("button", { name: "Restaurar padrão", exact: true }).click();
  await page.getByRole("button", { name: "Sim, restaurar", exact: true }).click();
  await page.reload();
  await expect(page.getByLabel("Tema", { exact: true })).toHaveValue("system");
  await page.getByRole("tab", { name: "Seu perfil", exact: true }).click();
  await expect(page.getByLabel("Como quer ser chamado?", { exact: true })).toHaveValue("");
});

test("focus pauses, resumes and credits a completed session once after a delayed tick", async ({ page, context }) => {
  await actor(context);
  await page.clock.install();
  await openStudio(page);
  await page.getByRole("tab", { name: "Rotina e foco", exact: true }).click();
  await page.getByLabel("Duração do foco (minutos)", { exact: true }).fill("1");
  await page.getByRole("button", { name: "Iniciar foco", exact: true }).click();
  await page.clock.fastForward(10_000);
  await page.getByRole("button", { name: "Pausar", exact: true }).click();
  await expect(page.locator(".studioFocusClock")).toContainText("00:50");
  await page.clock.fastForward(120_000);
  await expect(page.locator(".studioFocusClock")).toContainText("00:50");
  await page.getByRole("button", { name: "Continuar foco", exact: true }).click();
  await page.clock.fastForward(51_000);
  await expect(page.getByRole("status").filter({ hasText: "Sessão concluída!" })).toBeVisible();
  await expect(page.locator(".studioGoal")).toContainText("1 / 120 min");
  await expect(page.getByText("1 sessões concluídas neste navegador.", { exact: true })).toBeVisible();
  await page.clock.fastForward(120_000);
  await expect(page.getByText("1 sessões concluídas neste navegador.", { exact: true })).toBeVisible();
  await page.reload();
  await page.getByRole("tab", { name: "Rotina e foco", exact: true }).click();
  await expect(page.getByText("1 sessões concluídas neste navegador.", { exact: true })).toBeVisible();
  await expect(page.getByLabel("Duração do foco (minutos)", { exact: true })).toHaveValue("1");
});

test("mobile studio fits the viewport and categories support keyboard navigation", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await openStudio(page);
  await page.getByRole("tab", { name: "Aparência", exact: true }).focus();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("tab", { name: "Seu perfil", exact: true })).toBeFocused();
  await expect(page.getByRole("tabpanel", { name: "Seu perfil", exact: true })).toBeVisible();
  await page.keyboard.press("End");
  await expect(page.getByRole("tab", { name: "Seus dados", exact: true })).toBeFocused();
  await page.keyboard.press("Home");
  await expect(page.getByRole("tab", { name: "Aparência", exact: true })).toBeFocused();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/student-personalization-mobile.png", fullPage: true });
  await page.goto("/ifos");
  await expect(page.getByRole("heading", { name: "Disponível em computadores", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
});

test("storage failure is visible while appearance still works for the current tab", async ({ page, context }) => {
  await actor(context);
  await page.addInitScript(() => {
    const setItem = Storage.prototype.setItem;
    Storage.prototype.setItem = function(key: string, value: string) {
      if (key.startsWith("sifcas:student-experience:")) throw new DOMException("Synthetic quota", "QuotaExceededError");
      return setItem.call(this, key, value);
    };
  });
  await openStudio(page);
  await page.getByLabel("Tema", { exact: true }).selectOption("dark");
  await expect(page.locator("html")).toHaveAttribute("data-experience-resolved-theme", "dark");
  await expect(page.getByRole("status").filter({ hasText: "Não foi possível salvar suas preferências" })).toBeVisible();
  await expect(page.getByText("Alterações nesta sessão", { exact: true })).toBeVisible();
});

test("IFOS manages independent windows, dragging, minimization and the desktop", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ifos");
  await expect(page.getByRole("main", { name: "IFOS, área de trabalho do SIFCAS", exact: true })).toBeVisible();
  await expect(page.locator(".desktopSidebar")).toHaveCount(0);
  const apps = page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true });
  await apps.getByRole("button", { name: "Boletim e frequência", exact: true }).click();
  const grades = page.getByRole("dialog", { name: "Boletim e frequência", exact: true });
  await expect(grades).toBeVisible();
  await expect(grades.getByRole("link", { name: "Abrir aplicativo", exact: true })).toHaveAttribute("href", "/boletim");
  const dragButton = grades.getByRole("button", { name: "Mover janela Boletim e frequência. Use as setas do teclado.", exact: true });
  const initialLeft = await grades.evaluate((element) => parseFloat((element as HTMLElement).style.left));
  await dragButton.focus();
  await page.keyboard.press("ArrowRight");
  await expect.poll(() => grades.evaluate((element) => parseFloat((element as HTMLElement).style.left))).toBe(initialLeft + 20);
  const titleBox = await dragButton.boundingBox();
  if (!titleBox) throw new Error("Barra de título indisponível.");
  await page.mouse.move(titleBox.x + 60, titleBox.y + titleBox.height / 2);
  await page.mouse.down();
  await page.mouse.move(titleBox.x + 140, titleBox.y + titleBox.height / 2 + 45, { steps: 5 });
  await page.mouse.up();
  await expect.poll(() => grades.evaluate((element) => parseFloat((element as HTMLElement).style.left))).toBe(initialLeft + 100);
  await grades.getByRole("button", { name: "Maximizar Boletim e frequência", exact: true }).click();
  await expect.poll(async () => (await grades.boundingBox())?.width ?? 0).toBeGreaterThan(1200);
  await grades.getByRole("button", { name: "Restaurar Boletim e frequência", exact: true }).click();
  await grades.getByRole("button", { name: "Minimizar Boletim e frequência", exact: true }).click();
  await expect(grades).toBeHidden();
  await page.getByRole("button", { name: "Restaurar janela Boletim e frequência", exact: true }).click();
  await expect(grades).toBeVisible();

  await apps.getByRole("button", { name: "Agenda acadêmica", exact: true }).click();
  const agenda = page.getByRole("dialog", { name: "Agenda acadêmica", exact: true });
  await expect(agenda).toBeVisible();
  await expect(grades).toBeVisible();
  await expect(agenda.getByRole("link", { name: "Abrir aplicativo", exact: true })).toHaveAttribute("href", "/agenda-aluno");
  await page.getByRole("button", { name: "Mostrar área de trabalho", exact: true }).click();
  await expect(agenda).toBeHidden();
  await expect(grades).toBeHidden();
  await page.getByRole("button", { name: "Restaurar janelas", exact: true }).click();
  await expect(agenda).toBeVisible();
  await expect(grades).toBeVisible();
  await page.screenshot({ path: "test-results/ifos-desktop.png", fullPage: true });
  await agenda.getByRole("button", { name: "Fechar Agenda acadêmica", exact: true }).click();
  await grades.getByRole("button", { name: "Fechar Boletim e frequência", exact: true }).click();
  await expect(page.locator(".osWindow")).toHaveCount(0);
});

test("IFOS search handles accents, keyboard, empty results and saved favorites", async ({ page, context }) => {
  await actor(context);
  await page.setViewportSize({ width: 1440, height: 1000 });
  await page.goto("/ifos");
  await page.keyboard.press("Control+k");
  const menu = page.getByRole("dialog", { name: "Menu de aplicativos", exact: true });
  await expect(menu).toBeVisible();
  const search = menu.getByRole("textbox", { name: "Buscar aplicativos", exact: true });
  await expect(search).toBeFocused();
  await search.fill("avaliacoes");
  await expect(menu.getByRole("button", { name: /^Avaliações Provas/ })).toBeVisible();
  await search.press("Enter");
  await expect(menu).toBeHidden();
  const assessment = page.getByRole("dialog", { name: "Avaliações", exact: true });
  await expect(assessment).toBeVisible();
  await assessment.getByRole("button", { name: "Favoritar", exact: true }).click();
  await expect(assessment.getByRole("button", { name: "Nos favoritos", exact: true })).toHaveAttribute("aria-pressed", "true");
  await page.reload();
  await expect(page.getByRole("navigation", { name: "Aplicativos do IFOS", exact: true }).getByRole("button", { name: "Avaliações", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Buscar no IFOS", exact: true }).click();
  await menu.getByRole("textbox", { name: "Buscar aplicativos", exact: true }).fill("nenhum-app-xyz");
  await expect(menu.getByText("Nenhum aplicativo encontrado", { exact: true })).toBeVisible();
  await menu.getByRole("button", { name: "Mostrar todos os apps", exact: true }).click();
  await expect(menu.getByRole("textbox", { name: "Buscar aplicativos", exact: true })).toHaveValue("");
  await expect(menu.getByRole("button", { name: /Usuários e permissões/ })).toHaveCount(0);
  await page.keyboard.press("Escape");
  await expect(menu).toBeHidden();
  await expect(page.getByRole("button", { name: "Abrir menu de aplicativos", exact: true })).toBeFocused();
  await page.getByRole("button", { name: "Abrir menu de aplicativos", exact: true }).click();
  await expect(menu).toBeVisible();
  await page.locator(".osBigTime").click();
  await expect(menu).toBeHidden();
});
