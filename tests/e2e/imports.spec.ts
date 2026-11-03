import { expect, test } from "@playwright/test";

test("private import, batches and personal calendar require authentication", async ({ request }) => {
  for (const path of ["/importar-dados-academicos", "/importar-dados-academicos/lotes/20000000-0000-0000-0000-000000000005", "/importar-calendario", "/diario-professor?vinculo=20000000-0000-0000-0000-000000000004"]) {
    const response = await request.get(path, { maxRedirects: 0 });
    expect(response.status()).toBe(307);
    expect(new URL(response.headers().location, response.url()).pathname).toBe("/login");
    expect(response.headers()["cache-control"] ?? "").not.toContain("public");
  }
});

test("synthetic CSV example is accessible publicly without database configuration", async ({ request }) => {
  const response = await request.get("/modelo-importacao-academica.csv");
  expect(response.ok()).toBeTruthy();
  expect(await response.text()).toContain("diary_id");
});

test("notice catalog remains accessible at a narrow viewport", async ({ page }) => {
  await page.setViewportSize({ width: 360, height: 800 });
  await page.goto("/editais");
  await expect(page.getByRole("heading", { name: "Central de editais", exact: true })).toBeVisible();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBeTruthy();
});
