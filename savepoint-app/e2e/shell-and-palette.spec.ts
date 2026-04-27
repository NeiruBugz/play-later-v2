import { expect, test } from "@playwright/test";

import {
  cleanupUserTestData,
  createTestGame,
  createTestJournalEntry,
  createTestLibraryItem,
  disconnectDatabase,
  getUserByEmail,
} from "./helpers/db";
import { CommandPalettePage } from "./pages/command-palette.page";
import { SettingsShellPage } from "./pages/settings-shell.page";

const AUTH_USER_EMAIL = "e2e-auth-user@example.com";

// ---------------------------------------------------------------------------
// Desktop shell — left rail + command palette
// ---------------------------------------------------------------------------
test.describe("[shell] Desktop left rail", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ mode: "serial" });

  test("desktop sidebar rail is visible", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    // The shadcn Sidebar renders as <aside> on desktop
    const sidebar = page.locator("aside").first();
    await expect(sidebar).toBeVisible();
  });

  const NAV_ITEMS = [
    { label: "Library", path: "/library" },
    { label: "Journal", path: "/journal" },
    { label: "Profile", path: "/profile" },
    { label: "Settings", path: "/settings" },
  ];

  for (const { label, path } of NAV_ITEMS) {
    test(`clicking "${label}" nav link changes URL to ${path}`, async ({
      page,
    }) => {
      await page.goto("/library");
      await page.waitForLoadState("networkidle");

      const navLink = page
        .locator("aside")
        .getByRole("link", { name: label })
        .first();
      await navLink.click();

      await page.waitForURL((url) => url.pathname.startsWith(path), {
        timeout: 10000,
      });
      expect(page.url()).toContain(path);
    });
  }

  test("active nav link has aria-current=page", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    const libraryLink = page
      .locator("aside")
      .getByRole("link", { name: "Library" })
      .first();
    await expect(libraryLink).toHaveAttribute("aria-current", "page");
  });

  test("Ctrl+K opens command palette", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    await page.keyboard.press("Control+k");
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 5000 });
  });

  test("Escape closes command palette and dialog is gone", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    const palette = new CommandPalettePage(page);
    await palette.open();
    await palette.close();

    await expect(page.getByRole("dialog")).not.toBeVisible();
  });

  test("sidebar search trigger button opens command palette", async ({
    page,
  }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    const searchBtn = page
      .locator("aside")
      .getByRole("button", { name: /search/i });
    await searchBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Command palette — quick-add flow
// ---------------------------------------------------------------------------
test.describe("[shell] Command palette quick-add", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("quick-add from Games result shows undo toast", async ({ page }) => {
    const palette = new CommandPalettePage(page);
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    await palette.open();
    await palette.search("Hades");

    // Wait for game results to appear
    const firstResult = page.getByRole("dialog").getByRole("option").first();
    await firstResult.waitFor({ state: "visible", timeout: 10000 });
    await firstResult.click();

    // Undo toast should appear after quick-add
    const undoToast = page.getByText(/added|undo/i).first();
    await expect(undoToast).toBeVisible({ timeout: 10000 });
  });
});

// ---------------------------------------------------------------------------
// Mobile shell — 4-tab bottom nav + topbar search
// ---------------------------------------------------------------------------
test.describe("[shell] Mobile 4-tab nav", () => {
  test.use({ viewport: { width: 390, height: 844 } });
  test.describe.configure({ mode: "serial" });

  test("bottom nav has exactly 4 tabs", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    const bottomNav = page.locator("nav").filter({
      has: page.getByRole("link", { name: "Library" }),
    });

    const tabs = bottomNav.getByRole("link");
    await expect(tabs).toHaveCount(4);
  });

  const MOBILE_TABS = [
    { label: "Library", path: "/library" },
    { label: "Journal", path: "/journal" },
    { label: "Profile", path: "/profile" },
  ];

  for (const { label, path } of MOBILE_TABS) {
    test(`tapping "${label}" tab navigates to ${path}`, async ({ page }) => {
      await page.goto("/library");
      await page.waitForLoadState("networkidle");

      const bottomNav = page.locator("nav").filter({
        has: page.getByRole("link", { name: "Library" }),
      });

      await bottomNav.getByRole("link", { name: label }).click();
      await page.waitForURL((url) => url.pathname.startsWith(path), {
        timeout: 10000,
      });
      expect(page.url()).toContain(path);
    });
  }

  test("mobile topbar search icon opens command palette", async ({ page }) => {
    await page.goto("/library");
    await page.waitForLoadState("networkidle");

    const searchBtn = page.getByRole("button", { name: "Open search" });
    await expect(searchBtn).toBeVisible();
    await searchBtn.click();

    await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5000 });
  });
});

