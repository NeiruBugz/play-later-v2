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
  await page.goto("/login");
  await page.waitForLoadState("networkidle");

  await page.fill('input[id="email"]', email);
  await page.fill('input[id="password"]', password);

  await page.click('button[type="submit"]');

  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 10000 });
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
  return page.evaluate(async () => {
    const res = await fetch("/api/auth/session");
    return res.json();
  });
}
