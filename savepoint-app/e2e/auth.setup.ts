import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { test } from "@playwright/test";

import {
  clearTestData,
  createTestUser,
  disconnectDatabase,
} from "./helpers/db";

// This setup project signs in once and saves storage state for reuse.
// It depends on credentials-based auth being enabled for E2E.

const AUTH_USER = {
  email: "e2e-auth-user@example.com",
  username: "e2eauthuser",
  password: "TestPassword123!",
};

test.describe("[setup] authenticate and persist storage state", () => {
  test("authenticate via UI and save storageState", async ({
    page,
    context,
  }) => {
    // Start with a clean DB and ensure the auth user exists
    await clearTestData();
    await createTestUser(AUTH_USER);

    // Sign in via UI
    await page.goto("/login");
    await page.waitForLoadState("networkidle");
    await page.getByLabel(/email/i).fill(AUTH_USER.email);
    await page.getByLabel(/password/i).fill(AUTH_USER.password);
    await page.getByRole("button", { name: "Sign In", exact: true }).click();

    // Consider sign-in successful when we navigate off /login
    await page.waitForURL((url) => url.pathname !== "/login", {
      timeout: 10000,
    });

    // Ensure target directory exists and persist storage state
    const here = path.dirname(fileURLToPath(import.meta.url));
    const authDir = path.join(here, ".auth");
    fs.mkdirSync(authDir, { recursive: true });
    await context.storageState({ path: path.join(authDir, "user.json") });
  });

  test.afterAll(async () => {
    await disconnectDatabase();
  });
});