// ---------------------------------------------------------------------------
// Game detail — hero layout + inline status
// ---------------------------------------------------------------------------
test.describe("[shell] Game detail hero", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  let userId: string;
  let gameSlug: string;

  test.beforeAll(async () => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (!user) throw new Error("Auth user not found");
    userId = user.id;

    const uniqueId = Math.floor(Date.now() / 1000) % 100000;
    const game = await createTestGame({
      title: `E2E Hero Game ${uniqueId}`,
      igdbId: 700000 + uniqueId,
      slug: `e2e-hero-game-${uniqueId}`,
    });
    await createTestLibraryItem({
      userId,
      gameId: game.id,
      status: "SHELF",
    });
    gameSlug = `e2e-hero-game-${uniqueId}`;
  });

  test.afterAll(async () => {
    if (userId) await cleanupUserTestData(userId);
    await disconnectDatabase();
  });

  test("game detail page has exactly one h1", async ({ page }) => {
    await page.goto(`/games/${gameSlug}`);
    await page.waitForLoadState("networkidle");

    const h1s = page.locator("h1");
    await expect(h1s).toHaveCount(1);
  });
});

// ---------------------------------------------------------------------------
// Journal entry detail — auto-derived title + delete confirmation
// ---------------------------------------------------------------------------
test.describe("[shell] Journal entry detail", () => {
  test.use({ viewport: { width: 1280, height: 800 } });
  test.describe.configure({ mode: "serial" });

  let userId: string;
  let entryIdNoTitle: string;

  test.beforeAll(async () => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (!user) throw new Error("Auth user not found");
    userId = user.id;

    const uniqueId = Math.floor(Date.now() / 1000) % 100000;
    const game = await createTestGame({
      title: `E2E Journal Shell Game ${uniqueId}`,
      igdbId: 600000 + uniqueId,
      slug: `e2e-journal-shell-${uniqueId}`,
    });

    const entry = await createTestJournalEntry({
      userId,
      gameId: game.id,
      title: undefined,
      content: "Auto-title test content",
    });
    entryIdNoTitle = entry.id;
  });

  test.afterAll(async () => {
    if (userId) await cleanupUserTestData(userId);
    await disconnectDatabase();
  });

  test("entry without title shows auto-derived title as h1", async ({
    page,
  }) => {
    await page.goto(`/journal/${entryIdNoTitle}`);
    await page.waitForLoadState("networkidle");

    const h1 = page.locator("h1");
    await expect(h1).toBeVisible();
    const titleText = await h1.textContent();
    expect(titleText?.trim().length).toBeGreaterThan(0);
  });

  test("delete overflow menu shows confirmation dialog; cancel keeps entry", async ({
    page,
  }) => {
    await page.goto(`/journal/${entryIdNoTitle}`);
    await page.waitForLoadState("networkidle");

    // Open the overflow (⋯) menu and click Delete entry
    const overflowTrigger = page.getByRole("button", {
      name: /more|options|⋯|…/i,
    });
    await overflowTrigger.click();

    const deleteMenuItem = page.getByRole("menuitem", { name: /delete/i });
    await expect(deleteMenuItem).toBeVisible({ timeout: 3000 });
    await deleteMenuItem.click();

    // Confirmation dialog appears
    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible({ timeout: 3000 });

    // Cancel — entry remains
    const cancelBtn = dialog.getByRole("button", { name: /cancel/i });
    await cancelBtn.click();
    await expect(dialog).not.toBeVisible({ timeout: 3000 });

    expect(page.url()).toContain(`/journal/${entryIdNoTitle}`);
  });
});

// ---------------------------------------------------------------------------
// Settings shell — routing + redirect + logout
// ---------------------------------------------------------------------------
test.describe("[shell] Settings shell routing", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("/settings redirects to /settings/profile", async ({ page }) => {
    const settings = new SettingsShellPage(page);
    await settings.gotoRoot();
    expect(page.url()).toContain("/settings/profile");
  });

  test("clicking Account in settings rail navigates to /settings/account", async ({
    page,
  }) => {
    const settings = new SettingsShellPage(page);
    await settings.goto("profile");

    const accountLink = page.getByRole("link", { name: /account/i });
    await accountLink.click();
    await page.waitForURL((url) => url.pathname.includes("/settings/account"), {
      timeout: 10000,
    });
    expect(page.url()).toContain("/settings/account");
  });

  test("logout button is present on /settings/account", async ({ page }) => {
    const settings = new SettingsShellPage(page);
    await settings.goto("account");

    await expect(settings.logoutButton()).toBeVisible();
  });
});

// ---------------------------------------------------------------------------
// Deep link redirect: /profile/settings -> /settings/profile
// ---------------------------------------------------------------------------
test.describe("[shell] Settings deep link redirect", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("/profile/settings redirects to /settings/profile", async ({ page }) => {
    const settings = new SettingsShellPage(page);
    await settings.gotoLegacyPath();
    expect(page.url()).toContain("/settings/profile");
  });
});

// ---------------------------------------------------------------------------
// Public profile — no email visible
// ---------------------------------------------------------------------------
test.describe("[shell] Public profile email invariant", () => {
  test.use({ viewport: { width: 1280, height: 800 } });

  test("public profile page does not expose any email address", async ({
    page,
  }) => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (!user) throw new Error("Auth user not found");

    await page.goto(`/u/${user.username ?? "e2eauthuser"}`);
    await page.waitForLoadState("networkidle");

    const bodyText = await page.locator("body").textContent();
    expect(bodyText ?? "").not.toMatch(/@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/);

    await disconnectDatabase();
  });
});
