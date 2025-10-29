import * as path from "path";
import { fileURLToPath } from "url";
import { expect, test } from "@playwright/test";

import {
  createTestUserWithoutUsername,
  disconnectDatabase,
} from "./helpers/db";
import { signInWithCredentials } from "./helpers/auth";
import { ProfileSetupPage } from "./pages/profile-setup.page";

/*
Story: As a first-time user, I can optionally complete profile setup (username + avatar) or skip it.
Acceptance Criteria (Slice 10):
- Setup page shows for new users without a username
- Can complete setup: set username (validated) and upload avatar, then redirected to dashboard
- Can skip setup: redirected to dashboard without changes
*/

test.describe("[setup] Profile Setup — First-time user flow", () => {
  test.afterAll(async () => {
    await disconnectDatabase();
  });

  test("Scenario: Complete setup with username and avatar redirects to dashboard", async ({
    page,
  }) => {
    const email = `e2e-setup-complete-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    await createTestUserWithoutUsername({ email, password, name: "E2E User" });

    // Sign in as the new user (credentials enabled in E2E)
    await signInWithCredentials(page, email, password);

    const setup = new ProfileSetupPage(page);
    await setup.goto();
    await expect(setup.heading()).toBeVisible();

    const newUsername = `firsttime${Date.now()}`;
    await setup.typeUsername(newUsername);
    await expect(setup.usernameAvailableMessage()).toBeVisible({
      timeout: 5000,
    });

    // Upload avatar
    const here = path.dirname(fileURLToPath(import.meta.url));
    const testImagePath = path.join(here, "fixtures", "test-avatar.png");
    await setup.selectAvatarFromPath(testImagePath);
    await expect(setup.previewAvatar()).toBeVisible({ timeout: 5000 });
    await setup.submitAvatarUpload();

    // Submit setup
    await setup.completeSetupButton().click();
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });

    // Sanity: profile shows the chosen username
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: newUsername })
    ).toBeVisible();
    const avatarImage = page.locator("img[alt*='avatar']");
    await expect(avatarImage).toBeVisible();
  });

  test("Scenario: Skip setup redirects to dashboard and uses defaults", async ({
    page,
  }) => {
    const email = `e2e-setup-skip-${Date.now()}@example.com`;
    const password = "TestPassword123!";

    await createTestUserWithoutUsername({ email, password, name: "Skip User" });

    // Sign in as the new user
    await signInWithCredentials(page, email, password);

    const setup = new ProfileSetupPage(page);
    await setup.goto();
    await expect(setup.heading()).toBeVisible();

    await setup.skipButton().click();
    await page.waitForURL(/\/dashboard$/, { timeout: 10000 });

    // Sanity: profile uses email as display name (username not set)
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(page.getByText(email)).toBeVisible();
  });
});

