import { resolve } from "path";
import { defineConfig, devices } from "@playwright/test";
import { config } from "dotenv";

// Load environment for E2E tests:
// - In CI: just load .env (CI configures the test database via env vars)
// - Locally: load .env first (for API keys like IGDB), then .env.test (to override database)
if (process.env.CI) {
  config({ path: resolve(import.meta.dirname, ".env") });
} else {
  // First load .env for API credentials (IGDB, Steam, etc.)
  config({ path: resolve(import.meta.dirname, ".env") });
  // Then load .env.test to override database settings with test database
  config({ path: resolve(import.meta.dirname, ".env.test"), override: true });
}

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
    // Never reuse existing server locally - we need the test database connection
    reuseExistingServer: !!process.env.CI,
    timeout: 120 * 1000,
    // Pass environment variables to the dev server
    // In CI, env is already configured; locally, use test database from .env.test
    env: process.env.CI
      ? undefined
      : {
          ...process.env, // Include all current env vars (including IGDB keys from .env)
          // Override database settings with test database
          POSTGRES_PRISMA_URL:
            "postgresql://postgres:postgres@localhost:6432/savepoint-db-test",
          POSTGRES_URL_NON_POOLING:
            "postgresql://postgres:postgres@localhost:6432/savepoint-db-test",
          POSTGRES_URL:
            "postgresql://postgres:postgres@localhost:6432/savepoint-db-test",
          POSTGRES_DATABASE: "savepoint-db-test",
          POSTGRES_URL_NO_SSL:
            "postgresql://postgres:postgres@localhost:6432/savepoint-db-test",
        },
  },
});
