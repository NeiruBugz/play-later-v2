import type { Page } from "@playwright/test";

export async function signInWithCredentials(
  page: Page,
  email: string,
  password: string
): Promise<void> {
  await page.context().clearCookies();
  await page.addInitScript(() => {
    try {
      localStorage.clear();
      sessionStorage.clear();
    } catch {}
  });
  await page.goto("/login", { waitUntil: "networkidle" });

  const emailInput = page.getByRole("textbox", { name: /email/i });
  await emailInput.waitFor({ state: "visible" });
  await emailInput.click();
  await emailInput.fill(email);

  const passwordInput = page.getByLabel(/password/i);
  await passwordInput.click();
  await passwordInput.fill(password);

  // Blur the password field to trigger validation before clicking sign in
  await passwordInput.blur();

  const signInButton = page.getByRole("button", {
    name: "Sign In",
    exact: true,
  });
  await signInButton.click();
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
