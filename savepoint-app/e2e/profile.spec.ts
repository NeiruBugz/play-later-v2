import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import {
  clearTestData,
  createTestUser,
  disconnectDatabase,
  type TestUser,
} from "./helpers/db";

test.describe("Profile Page", () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser({
      email: "e2e-profile-test@example.com",
      username: "e2eprofileuser",
      password: "TestPassword123!",
    });
  });

  test.afterAll(async () => {
    await clearTestData();
    await disconnectDatabase();
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("should load profile page for authenticated users", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/profile");

    const profileContainer = page.locator("div.container");
    await expect(profileContainer).toBeVisible();
  });

  test("should display user profile data", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const displayName = testUser.username || testUser.email;
    const heading = page.getByRole("heading", { level: 2, name: displayName });
    await expect(heading).toBeVisible();

    const emailText = page.getByText(testUser.email);
    await expect(emailText).toBeVisible();

    const joinedText = page.getByText(/Joined/);
    await expect(joinedText).toBeVisible();
  });

  test("should display avatar or initial", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const avatarImage = page.locator("img[alt*='avatar']");
    const avatarPlaceholder = page.locator("div.rounded-full.bg-gray-200");

    const hasImage = await avatarImage.isVisible().catch(() => false);
    const hasPlaceholder = await avatarPlaceholder
      .isVisible()
      .catch(() => false);

    expect(hasImage || hasPlaceholder).toBe(true);

    if (hasPlaceholder) {
      const initial = await avatarPlaceholder.textContent();
      expect(initial).toBeTruthy();
      expect(initial?.length).toBe(1);
    }
  });

  test("should display empty state when library has no items", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const emptyState = page.getByText(/Your library is empty/i);
    await expect(emptyState).toBeVisible();
  });

  test("should not display library stats section when empty", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const statsHeading = page.getByRole("heading", { name: "Library Stats" });
    await expect(statsHeading).not.toBeVisible();
  });

  test("should not display recently played section when empty", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).not.toBeVisible();
  });
});
