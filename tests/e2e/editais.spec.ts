import { expect, test } from "@playwright/test";

test("visitor filters reviewed notices and reads correction in the same item", async ({ page }) => {
  await page.goto("/editais");
  await expect(page.getByRole("heading", { name: "Central de editais", exact: true })).toBeVisible();
  await expect(page.getByRole("combobox", { name: "Campus", exact: true })).toHaveValue("Cáceres");
  await expect(page.locator("article#ifmt-caceres-39-2026")).toBeVisible();
  await expect(page.locator("article#ifmt-varzea-grande-34-2026")).toHaveCount(0);
  const notice = page.locator("article#ifmt-caceres-14-2026");
  await notice.locator("summary").click();
  await expect(notice.getByRole("link", { name: "Retificação do cronograma" })).toHaveAttribute("href", /drive\.google\.com\/file\/d\//);
  await expect(notice.getByRole("link", { name: "Ver edital oficial" })).toHaveAttribute("href", /^https:\/\/ifmt\.edu\.br\//);
  await expect(notice.getByRole("link", { name: "Inscrever-se" })).toHaveCount(0);
  await page.getByRole("combobox", { name: "Campus", exact: true }).selectOption("all");
  await page.getByLabel("Texto ou número").fill("34/2026");
  await page.getByRole("button", { name: "Aplicar filtros" }).click();
  await expect(page.locator("article#ifmt-varzea-grande-34-2026")).toBeVisible();
  await expect(page.getByText(/O horário de fechamento diverge/)).toBeVisible();
});

test("public favorites persist locally and mark changed revisions", async ({ page }) => {
  await page.goto("/editais");
  const notice = page.locator("article#ifmt-caceres-39-2026");
  await notice.getByRole("button", { name: "Favoritar", exact: true }).click();
  await page.reload();
  await expect(notice.getByRole("button", { name: "Remover favorito" })).toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Mostrar só favoritos" }).click();
  await expect(page.locator("article#ifmt-caceres-14-2026")).toHaveCount(0);
  await page.evaluate(() => localStorage.setItem("sifcas-public-notice-favorites-v1", JSON.stringify({ "ifmt-caceres-39-2026": { revision: "versao-antiga" } })));
  await page.reload();
  await expect(notice.getByText("Há uma atualização desde a sua última leitura.")).toBeVisible();
  await notice.getByRole("button", { name: "Marcar atualização como lida" }).click();
  await expect(notice.getByText("Há uma atualização desde a sua última leitura.")).toHaveCount(0);
});

test("public calendar refuses unknown identifiers and expired deadlines", async ({ request }) => {
  expect((await request.get("/editais/agenda?id=another-users-private-publication")).status()).toBe(404);
  expect((await request.get("/editais/agenda?id=ifmt-caceres-14-2026")).status()).toBe(409);
});
