import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: 1,
  reporter: process.env.CI ? "github" : "html",
  use: {
    baseURL: "http://localhost:6060",
    trace: "on-first-retry",
    actionTimeout: 30 * 1000,
    screenshot: "only-on-failure",
    video: "retain-on-failure",
  },
  timeout: 60 * 1000,
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:6060",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
