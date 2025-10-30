import { expect, test } from "@playwright/test";

import { getSession } from "./helpers/auth";
import {
  createTestGame,
  createTestLibraryItem,
  disconnectDatabase,
  getUserByEmail,
} from "./helpers/db";
import { ProfilePage } from "./pages/profile.page";

test.describe("Profile Page", () => {
  test.afterAll(async () => {
    await disconnectDatabase();
  });

  test("should load profile page for authenticated users", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    expect(page.url()).toContain("/profile");
    await expect(profile.container()).toBeVisible();
  });

  test("should display user profile data", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    // Validate heading exists and email from session is visible
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const session: any = await getSession(page);
    await expect(profile.heading(2)).toBeVisible();

    if (session?.user?.email) {
      await expect(profile.emailText(session.user.email)).toBeVisible();
    }
    await expect(profile.joinedText()).toBeVisible();
  });

  test("should display avatar or initial", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    const avatarImage = profile.avatarImage();
    const avatarPlaceholder = profile.avatarPlaceholder();

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
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.emptyLibraryText()).toBeVisible();
  });

  test("should not display library stats section when empty", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.statsHeading()).not.toBeVisible();
  });

  test("should not display recently played section when empty", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.recentlyPlayedHeading()).not.toBeVisible();
  });
});

test.describe("Profile Page - With Library Items", () => {
  test.beforeAll(async () => {
    // Seed directly via DB using the known auth user from setup
    const email = process.env.E2E_AUTH_EMAIL ?? "e2e-auth-user@example.com";
    const user = await getUserByEmail(email);
    if (!user) throw new Error("Authenticated user not found in DB");

    // Create test games with different statuses
    const [game1, game2, game3, game4, game5] = await Promise.all([
      createTestGame({
        title: "The Legend of Zelda",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co1234.jpg",
      }),
      createTestGame({
        title: "Super Mario Bros",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co5678.jpg",
      }),
      createTestGame({
        title: "Hades",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co9012.jpg",
      }),
      createTestGame({ title: "Celeste", coverImage: null }),
      createTestGame({
        title: "Hollow Knight",
        coverImage:
          "https://images.igdb.com/igdb/image/upload/t_cover_big/co3456.jpg",
      }),
    ]);

    // Create library items with different statuses for the authed user
    await Promise.all([
      createTestLibraryItem({
        userId: user.id,
        gameId: game1.id,
        status: "CURIOUS_ABOUT",
      }),
      createTestLibraryItem({
        userId: user.id,
        gameId: game2.id,
        status: "CURIOUS_ABOUT",
      }),
      createTestLibraryItem({
        userId: user.id,
        gameId: game3.id,
        status: "CURIOUS_ABOUT",
      }),
      createTestLibraryItem({
        userId: user.id,
        gameId: game4.id,
        status: "CURRENTLY_EXPLORING",
      }),
      createTestLibraryItem({
        userId: user.id,
        gameId: game5.id,
        status: "CURRENTLY_EXPLORING",
      }),
    ]);
  });

  test.afterAll(async () => {
    await disconnectDatabase();
  });

  test("should display library stats with correct counts", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.statsHeading()).toBeVisible();
    await expect(profile.statusCard("Curious About")).toBeVisible();
    await expect(
      profile.statusCard("Curious About").getByText("3")
    ).toBeVisible();
    await expect(profile.statusCard("Currently Exploring")).toBeVisible();
    await expect(
      profile.statusCard("Currently Exploring").getByText("2")
    ).toBeVisible();
  });

  test("should display status cards with proper styling", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    const statusCards = profile.statusCards();
    const count = await statusCards.count();
    expect(count).toBeGreaterThanOrEqual(2);

    const firstCard = statusCards.first();
    await expect(firstCard.getByTestId("profile-status-label")).toBeVisible();
    await expect(firstCard.getByTestId("profile-status-count")).toBeVisible();
  });

  test("should use responsive grid layout for stats", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.statsGrid()).toBeVisible();
    await expect(profile.statsGrid()).toHaveCSS("display", "grid");
  });

  test("should not display empty state when library has items", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.emptyLibraryText()).not.toBeVisible();
  });

  test("should display human-readable status labels", async ({ page }) => {
    const profile = new ProfilePage(page);
    await profile.goto();
    await expect(profile.statusCard("Curious About")).toBeVisible();
    await expect(profile.statusCard("Currently Exploring")).toBeVisible();
    await expect(page.getByText("CURIOUS_ABOUT")).not.toBeVisible();
    await expect(page.getByText("CURRENTLY_EXPLORING")).not.toBeVisible();
  });

  test("should display Recently Played section with correct games", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.recentlyPlayedHeading()).toBeVisible();
    await expect(profile.recentGamesGrid()).toBeVisible();
    await expect(profile.recentGameCards()).toHaveCount(2);

    const titles = await profile.recentGameTitles();
    expect(titles.sort()).toEqual(["Celeste", "Hollow Knight"].sort());

    await expect(profile.statsHeading()).toBeVisible();
    await expect(profile.statusCards()).toHaveCount(2);
  });

  test("should display game cover images in Recently Played", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.recentlyPlayedHeading()).toBeVisible();
    const hollowKnightCard = profile.recentGameCardByTitle("Hollow Knight");
    await expect(hollowKnightCard).toBeVisible();
    const hollowKnightImage = profile.recentGameImageByTitle("Hollow Knight");
    await expect(hollowKnightImage).toBeVisible();
    const imgSrc = await hollowKnightImage.getAttribute("src");
    expect(imgSrc).toBeTruthy();
  });

  test("should display fallback for games without cover images", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.recentlyPlayedHeading()).toBeVisible();
    const celesteCard = profile.recentGameCardByTitle("Celeste");
    await expect(celesteCard).toBeVisible();
    const celesteImage = profile.recentGameImageByTitle("Celeste");
    await expect(celesteImage).not.toBeVisible();
  });

  test("should display multiple games in Recently Played grid", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.recentlyPlayedHeading()).toBeVisible();
    await expect(profile.recentGameCardByTitle("Celeste")).toBeVisible();
    await expect(profile.recentGameCardByTitle("Hollow Knight")).toBeVisible();
    await expect(profile.recentGameCards()).toHaveCount(2);
  });

  test("should display relative timestamps for recently played games", async ({
    page,
  }) => {
    const profile = new ProfilePage(page);
    await profile.goto();

    await expect(profile.recentlyPlayedHeading()).toBeVisible();
    const timestampPattern = /ago|seconds|minutes|hours|days/i;
    const pageContent = await page.textContent("body");
    expect(pageContent).toMatch(timestampPattern);
  });
});
