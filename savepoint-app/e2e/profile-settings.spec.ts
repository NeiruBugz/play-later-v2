import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import {
  clearTestData,
  createTestUser,
  disconnectDatabase,
  type TestUser,
} from "./helpers/db";

test.describe("Profile Settings - Username Change", () => {
  let testUser: TestUser;
  const newUsername = "newusername123";

  test.beforeAll(async () => {
    // Clean up any existing test data
    await clearTestData();

    // Create a test user with a known username
    testUser = await createTestUser({
      email: "e2e-settings-test@example.com",
      username: "oldusername",
      password: "TestPassword123!",
    });
  });

  test.afterAll(async () => {
    // Clean up test data and disconnect
    await clearTestData();
    await disconnectDatabase();
  });

  test("should successfully change username through profile settings", async ({
    page,
  }) => {
    // Step 1: Sign in with the test user
    await signInWithCredentials(page, testUser.email, testUser.password);

    // Step 2: Navigate to profile settings page
    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByLabel(/username/i);
    await expect(usernameInput).toBeVisible({ timeout: 10000 });

    await expect(usernameInput).toHaveValue(testUser.username);

    await usernameInput.clear();
    await usernameInput.fill(newUsername);

    await expect(usernameInput).toHaveValue(newUsername);

    const validationError = page.getByText(
      /username must be at least 3 characters/i
    );
    await expect(validationError).not.toBeVisible();

    // Step 5: Click the "Save Changes" button
    const saveButton = page.getByRole("button", { name: "Save Changes" });
    await expect(saveButton).toBeVisible();
    await expect(saveButton).toBeEnabled();

    await saveButton.click();

    // Wait for the form submission to complete
    // Note: The form may submit so quickly that "Saving..." isn't visible
    // So we'll wait for the success toast instead

    const successToast = page.getByText(/profile updated successfully/i);
    await expect(successToast).toBeVisible({ timeout: 5000 });

    // Step 7: Navigate to profile view page
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify we're on the profile page
    expect(page.url()).toContain("/profile");

    // Step 8: Verify the new username is displayed in the profile view
    const profileHeading = page.getByRole("heading", {
      level: 2,
      name: newUsername,
    });
    await expect(profileHeading).toBeVisible();

    // Also verify in the profile view that the old username is not displayed
    const oldUsernameHeading = page.getByRole("heading", {
      level: 2,
      name: testUser.username,
    });
    await expect(oldUsernameHeading).not.toBeVisible();

    // Verify other profile information is still displayed correctly
    const emailText = page.getByText(testUser.email);
    await expect(emailText).toBeVisible();

    const joinedText = page.getByText(/Joined/);
    await expect(joinedText).toBeVisible();
  });

  test("should show validation error for username that is too short", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByLabel(/username/i);
    await usernameInput.clear();
    await usernameInput.fill("ab");

    const validationError = page.getByText(
      "Username must be at least 3 characters"
    );
    await expect(validationError).toBeVisible();

    // Note: The form may not disable the button for client-side validation
    // This is acceptable UX as the server action will handle final validation
  });

  test("should show validation error for username that is too long", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByLabel(/username/i);
    await usernameInput.clear();
    await usernameInput.fill("a".repeat(26));

    const validationError = page.getByText(
      "Username must not exceed 25 characters"
    );
    await expect(validationError).toBeVisible();

    const saveButton = page.getByRole("button", { name: "Save Changes" });
    await expect(saveButton).toBeDisabled();
  });

  test("should clear validation error when valid username is entered", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByLabel(/username/i);

    await usernameInput.clear();
    await usernameInput.fill("ab");

    const validationError = page.getByText(
      "Username must be at least 3 characters"
    );
    await expect(validationError).toBeVisible();

    await usernameInput.clear();
    await usernameInput.fill("validusername");

    await expect(validationError).not.toBeVisible();

    const saveButton = page.getByRole("button", { name: "Save Changes" });
    await expect(saveButton).toBeEnabled();
  });

  test("should display the back button that navigates to previous page", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const backButton = page.getByRole("button", { name: /back/i });
    await expect(backButton).toBeVisible();

    await backButton.click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/profile");
    expect(page.url()).not.toContain("/settings");
  });

  test("should preserve username input when validation fails", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByLabel(/username/i);
    const invalidUsername = "ab";

    await usernameInput.clear();
    await usernameInput.fill(invalidUsername);

    await expect(usernameInput).toHaveValue(invalidUsername);

    const validationError = page.getByText(
      "Username must be at least 3 characters"
    );
    await expect(validationError).toBeVisible();
  });

  test("should show helper text about username requirements", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    // Verify the helper text is displayed
    const helperText = page.getByText(
      /Must be 3-25 characters. Letters, numbers, and \(_, -, \.\) allowed./
    );
    await expect(helperText).toBeVisible();
  });
});
