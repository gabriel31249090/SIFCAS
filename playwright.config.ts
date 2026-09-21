import { defineConfig, devices } from "@playwright/test";

const host = "127.0.0.1";
const port = 3000;
const localUrl = `http://${host}:${port}`;

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: process.env.PLAYWRIGHT_BASE_URL ?? localUrl,
    colorScheme: "light",
    screenshot: "only-on-failure",
    trace: "on-first-retry",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: process.env.PLAYWRIGHT_BASE_URL ? undefined : {
    command: process.env.CI
      ? `npm run start -- --hostname ${host} --port ${port}`
      : `npm run dev -- --hostname ${host} --port ${port}`,
    url: localUrl,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
