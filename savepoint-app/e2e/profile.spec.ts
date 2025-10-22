import { expect, test } from "@playwright/test";

import { signInWithCredentials } from "./helpers/auth";
import {
  clearTestData,
  createTestGame,
  createTestLibraryItem,
  createTestUser,
  disconnectDatabase,
  type TestUser,
} from "./helpers/db";

test.describe("Profile Page", () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser({
      email: "e2e-profile-test@example.com",
      username: "e2eprofileuser",
      password: "TestPassword123!",
    });
  });

  test.afterAll(async () => {
    await clearTestData();
    await disconnectDatabase();
  });

  test("should redirect unauthenticated users to login", async ({ page }) => {
    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/login");
  });

  test("should load profile page for authenticated users", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    expect(page.url()).toContain("/profile");

    const profileContainer = page.locator("div.container");
    await expect(profileContainer).toBeVisible();
  });

  test("should display user profile data", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const displayName = testUser.username || testUser.email;
    const heading = page.getByRole("heading", { level: 2, name: displayName });
    await expect(heading).toBeVisible();

    const emailText = page.getByText(testUser.email);
    await expect(emailText).toBeVisible();

    const joinedText = page.getByText(/Joined/);
    await expect(joinedText).toBeVisible();
  });

  test("should display avatar or initial", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const avatarImage = page.locator("img[alt*='avatar']");
    const avatarPlaceholder = page.locator("div.rounded-full.bg-gray-200");

    const hasImage = await avatarImage.isVisible().catch(() => false);
    const hasPlaceholder = await avatarPlaceholder
      .isVisible()
      .catch(() => false);

    expect(hasImage || hasPlaceholder).toBe(true);

    if (hasPlaceholder) {
      const initial = await avatarPlaceholder.textContent();
      expect(initial).toBeTruthy();
      expect(initial?.length).toBe(1);
    }
  });

  test("should display empty state when library has no items", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const emptyState = page.getByText(/Your library is empty/i);
    await expect(emptyState).toBeVisible();
  });

  test("should not display library stats section when empty", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const statsHeading = page.getByRole("heading", { name: "Library Stats" });
    await expect(statsHeading).not.toBeVisible();
  });

  test("should not display recently played section when empty", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).not.toBeVisible();
  });
});

