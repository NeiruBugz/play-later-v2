import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import { createTestUser, disconnectDatabase } from "./helpers/db";

test.describe("[auth] Returning user login", () => {
  test.use({ storageState: undefined });
  test.afterAll(async () => {
    await disconnectDatabase();
  });
  test.use({ storageState: undefined });

  test("users with username go to dashboard directly (no setup)", async ({
    page,
  }) => {
    const email = `e2e-returning-${Date.now()}@example.com`;
    const password = "TestPassword123!";
    await createTestUser({ email, username: "returninguser", password });

    await signInWithCredentials(page, email, password);

    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/dashboard$/);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: /returninguser/ })
    ).toBeVisible();
  });
});
