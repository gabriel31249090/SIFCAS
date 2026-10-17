import { expect, test } from "@playwright/test";

test("login exposes the stronger policy only for new passwords", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/Entrar \| SIFCAS/);
  await expect(page.getByRole("heading", { name: "Bom ter você aqui." })).toBeVisible();
  await page.getByText("Criar minha conta").click();
  await expect(page.getByLabel("Crie uma senha")).toHaveAttribute("minlength", "12");
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("minlength", "8");
});

test("campus directory filters courses and opens an attributed guide", async ({ page }) => {
  await page.goto("/campus");
  await expect(page).toHaveTitle(/Campus Cáceres \| SIFCAS/);
  await expect(page.getByRole("heading", { name: "Campus Cáceres" })).toBeVisible();
  await page.getByRole("navigation", { name: "Filtrar por assunto" }).getByRole("link", { name: /^Cursos/ }).click();
  await expect(page.locator("#conteudos h3")).toHaveCount(8);
  await page.getByLabel("Buscar no guia do campus").fill("informatica");
  await page.getByRole("button", { name: "Buscar", exact: true }).click();
  await expect(page.locator("#conteudos h3")).toHaveCount(1);
  await page.locator("#conteudos").getByRole("link", { name: /Informática \/ Informática para Internet/ }).click();
  await expect(page.getByRole("heading", { level: 1 })).toHaveText("Informática / Informática para Internet");
  await expect(page.getByRole("link", { name: "Ver fonte oficial" })).toHaveAttribute("href", "https://cas.ifmt.edu.br/curso-tecnico-em-informatica-integrado-ao-ensino-medio/");
  await expect(page.getByRole("link", { name: "tecinfo.cas@ifmt.edu.br" })).toHaveAttribute("href", "mailto:tecinfo.cas@ifmt.edu.br");
});

test("campus search has a useful empty state and reset", async ({ page }) => {
  await page.goto("/campus?q=termo-inexistente-xyz&categoria=Cursos");
  await expect(page.getByRole("heading", { name: "Nenhum conteúdo encontrado" })).toBeVisible();
  await page.getByRole("link", { name: "Limpar filtros" }).click();
  await expect(page.getByRole("heading", { name: "Nenhum conteúdo encontrado" })).toHaveCount(0);
  await expect(page.getByLabel("Buscar no guia do campus")).toHaveValue("");
  await expect(page.getByRole("navigation", { name: "Filtrar por assunto" }).getByRole("link", { name: /^Todos/ })).toHaveAttribute("aria-current", "page");
});

test("global search finds campus guidance without a login", async ({ page }) => {
  await page.goto("/buscar?q=biblioteca");
  await page.getByRole("link", { name: /Biblioteca Monteiro Lobato/ }).click();
  await expect(page.getByRole("heading", { name: "Biblioteca Monteiro Lobato", exact: true })).toBeVisible();
  await expect(page.getByRole("link", { name: "Pesquisar acervo no Gnuteca" })).toHaveAttribute("href", "https://biblioteca.ifmt.edu.br/");
});

test("campus guides work on narrow screens with contact actions", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  for (const path of ["/campus", "/campus/secretaria", "/campus/assistencia-estudantil"]) {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
  }
  await expect(page.getByRole("link", { name: "(65) 3221-2614" })).toHaveAttribute("href", "tel:+556532212614");
  await expect(page.getByRole("link", { name: "assistenciaestudantil.cas@ifmt.edu.br" })).toHaveAttribute("href", "mailto:assistenciaestudantil.cas@ifmt.edu.br");
});

test("public discovery endpoints are available", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should be available`).toBeTruthy();
  }
});

for (const [path, title] of [["/noticias", "Acompanhe o IFMT Cáceres"], ["/editais", "Seleções e apoio ao estudante"], ["/agenda-institucional", "Planeje sua rotina no campus"]]) {
  test(`official guides remain accessible on ${path}`, async ({ page }) => {
    await page.goto(path);
    const resources = page.getByRole("region", { name: title });
    await expect(resources).toBeVisible();
    await expect(resources.getByRole("link", { name: /Ver orientação/ })).toHaveCount(3);
  });
}
