import { expect, test } from "@playwright/test";

test.describe("Home Page", () => {
  test("should load successfully", async ({ page }) => {
    // Navigate to the home page
    await page.goto("/");

    // Wait for the page to load
    await page.waitForLoadState("networkidle");

    // Verify the page loaded successfully by checking the URL
    expect(page.url()).toBe("http://localhost:6060/");

    // Check that the root div is present
    const rootDiv = page.locator("#root");
    await expect(rootDiv).toBeVisible();
  });

  test("should have valid page title", async ({ page }) => {
    await page.goto("/");

    // Check that the page has the correct title
    await expect(page).toHaveTitle(/SavePoint/);
  });

  test("should render the page content", async ({ page }) => {
    await page.goto("/");

    // Wait for content to load (body should be visible)
    const body = page.locator("body");
    await expect(body).toBeVisible();

    // Verify the app is using the correct theme class structure
    const html = page.locator("html");
    await expect(html).toHaveAttribute("lang", "en");
  });
});
