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

    const profileContainer = page.getByTestId("profile-page");
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
    const avatarPlaceholder = page.getByTestId("profile-avatar-placeholder");

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
    const [game1, game2, game3, game4, game5] = await Promise.all([
      await createTestGame({
        title: "The Legend of Zelda",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
      }),
      await createTestGame({
        title: "Super Mario Bros",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co5678.jpg",
      }),
      await createTestGame({
        title: "Hades",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co9012.jpg",
      }),
      await createTestGame({
        title: "Celeste",
        coverImage: null, // Test game without cover image
      }),
      await createTestGame({
        title: "Hollow Knight",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co3456.jpg",
      }),
    ]);

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

    const statsHeading = page.getByRole("heading", { name: "Library Stats" });
    await expect(statsHeading).toBeVisible();

    await expect(page.getByText("Curious About")).toBeVisible();
    await expect(
      page
        .getByTestId("profile-status-card")
        .filter({ hasText: "Curious About" })
        .getByText("3")
    ).toBeVisible();

    await expect(page.getByText("Currently Exploring")).toBeVisible();
    await expect(
      page
        .getByTestId("profile-status-card")
        .filter({ hasText: "Currently Exploring" })
        .getByText("2")
    ).toBeVisible();
  });

  test("should display status cards with proper styling", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const statusCards = page.getByTestId("profile-status-card");

    const count = await statusCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const firstCard = statusCards.first();
    await expect(firstCard.getByTestId("profile-status-label")).toBeVisible();
    await expect(firstCard.getByTestId("profile-status-count")).toBeVisible();
  });

  test("should use responsive grid layout for stats", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const statsGrid = page.getByTestId("profile-stats-grid");
    await expect(statsGrid).toBeVisible();
    await expect(statsGrid).toHaveCSS("display", "grid");
  });

  test("should not display empty state when library has items", async ({
    page,
  }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    const emptyState = page.getByText(/Your library is empty/i);
    await expect(emptyState).not.toBeVisible();
  });

  test("should display human-readable status labels", async ({ page }) => {
    await signInWithCredentials(page, testUser.email, testUser.password);

    await page.goto("/profile");
    await page.waitForLoadState("networkidle");

    await expect(page.getByText("Curious About")).toBeVisible();
    await expect(page.getByText("Currently Exploring")).toBeVisible();

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

    // Verify the grid of recent games is rendered
    const recentlyPlayedGrid = page.getByTestId("profile-recent-games-grid");
    await expect(recentlyPlayedGrid).toBeVisible();

    const recentGameCards = page.getByTestId("profile-recent-game-card");
    await expect(recentGameCards).toHaveCount(2);

    // Verify CURRENTLY_EXPLORING games are displayed (Celeste and Hollow Knight)
    const recentGameTitles = await recentGameCards.evaluateAll((cards) =>
      cards
        .map((card) =>
          card
            .querySelector("[data-testid='profile-recent-game-title']")
            ?.textContent?.trim()
        )
        .filter((title): title is string => Boolean(title))
    );

    expect(recentGameTitles.sort()).toEqual(
      ["Celeste", "Hollow Knight"].sort()
    );

    // Verify Library Stats heading exists (separate section)
    const libraryStatsHeading = page.getByRole("heading", {
      name: "Library Stats",
    });
    await expect(libraryStatsHeading).toBeVisible();

    const profileStatusCards = page.getByTestId("profile-status-card");
    await expect(profileStatusCards).toHaveCount(2);
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

    // Verify Hollow Knight game card is visible
    const hollowKnightCard = page
      .getByTestId("profile-recent-game-card")
      .filter({ hasText: "Hollow Knight" });
    await expect(hollowKnightCard).toBeVisible();

    // Verify image with alt text for Hollow Knight exists (game has coverImage)
    const hollowKnightImage = hollowKnightCard.locator(
      "img[alt='Hollow Knight']"
    );
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
    const celesteCard = page
      .getByTestId("profile-recent-game-card")
      .filter({ hasText: "Celeste" });
    await expect(celesteCard).toBeVisible();

    // For games without cover images, verify no image alt text for Celeste
    const celesteImage = celesteCard.locator("img[alt='Celeste']");
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
    const recentGameCards = page.getByTestId("profile-recent-game-card");
    await expect(recentGameCards.filter({ hasText: "Celeste" })).toBeVisible();
    await expect(
      recentGameCards.filter({ hasText: "Hollow Knight" })
    ).toBeVisible();

    // Count should be exactly 2 (only CURRENTLY_EXPLORING games)
    await expect(recentGameCards).toHaveCount(2);
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
