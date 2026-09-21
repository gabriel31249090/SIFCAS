import { expect, test } from "@playwright/test";

test("login exposes the stronger policy only for new passwords", async ({ page }) => {
  await page.goto("/login");
  await expect(page).toHaveTitle(/Entrar \| SIFCAS/);
  await expect(page.getByRole("heading", { name: "Bom ter você aqui." })).toBeVisible();
  await page.getByText("Criar minha conta").click();
  await expect(page.getByLabel("Crie uma senha")).toHaveAttribute("minlength", "12");
  await expect(page.getByLabel("Senha", { exact: true })).toHaveAttribute("minlength", "8");
});

test("campus modules are honest non-interactive placeholders", async ({ page }) => {
  await page.goto("/campus");
  await expect(page).toHaveTitle(/Campus Cáceres \| SIFCAS/);
  await expect(page.getByRole("heading", { name: "Campus Cáceres" })).toBeVisible();
  await expect(page.getByText(/roteiro de implantação/)).toBeVisible();
  await expect(page.locator("article.moduleCardStatic")).toHaveCount(6);
  await expect(page.locator("a.moduleCard")).toHaveCount(0);
});

test("public discovery endpoints are available", async ({ request }) => {
  for (const path of ["/robots.txt", "/sitemap.xml", "/manifest.webmanifest"]) {
    const response = await request.get(path);
    expect(response.ok(), `${path} should be available`).toBeTruthy();
  }
});
