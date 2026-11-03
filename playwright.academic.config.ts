import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/academic-browser", fullyParallel: false, workers: 1, timeout: 90_000,
  use: { baseURL: "http://127.0.0.1:3100", screenshot: "only-on-failure", trace: "retain-on-failure", launchOptions: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ? { executablePath: process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH } : undefined },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
});
