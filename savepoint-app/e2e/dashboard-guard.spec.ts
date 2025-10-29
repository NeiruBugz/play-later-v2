import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import {
  createTestUserWithoutUsername,
  disconnectDatabase,
} from "./helpers/db";
import { ProfileSetupPage } from "./pages/profile-setup.page";

test.describe("[guard] Dashboard redirect for first-time users", () => {
  test.afterAll(async () => {
    await disconnectDatabase();
  });

  test("redirects to /profile/setup when user needs setup", async ({
    page,
  }) => {
    const email = `e2e-guard-redirect-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    await createTestUserWithoutUsername({
      email,
      password,
      name: "Guard User",
    });

    await signInWithCredentials(page, email, password);

    // Hitting dashboard should redirect to setup by the server guard
    await page.goto("/dashboard");
    await page.waitForURL(/\/profile\/setup$/, { timeout: 10000 });

    const setup = new ProfileSetupPage(page);
    await expect(setup.heading()).toBeVisible();
  });

  test("allows staying on /dashboard after pressing Skip", async ({ page }) => {
    const email = `e2e-guard-skip-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    await createTestUserWithoutUsername({
      email,
      password,
      name: "Skip Guard",
    });

    await signInWithCredentials(page, email, password);

    // Trigger guard redirect to setup
    await page.goto("/dashboard");
    await page.waitForURL(/\/profile\/setup$/, { timeout: 10000 });

    const setup = new ProfileSetupPage(page);
    await expect(setup.heading()).toBeVisible();

    // Click Skip and confirm we land on dashboard
    await setup.skipButton().click();
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });

    // Navigate to dashboard again; cookie should allow staying
    await page.goto("/dashboard");
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });
    expect(page.url()).toMatch(/\/dashboard$/);
  });
});
