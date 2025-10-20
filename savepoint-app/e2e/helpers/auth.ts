import type { Page } from "@playwright/test";

/**
 * Authentication helper utilities for E2E tests
 */

/**
 * Signs in a user with email and password credentials
 * Note: This requires AUTH_ENABLE_CREDENTIALS=true in your .env file for development/testing
 *
 * @param page - Playwright page object
 * @param email - User email address
 * @param password - User password
 */
export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Navigate to sign-in page
  await page.goto("/auth/signin");

  // Fill in email and password
  await page.fill('input[name="email"]', email);
  await page.fill('input[name="password"]', password);

  // Submit the form
  await page.click('button[type="submit"]');

  // Wait for navigation after successful sign-in
  await page.waitForURL("/", { timeout: 10000 });
}

/**
 * Signs out the currently authenticated user
 *
 * @param page - Playwright page object
 */
export async function signOut(page: Page): Promise<void> {
  // Click the sign-out button/link
  // Adjust the selector based on your actual UI implementation
  await page.click('button:has-text("Sign Out")');

  // Wait for navigation to sign-in page or home page
  await page.waitForLoadState("networkidle");
}

/**
 * Checks if a user is currently authenticated
 *
 * @param page - Playwright page object
 * @returns True if user is authenticated, false otherwise
 */
export async function isAuthenticated(page: Page): Promise<boolean> {
  // Check for presence of authenticated user indicator
  // Adjust the selector based on your actual UI implementation
  const userMenu = page.locator('[data-testid="user-menu"]');
  return userMenu.isVisible();
}

/**
 * Gets the current session from the page context
 * Useful for debugging and verification
 *
 * @param page - Playwright page object
 * @returns Session data or null
 */
export async function getSession(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    // This assumes you expose session data via a global variable or API
    // Adjust based on your actual implementation
    return fetch("/api/auth/session").then((res) => res.json());
  });
}