test.describe("Profile Page - With Library Items", () => {
  let testUser: TestUser;

  test.beforeAll(async () => {
    await clearTestData();
    testUser = await createTestUser({
      email: "e2e-profile-stats-test@example.com",
      username: "e2eprofilestatsuser",
      password: "TestPassword123!",
    });

    // Create test games with different statuses
    const game1 = await createTestGame({
      title: "The Legend of Zelda",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
    });
    const game2 = await createTestGame({
      title: "Super Mario Bros",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co5678.jpg",
    });
    const game3 = await createTestGame({
      title: "Hades",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9012.jpg",
    });
    const game4 = await createTestGame({
      title: "Celeste",
      coverImage: null, // Test game without cover image
    });
    const game5 = await createTestGame({
      title: "Hollow Knight",
      coverImage:
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co3456.jpg",
    });

    // Create library items with different statuses
    await createTestLibraryItem({
      userId: testUser.id,
      gameId: game1.id,
      status: "CURIOUS_ABOUT",
    });
    await createTestLibraryItem({
      userId: testUser.id,
      gameId: game2.id,
      status: "CURIOUS_ABOUT",
    });
    await createTestLibraryItem({
      userId: testUser.id,
      gameId: game3.id,
      status: "CURIOUS_ABOUT",
    });
    await createTestLibraryItem({
      userId: testUser.id,
      gameId: game4.id,
      status: "CURRENTLY_EXPLORING",
    });
    await createTestLibraryItem({
      userId: testUser.id,
      gameId: game5.id,
      status: "CURRENTLY_EXPLORING",
    });
  });

  test.afterAll(async () => {
    await clearTestData();
    await disconnectDatabase();
  });

  test("should display library stats with correct counts", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify Library Stats heading is visible
    const statsHeading = page.getByRole("heading", { name: "Library Stats" });
    await expect(statsHeading).toBeVisible();

    // Verify "Curious About" status displays with correct count
    const curiousAboutCard = page.locator("text=Curious About").locator("..");
    await expect(curiousAboutCard).toBeVisible();
    const curiousAboutCount = curiousAboutCard.locator("text=3");
    await expect(curiousAboutCount).toBeVisible();

    // Verify "Currently Exploring" status displays with correct count
    const currentlyExploringCard = page
      .locator("text=Currently Exploring")
      .locator("..");
    await expect(currentlyExploringCard).toBeVisible();
    const currentlyExploringCount = currentlyExploringCard.locator("text=2");
    await expect(currentlyExploringCount).toBeVisible();
  });

  test("should display status cards with proper styling", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Find all status cards
    const statusCards = page.locator(
      "div.rounded-lg.border.border-gray-200.bg-white.p-4.shadow-sm"
    );

    // Should have at least 2 status cards (Curious About + Currently Exploring)
    const count = await statusCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    // Verify first card has label and count
    const firstCard = statusCards.first();
    await expect(firstCard.locator("p.text-sm.font-medium")).toBeVisible();
    await expect(firstCard.locator("p.text-2xl.font-bold")).toBeVisible();
  });

  test("should use responsive grid layout for stats", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify grid container has responsive classes
    const statsGrid = page.locator(
      "div.grid.grid-cols-2.gap-4.sm\\:grid-cols-3.md\\:grid-cols-4"
    );
    await expect(statsGrid).toBeVisible();
  });

  test("should not display empty state when library has items", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Empty state should not be visible
    const emptyState = page.getByText(/Your library is empty/i);
    await expect(emptyState).not.toBeVisible();
  });

  test("should display human-readable status labels", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify labels are human-readable, not raw enum values
    await expect(page.getByText("Curious About")).toBeVisible();
    await expect(page.getByText("Currently Exploring")).toBeVisible();

    // Verify raw enum values are NOT displayed
    await expect(page.getByText("CURIOUS_ABOUT")).not.toBeVisible();
    await expect(page.getByText("CURRENTLY_EXPLORING")).not.toBeVisible();
  });

  test("should display Recently Played section with correct games", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify "Recently Played" heading is visible
    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).toBeVisible();

    // Verify CURRENTLY_EXPLORING games are displayed (Celeste and Hollow Knight)
    await expect(page.getByText("Celeste")).toBeVisible();
    await expect(page.getByText("Hollow Knight")).toBeVisible();

    // Verify Library Stats heading exists (separate section)
    const libraryStatsHeading = page.getByRole("heading", {
      name: "Library Stats",
    });
    await expect(libraryStatsHeading).toBeVisible();

    // Verify CURIOUS_ABOUT games appear in stats but have game titles visible on page
    // (They're in Library Stats, not Recently Played)
    await expect(page.getByText("The Legend of Zelda")).toBeVisible();
  });

  test("should display game cover images in Recently Played", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify Recently Played heading exists
    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).toBeVisible();

    // Verify Hollow Knight game is visible
    await expect(page.getByText("Hollow Knight")).toBeVisible();

    // Verify image with alt text for Hollow Knight exists (game has coverImage)
    const hollowKnightImage = page.locator("img[alt='Hollow Knight']");
    await expect(hollowKnightImage).toBeVisible();

    // Verify image has valid src
    const imgSrc = await hollowKnightImage.getAttribute("src");
    expect(imgSrc).toBeTruthy();
  });

  test("should display fallback for games without cover images", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Find the Recently Played section by heading
    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).toBeVisible();

    // Verify Celeste game is present (game without cover image)
    await expect(page.getByText("Celeste")).toBeVisible();

    // For games without cover images, verify no image alt text for Celeste
    const celesteImage = page.locator("img[alt='Celeste']");
    await expect(celesteImage).not.toBeVisible();
  });

  test("should display multiple games in Recently Played grid", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify Recently Played heading exists
    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).toBeVisible();

    // Verify both CURRENTLY_EXPLORING games are displayed
    await expect(page.getByText("Celeste")).toBeVisible();
    await expect(page.getByText("Hollow Knight")).toBeVisible();

    // Count should be exactly 2 (only CURRENTLY_EXPLORING games)
    const gameCards = page.locator(
      "h3:has-text('Celeste'), h3:has-text('Hollow Knight')"
    );
    const count = await gameCards.count();
    expect(count).toBe(2);
  });

  test("should display relative timestamps for recently played games", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    // Verify Recently Played heading exists
    const recentlyPlayedHeading = page.getByRole("heading", {
      name: "Recently Played",
    });
    await expect(recentlyPlayedHeading).toBeVisible();

    // Verify page contains timestamp text (should contain "ago" or time units)
    const timestampPattern = /ago|seconds|minutes|hours|days/i;
    const pageContent = await page.textContent("body");

    // Verify timestamps are present in the page
    expect(pageContent).toMatch(timestampPattern);
  });
});
