import { expect, test, type BrowserContext } from "@playwright/test";
import { readFileSync } from "node:fs";

async function actor(context: BrowserContext, name: string) {
  const response = await context.request.get(`http://127.0.0.1:54331/__fixture/session?actor=${name}`);
  const fixture = await response.json();
  await context.clearCookies(); await context.addCookies([fixture.cookie]);
  return fixture.session;
}

test("teacher imports once, reimports idempotently, scopes students and reviews conflicts", async ({ page, context }) => {
  await actor(context, "teacher");
  await page.goto("/importar-dados-academicos");
  await expect(page.getByRole("heading", { name: "Importar dados acadêmicos", exact: true })).toBeVisible();
  await page.locator('input[name="file"]').setInputFiles("public/modelo-importacao-academica.csv");
  await page.getByRole("button", { name: "Validar e visualizar prévia" }).click();
  await expect(page.getByRole("heading", { name: "Prévia do diário", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/import-aero-preview.png", fullPage: true });
  await page.locator('input[name="confirmed"]').check();
  await page.getByRole("button", { name: "Confirmar importação", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Recibo de importação", exact: true })).toBeVisible();
  const receiptUrl = page.url();
  await page.getByRole("link", { name: "Abrir turma importada" }).click();
  await expect(page.getByRole("heading", { name: "Dados importados · somente leitura" })).toBeVisible();
  await expect(page.getByText("Matrícula 000001", { exact: false }).first()).toBeVisible();
  await page.goto("/importar-dados-academicos");
  await page.locator('input[name="file"]').setInputFiles("public/modelo-importacao-academica.csv");
  await page.getByRole("button", { name: "Validar e visualizar prévia" }).click();
  await expect(page).toHaveURL(receiptUrl);

  await actor(context, "otherTeacher"); await page.goto(receiptUrl);
  await expect(page.getByRole("heading", { name: "Recibo de importação", exact: true })).toHaveCount(0);
  await actor(context, "student"); await page.goto("/boletim");
  await expect(page.getByRole("heading", { name: "Dados importados · somente leitura" })).toBeVisible();
  await expect(page.getByText("Matrícula 000002", { exact: false })).toHaveCount(0);
  await expect(page.getByText("Matrícula 000001", { exact: false }).first()).toBeVisible();

  await actor(context, "manager"); await page.goto("/importar-dados-academicos");
  const changed = readFileSync("public/modelo-importacao-academica.csv", "utf8").replace("Matemática — turma sintética", "Matemática — turma sintética alterada");
  await page.locator('input[name="file"]').setInputFiles({ name: "conflito-sintetico.csv", mimeType: "text/csv", buffer: Buffer.from(changed) });
  await page.getByRole("button", { name: "Validar e visualizar prévia" }).click();
  await expect(page.getByRole("button", { name: "Confirmar importação", exact: true })).toBeDisabled();
  await page.getByRole("button", { name: "Cancelar e descartar prévia" }).click();
  await expect(page.getByRole("status").filter({ hasText: "Lote cancelado" })).toBeVisible();
});

test("local demonstration starts outside the application and teacher class filters stay scoped", async ({ page, context }) => {
  await context.clearCookies();
  await page.goto("http://127.0.0.1:54331/");
  await expect(page.getByText("DEMONSTRAÇÃO LOCAL · DADOS FICTÍCIOS")).toBeVisible();
  await page.getByRole("link", { name: "Professor", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Olá, Aurora!", exact: true })).toBeVisible();
  await page.goto("/minhas-turmas");
  await expect(page.getByRole("heading", { name: "Minhas turmas", exact: true })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Turma sintética A", exact: true })).toBeVisible();
  await page.screenshot({ path: "test-results/teacher-aero-desktop.png", fullPage: true });
  await page.getByRole("link", { name: "Abrir diário", exact: true }).click();
  const grade = page.locator('input[name="grade:10000000-0000-0000-0000-000000000003"]');
  await grade.evaluate((input) => input.setAttribute("max", "1000"));
  await grade.fill("50");
  await page.getByRole("button", { name: "Salvar notas", exact: true }).click();
  await expect(page.getByText(/Existe uma nota fora do intervalo 0–10/)).toBeVisible();
  await actor(context, "otherTeacher"); await page.goto("/minhas-turmas");
  await expect(page.getByRole("heading", { name: "Turma sintética A", exact: true })).toHaveCount(0);
  await actor(context, "student"); await page.goto("/minhas-turmas");
  await expect(page).toHaveURL(/acesso-negado/);
});

test("private ICS import stays with its owner and Today preserves source states", async ({ page, context }) => {
  await actor(context, "student"); await page.goto("/importar-calendario");
  const ics = "BEGIN:VCALENDAR\r\nVERSION:2.0\r\nBEGIN:VEVENT\r\nUID:agenda-sintetica-001\r\nSUMMARY:Atividade privada sintética\r\nDTSTART;VALUE=DATE:20261104\r\nEND:VEVENT\r\nEND:VCALENDAR\r\n";
  await page.locator('input[name="file"]').setInputFiles({ name: "agenda-sintetica.ics", mimeType: "text/calendar", buffer: Buffer.from(ics) });
  await expect(page.getByText("Prévia: 1 eventos.", { exact: false })).toBeVisible();
  await page.locator('input[name="confirmed"]').check();
  await page.getByRole("button", { name: "Confirmar importação privada" }).click();
  await expect(page.getByText("Atividade privada sintética", { exact: true })).toBeVisible();
  await actor(context, "otherStudent"); await page.goto("/agenda-aluno");
  await expect(page.getByText("Atividade privada sintética", { exact: true })).toHaveCount(0);
  await actor(context, "teacher"); await page.goto("/");
  await expect(page.getByRole("heading", { name: "Olá, Aurora!", exact: true })).toBeVisible();
  await expect(page.getByRole("region", { name: "Estado das fontes" })).toContainText("a configurar");
  await page.screenshot({ path: "test-results/home-aero-desktop.png", fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBeTruthy();
  await page.screenshot({ path: "test-results/home-aero-mobile.png", fullPage: true });
});
