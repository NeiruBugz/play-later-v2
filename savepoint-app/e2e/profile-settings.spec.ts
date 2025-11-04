import * as path from "path";
import { fileURLToPath } from "url";
import { expect, test } from "@playwright/test";

import { createTestUser, disconnectDatabase } from "./helpers/db";
import { ProfileSettingsPage } from "./pages/profile-settings.page";

test.describe("[settings] Profile Settings — Manage username and avatar", () => {
  test.afterAll(async () => {
    await disconnectDatabase();
  });

  test("Scenario: Save valid username shows success and updates profile", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const newUsername = `newusername${Date.now()}`;
    await expect(settings.usernameInput()).toBeVisible();
    await settings.changeUsername(newUsername);

    await expect(settings.profileUpdatedToast()).toBeVisible({ timeout: 5000 });

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    await expect(
      page.getByRole("heading", { level: 2, name: newUsername })
    ).toBeVisible();

    await expect(page.getByText(/Joined/)).toBeVisible();
  });

  test("Scenario: Too-short username shows validation error", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await settings.typeUsername("ab");
    await expect(settings.usernameTooShortMessage()).toBeVisible();
  });

  test("Scenario: Too-long username shows validation error and disables save", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await settings.typeUsername("a".repeat(26));
    await expect(settings.usernameTooLongMessage()).toBeVisible();
    await expect(settings.saveButton()).toBeDisabled();
  });

  test("Scenario: Validation clears when switching to valid username", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await settings.typeUsername("ab");
    await expect(settings.usernameTooShortMessage()).toBeVisible();

    await settings.typeUsername("validusername");
    await expect(settings.usernameTooShortMessage()).not.toBeVisible();
    await expect(settings.saveButton()).toBeEnabled();
  });

  test("Scenario: Back button navigates to previous page", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await expect(settings.backButton()).toBeVisible();
    await settings.backButton().click();
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/profile");
    expect(page.url()).not.toContain("/settings");
  });

  test("Scenario: Real-time shows available for unique username", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const unique = `uniqueuser${Date.now()}`;
    await settings.typeUsername(unique);
    await expect(settings.usernameAvailableMessage()).toBeVisible({
      timeout: 3000,
    });
  });

  test("Scenario: Real-time shows taken for existing username (case-insensitive)", async ({
    page,
  }) => {
    const takenUser = await createTestUser({
      email: `e2e-taken-${Date.now()}@example.com`,
      username: "takentestuser",
      password: "TestPassword123!",
    });
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await settings.typeUsername(takenUser.username.toUpperCase());
    await expect(settings.usernameTakenMessage()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Scenario: Debounced validation after fast typing eventually shows available", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await settings.usernameInput().clear();

    const finalUsername = `quicktyping${Date.now()}`;
    await settings
      .usernameInput()
      .pressSequentially(finalUsername, { delay: 50 });
    await expect(settings.usernameAvailableMessage()).toBeVisible({
      timeout: 3000,
    });
  });

  test("Scenario: Clearing input resets validation state", async ({ page }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const unique = `cleartest${Date.now()}`;
    await settings.typeUsername(unique);
    await expect(settings.usernameAvailableMessage()).toBeVisible({
      timeout: 3000,
    });

    await settings.usernameInput().clear();
    await page.waitForTimeout(600);
    await expect(settings.usernameAvailableMessage()).not.toBeVisible();
    await expect(settings.usernameTakenMessage()).not.toBeVisible();
  });

  test("Scenario: Reserved username shows validation error", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    // "admin" is reserved according to validation rules
    await settings.typeUsername("admin");
    await expect(page.getByText("Username is not allowed")).toBeVisible({
      timeout: 3000,
    });
    await expect(settings.saveButton()).toBeDisabled();
  });

  test("Scenario: Profanity-like username shows validation error", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    // "damn" is included in additional profanity checks
    await settings.typeUsername(`damnuser${Date.now()}`);
    await expect(page.getByText("Username is not allowed")).toBeVisible({
      timeout: 3000,
    });
    await expect(settings.saveButton()).toBeDisabled();
  });

  test("Scenario: Transition from taken to available updates feedback", async ({
    page,
  }) => {
    const takenUser = await createTestUser({
      email: `e2e-transition-${Date.now()}@example.com`,
      username: `takenfortest${Date.now()}`,
      password: "TestPassword123!",
    });
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await settings.typeUsername(takenUser.username);
    await expect(settings.usernameTakenMessage()).toBeVisible({
      timeout: 5000,
    });

    const available = `available${Date.now()}`;
    await settings.typeUsername(available);
    await expect(settings.usernameTakenMessage()).not.toBeVisible({
      timeout: 1500,
    });
    await expect(settings.usernameAvailableMessage()).toBeVisible({
      timeout: 5000,
    });
  });

  test("Scenario: Upload avatar and display on profile", async ({ page }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const here = path.dirname(fileURLToPath(import.meta.url));
    const testImagePath = path.join(here, "fixtures", "test-avatar.png");
    await expect(settings.fileInput()).toBeAttached();
    await settings.selectAvatarFromPath(testImagePath);

    await expect(settings.previewAvatar()).toBeVisible({ timeout: 5000 });
    await expect(settings.avatarUploadButton()).toBeVisible({ timeout: 5000 });
    await settings.submitAvatarUpload();

    await expect(settings.avatarUploadSuccessToast()).toBeVisible({
      timeout: 10000,
    });

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");
    const profileAvatar = page.locator("img[alt*='avatar']");
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });
  });

  test("Scenario: Avatar persists after page reload", async ({ page }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const here = path.dirname(fileURLToPath(import.meta.url));
    const testImagePath = path.join(here, "fixtures", "test-avatar.png");
    await settings.selectAvatarFromPath(testImagePath);
    await settings.submitAvatarUpload();
    await expect(settings.avatarUploadSuccessToast()).toBeVisible({
      timeout: 10000,
    });

    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(settings.currentAvatar()).toBeVisible({ timeout: 5000 });
  });

  test("Scenario: Large avatar file shows validation error", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024);
    await page.evaluate(
      ({ fileName, buffer }) => {
        const blob = new Blob([new Uint8Array(buffer)], { type: "image/png" });
        const file = new File([blob], fileName, { type: "image/png" });
        const input = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { fileName: "large-avatar.png", buffer: Array.from(largeFileBuffer) }
    );

    const sizeErrorToast = settings.getToast(
      "File size exceeds 4MB. Please upload a smaller image."
    );
    await expect(sizeErrorToast).toBeVisible({ timeout: 3000 });
    await expect(settings.avatarUploadButton()).not.toBeVisible();
  });

  test("Scenario: Unsupported file format shows validation error", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    await page.evaluate(() => {
      const blob = new Blob(["fake pdf content"], { type: "application/pdf" });
      const file = new File([blob], "document.pdf", {
        type: "application/pdf",
      });
      const input = document.querySelector(
        'input[type="file"]'
      ) as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      input.dispatchEvent(new Event("change", { bubbles: true }));
    });

    const errorToast = settings.getToast(
      "Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image."
    );
    await expect(errorToast).toBeVisible({ timeout: 3000 });
    await expect(settings.avatarUploadButton()).not.toBeVisible();
  });

  test("Scenario: Cancel avatar selection hides preview and upload button", async ({
    page,
  }) => {
    const settings = new ProfileSettingsPage(page);
    await settings.goto();

    const here = path.dirname(fileURLToPath(import.meta.url));
    const testImagePath = path.join(here, "fixtures", "test-avatar.png");
    await settings.selectAvatarFromPath(testImagePath);
    await expect(settings.previewAvatar()).toBeVisible({ timeout: 5000 });

    await expect(settings.avatarCancelButton()).toBeVisible();
    await settings.avatarCancelButton().click();

    await expect(settings.previewAvatar()).not.toBeVisible();
    await expect(settings.avatarUploadButton()).not.toBeVisible();
  });
});
