import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: false,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  // Use single worker to prevent race conditions (tests share the same user)
  workers: 1,
  reporter: process.env.CI ? "github" : "html",

  globalSetup: "./e2e/global-setup.ts",
  globalTeardown: "./e2e/global-teardown.ts",
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
      name: "setup",
      testMatch: /.*auth\.setup\.ts/,
    },

    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: "pnpm dev",
    url: "http://localhost:6060",
    reuseExistingServer: !process.env.CI,
    timeout: 120 * 1000,
  },
});
