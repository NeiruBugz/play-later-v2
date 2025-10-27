import * as path from "path";
import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import {
  clearTestData,
  createTestUser,
  disconnectDatabase,
  type TestUser,
} from "./helpers/db";

test.describe("Avatar Upload", () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    await clearTestData();

    testUser = await createTestUser({
      email: "e2e-avatar-test@example.com",
      username: "avataruser",
      password: "TestPassword123!",
    });
  });

  test.afterAll(async () => {
    await clearTestData();
    await disconnectDatabase();
  });

  test("uploads avatar and displays in profile view", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const uploadButton = page.getByRole("button", {
      name: "Upload avatar",
    });
    await expect(uploadButton).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await expect(fileInput).toBeAttached();

    const testImagePath = path.join(__dirname, "fixtures", "test-avatar.png");
    await fileInput.setInputFiles(testImagePath);

    const previewImage = page.locator('img[alt*="Selected avatar preview"]');
    await expect(previewImage).toBeVisible({ timeout: 5000 });

    const uploadActionButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await expect(uploadActionButton).toBeVisible();
    await expect(uploadActionButton).toBeEnabled();

    await uploadActionButton.click();

    const uploadingIndicator = page.getByText("Uploading...");
    await expect(uploadingIndicator).toBeVisible({ timeout: 2000 });

    const successToast = page.getByText("Profile image uploaded successfully");
    await expect(successToast).toBeVisible({ timeout: 10000 });

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const profileAvatar = page.locator(
      `img[alt="${testUser.username}'s avatar"]`
    );
    await expect(profileAvatar).toBeVisible({ timeout: 5000 });

    const avatarSrc = await profileAvatar.getAttribute("src");
    expect(avatarSrc).toBeTruthy();
    expect(avatarSrc).toContain("test-avatar");
  });

  test("avatar persists after page reload", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, "fixtures", "test-avatar.png");
    await fileInput.setInputFiles(testImagePath);

    const uploadActionButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await expect(uploadActionButton).toBeVisible();
    await uploadActionButton.click();

    const successToast = page.getByText("Profile image uploaded successfully");
    await expect(successToast).toBeVisible({ timeout: 10000 });

    await page.reload();
    await page.waitForLoadState("networkidle");

    const currentAvatar = page.locator('img[alt*="Current avatar"]');
    await expect(currentAvatar).toBeVisible({ timeout: 5000 });

    const avatarSrc = await currentAvatar.getAttribute("src");
    expect(avatarSrc).toBeTruthy();
    expect(avatarSrc).toContain("test-avatar");
  });

  test("displays validation error for file size exceeding 5MB", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const largeFileBuffer = Buffer.alloc(6 * 1024 * 1024);
    const largeFile = {
      name: "large-avatar.png",
      mimeType: "image/png",
      buffer: largeFileBuffer,
    };

    await page.evaluate(
      ({ fileName, buffer }) => {
        const blob = new Blob([new Uint8Array(buffer)], {
          type: "image/png",
        });
        const file = new File([blob], fileName, { type: "image/png" });

        const input = document.querySelector(
          'input[type="file"]'
        ) as HTMLInputElement;
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(file);
        input.files = dataTransfer.files;
        input.dispatchEvent(new Event("change", { bubbles: true }));
      },
      { fileName: largeFile.name, buffer: Array.from(largeFileBuffer) }
    );

    const errorMessage = page.getByText(
      "File size exceeds 5MB. Please upload a smaller image."
    );
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    const uploadButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await expect(uploadButton).not.toBeVisible();
  });

  test("displays validation error for unsupported file format", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

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

    const errorMessage = page.getByText(
      "Unsupported file format. Please upload a JPG, PNG, GIF, or WebP image."
    );
    await expect(errorMessage).toBeVisible({ timeout: 3000 });

    const uploadButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await expect(uploadButton).not.toBeVisible();
  });

  test("allows canceling avatar selection before upload", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, "fixtures", "test-avatar.png");
    await fileInput.setInputFiles(testImagePath);

    const previewImage = page.locator('img[alt*="Selected avatar preview"]');
    await expect(previewImage).toBeVisible({ timeout: 5000 });

    const cancelButton = page.getByRole("button", {
      name: "Cancel",
    });
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();

    await expect(previewImage).not.toBeVisible();

    const uploadButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await expect(uploadButton).not.toBeVisible();
  });

  test("supports drag and drop file upload", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const testImagePath = path.join(__dirname, "fixtures", "test-avatar.png");

    const dropZone = page.getByRole("button", {
      name: "Upload avatar",
    });
    await expect(dropZone).toBeVisible();

    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles(testImagePath);

    const previewImage = page.locator('img[alt*="Selected avatar preview"]');
    await expect(previewImage).toBeVisible({ timeout: 5000 });

    const uploadActionButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await expect(uploadActionButton).toBeVisible();
  });

  test("updates avatar in profile settings after successful upload", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const fileInput = page.locator('input[type="file"]');
    const testImagePath = path.join(__dirname, "fixtures", "test-avatar.png");
    await fileInput.setInputFiles(testImagePath);

    const uploadActionButton = page.getByRole("button", {
      name: "Upload",
      exact: true,
    });
    await uploadActionButton.click();

    const successToast = page.getByText("Profile image uploaded successfully");
    await expect(successToast).toBeVisible({ timeout: 10000 });

    const currentAvatar = page.locator('img[alt*="Current avatar"]');
    await expect(currentAvatar).toBeVisible({ timeout: 5000 });

    const previewImage = page.locator('img[alt*="Selected avatar preview"]');
    await expect(previewImage).not.toBeVisible();
  });
});
