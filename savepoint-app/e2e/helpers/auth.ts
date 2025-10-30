import type { Page } from "@playwright/test";

export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  // Ensure a clean, unauthenticated context to avoid redirects away from /login
  await page.context().clearCookies();
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });

  // Navigate to the login page and wait for the form to be present
  await page.goto("/login", { waitUntil: "domcontentloaded" });
  await page.getByRole("textbox", { name: /email/i }).waitFor();

  await page.getByLabel(/email/i).fill(email);
  await page.getByLabel(/password/i).fill(password);

  await page.getByRole("button", { name: "Sign In", exact: true }).click();

  await page.waitForURL((url) => url.pathname !== "/login", { timeout: 10000 });
}

export async function signOut(page: Page): Promise<void> {
  await page.click('button:has-text("Sign Out")');
  await page.waitForLoadState("networkidle");
}

export async function isAuthenticated(page: Page): Promise<boolean> {
  const userMenu = page.locator('[data-testid="user-menu"]');
  return userMenu.isVisible();
}

export async function getSession(page: Page): Promise<unknown> {
  return page.evaluate(async () => {
    const res = await fetch("/api/auth/session");
    return res.json();
  });
}
