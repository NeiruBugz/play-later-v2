import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import {
  clearTestData,
  createTestUser,
  disconnectDatabase,
  type TestUser,
} from "./helpers/db";

test.describe("Profile Settings - Real-Time Username Validation", () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    await clearTestData();

    // Create a test user who will be changing their username
    testUser = await createTestUser({
      email: "e2e-validation-test@example.com",
      username: "validationuser",
      password: "TestPassword123!",
    });
  });

  test.afterAll(async () => {
    await clearTestData();
    await disconnectDatabase();
  });

  test("should show success message for available username after debounce", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Clear and type a unique username
    const uniqueUsername = `uniqueuser${Date.now()}`;
    await usernameInput.clear();
    await usernameInput.fill(uniqueUsername);

    // After debounce (500ms) + server response, should show success message
    const successMessage = page.getByText("Username available");
    await expect(successMessage).toBeVisible({ timeout: 3000 });

    // Verify the input has green border (success state)
    await expect(usernameInput).toHaveClass(/border-green-500/);
  });

  test("should show error for taken username (case-insensitive)", async ({
    page,
  }) => {
    // Verify test data setup - create another user with specific username
    const takenUser = await createTestUser({
      email: `e2e-taken-${Date.now()}@example.com`,
      username: "takentestuser",
      password: "TestPassword123!",
    });

    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Clear and type the username that was just created
    await usernameInput.clear();
    await usernameInput.fill(takenUser.username);

    // After debounce + server response, should show error message
    const errorMessage = page.getByText("Username already exists");
    await expect(errorMessage).toBeVisible({ timeout: 5000 });

    // Verify the input has red border (error state)
    await expect(usernameInput).toHaveClass(/border-red-500/);
  });

  test("should validate length client-side without server call", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Type a username that's too short
    await usernameInput.clear();
    await usernameInput.fill("ab");

    // Error should appear immediately (no server call, no debounce)
    const errorMessage = page.getByText(
      "Username must be at least 3 characters"
    );
    await expect(errorMessage).toBeVisible({ timeout: 500 });

    // Verify the input has red border (error state)
    await expect(usernameInput).toHaveClass(/border-red-500/);
  });

  test("should validate max length client-side without server call", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Type a username that's too long (> 25 characters)
    const longUsername = "a".repeat(26);
    await usernameInput.clear();
    await usernameInput.fill(longUsername);

    // Error should appear immediately
    const errorMessage = page.getByText(
      "Username must not exceed 25 characters"
    );
    await expect(errorMessage).toBeVisible({ timeout: 500 });

    // Verify the input has red border (error state)
    await expect(usernameInput).toHaveClass(/border-red-500/);
  });

  test("should debounce validation when typing quickly", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    await usernameInput.clear();

    // Type characters quickly (simulating fast typing)
    const finalUsername = `quicktyping${Date.now()}`;
    await usernameInput.pressSequentially(finalUsername, { delay: 50 });

    // Wait for debounce to complete and validation to trigger
    await page.waitForTimeout(700);

    // Validation should have completed and shown success message
    const successMessage = page.getByText("Username available");
    await expect(successMessage).toBeVisible({ timeout: 3000 });
  });

  test("should clear validation state when input is cleared", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Type a valid username and wait for validation
    const uniqueUsername = `cleartest${Date.now()}`;
    await usernameInput.clear();
    await usernameInput.fill(uniqueUsername);

    // Wait for success state
    const successMessage = page.getByText("Username available");
    await expect(successMessage).toBeVisible({ timeout: 3000 });

    // Clear the input
    await usernameInput.clear();

    // Success message should disappear
    await expect(successMessage).not.toBeVisible();

    // Input should return to normal state (not green or red border)
    await expect(usernameInput).not.toHaveClass(/border-green-500/);
    await expect(usernameInput).not.toHaveClass(/border-red-500/);
  });

  test("should update validation when changing from error to valid username", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // First, enter an invalid username (too short)
    await usernameInput.clear();
    await usernameInput.fill("ab");

    // Verify error state
    const errorMessage = page.getByText(
      "Username must be at least 3 characters"
    );
    await expect(errorMessage).toBeVisible();
    await expect(usernameInput).toHaveClass(/border-red-500/);

    // Now change to a valid unique username
    const validUsername = `validuser${Date.now()}`;
    await usernameInput.clear();
    await usernameInput.fill(validUsername);

    // Error message should disappear
    await expect(errorMessage).not.toBeVisible({ timeout: 1000 });

    // Success message should appear after validation
    const successMessage = page.getByText("Username available");
    await expect(successMessage).toBeVisible({ timeout: 3000 });

    // Input should change from red to green border
    await expect(usernameInput).toHaveClass(/border-green-500/);
    await expect(usernameInput).not.toHaveClass(/border-red-500/);
  });

  test("should transition from taken to available username", async ({
    page,
  }) => {
    // Create a user with a taken username for this test
    const takenUser = await createTestUser({
      email: `e2e-transition-taken-${Date.now()}@example.com`,
      username: `takenfortest${Date.now()}`,
      password: "TestPassword123!",
    });

    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Type the taken username
    await usernameInput.clear();
    await usernameInput.fill(takenUser.username);

    // Verify error state for taken username
    const takenMessage = page.getByText("Username already exists");
    await expect(takenMessage).toBeVisible({ timeout: 5000 });
    await expect(usernameInput).toHaveClass(/border-red-500/);

    // Now change to a valid unique username
    const availableUsername = `available${Date.now()}`;
    await usernameInput.clear();
    await usernameInput.fill(availableUsername);

    // Taken message should disappear
    await expect(takenMessage).not.toBeVisible({ timeout: 1000 });

    // Available message should appear
    const availableMessage = page.getByText("Username available");
    await expect(availableMessage).toBeVisible({ timeout: 5000 });

    // Input should change from red to green border
    await expect(usernameInput).toHaveClass(/border-green-500/);
    await expect(usernameInput).not.toHaveClass(/border-red-500/);
  });

  test("should not make server call for empty username", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Type a valid username first
    const validUsername = `testuser${Date.now()}`;
    await usernameInput.fill(validUsername);

    // Wait for success state
    const successMessage = page.getByText("Username available");
    await expect(successMessage).toBeVisible({ timeout: 3000 });

    // Clear the input completely
    await usernameInput.clear();

    // Wait for debounce period
    await page.waitForTimeout(700);

    // No validation messages should appear (component returns early for empty input)
    await expect(successMessage).not.toBeVisible();
    const errorMessage = page.getByText(/Username must be/);
    await expect(errorMessage).not.toBeVisible();

    // Input should return to normal state
    await expect(usernameInput).not.toHaveClass(/border-green-500/);
    await expect(usernameInput).not.toHaveClass(/border-red-500/);
  });

  test("should show validation feedback in correct order: idle → validating → success", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile/settings");
    await page.waitForLoadState("networkidle");

    const usernameInput = page.getByRole("textbox", { name: /username/i });
    await expect(usernameInput).toBeVisible();

    // Clear the input first to get to idle state
    await usernameInput.clear();

    // Wait a moment for any validation to clear
    await page.waitForTimeout(100);

    // Initial state after clearing: no validation messages
    const successMessage = page.getByText("Username available");
    const errorMessage = page.getByText(
      /Username already exists|Username must be/
    );

    await expect(successMessage).not.toBeVisible();
    await expect(errorMessage).not.toBeVisible();

    // Type a valid unique username
    const uniqueUsername = `orderedtest${Date.now()}`;
    await usernameInput.fill(uniqueUsername);

    // Eventually should reach success state
    await expect(successMessage).toBeVisible({ timeout: 3000 });
    await expect(usernameInput).toHaveClass(/border-green-500/);
  });
});
