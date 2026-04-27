import { expect, test } from "@playwright/test";

const THEMES = ["light", "dark", "y2k", "jewel"] as const;

type Theme = (typeof THEMES)[number];

const AUTHENTICATED_SURFACES = [
  { name: "Library", path: "/library" },
  { name: "Journal", path: "/journal" },
  { name: "Profile", path: "/profile" },
  { name: "Settings", path: "/settings/profile" },
] as const;

const UNAUTHENTICATED_SURFACES = [{ name: "Login", path: "/login" }] as const;

async function setTheme(
  page: import("@playwright/test").Page,
  theme: Theme
): Promise<void> {
  await page.addInitScript((t) => {
    localStorage.setItem("theme", t);
  }, theme);
}

for (const theme of THEMES) {
  test.describe(`[themes] Theme: ${theme}`, () => {
    test.describe.configure({ mode: "serial" });

    for (const surface of AUTHENTICATED_SURFACES) {
      test(`${surface.name} page loads without error (${theme})`, async ({
        page,
      }) => {
        await setTheme(page, theme);

        const consoleErrors: string[] = [];
        page.on("console", (msg) => {
          if (msg.type() === "error") consoleErrors.push(msg.text());
        });

        await page.goto(surface.path);
        await page.waitForLoadState("networkidle");

        await expect(page.locator("h1").first()).toBeVisible();

        const criticalErrors = consoleErrors.filter(
          (e) =>
            !e.includes("hydration") &&
            !e.includes("Warning:") &&
            !e.includes("favicon")
        );
        expect(criticalErrors).toHaveLength(0);
      });
    }

    test(`Login page loads without error (${theme})`, async ({ page }) => {
      await setTheme(page, theme);

      const consoleErrors: string[] = [];
      page.on("console", (msg) => {
        if (msg.type() === "error") consoleErrors.push(msg.text());
      });

      await page.goto("/login", { waitUntil: "networkidle" });

      const formOrHeading = page.locator("form, h1").first();
      await expect(formOrHeading).toBeVisible({ timeout: 10000 });

      const criticalErrors = consoleErrors.filter(
        (e) =>
          !e.includes("hydration") &&
          !e.includes("Warning:") &&
          !e.includes("favicon")
      );
      expect(criticalErrors).toHaveLength(0);
    });
  });
}
