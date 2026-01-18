import { expect, test } from "@playwright/test";

import {
  cleanupUserTestData,
  disconnectDatabase,
  getUserByEmail,
} from "./helpers/db";
import { GameDetailPage } from "./pages/game-detail.page";

const KNOWN_GAME_SLUG = "elden-ring";
const AUTH_USER_EMAIL = "e2e-auth-user@example.com";

test.describe("[add-to-library] Add game to library", () => {
  test.afterEach(async () => {
    const user = await getUserByEmail(AUTH_USER_EMAIL);
    if (user) {
      await cleanupUserTestData(user.id);
    }
  });

  test.afterAll(async () => {
    await disconnectDatabase();
  });

  test("adds game to library with status selection", async ({ page }) => {
    const gameDetail = new GameDetailPage(page);

    await gameDetail.goto(KNOWN_GAME_SLUG);

    // Wait for the add button to appear (confirms user is authenticated and UI loaded)
    await gameDetail.addToLibraryButton().waitFor({ state: "visible" });
    await gameDetail.addToLibraryButton().click();
    await expect(gameDetail.libraryModal()).toBeVisible();

    await gameDetail.selectStatus("Played");
    await gameDetail.clickSubmitAndWait();

    await expect(gameDetail.manageLibraryButton()).toBeVisible();
    await expect(gameDetail.libraryStatusIcon()).toBeVisible();
  });

  test("can cancel adding game to library", async ({ page }) => {
    const gameDetail = new GameDetailPage(page);

    await gameDetail.goto(KNOWN_GAME_SLUG);

    // Wait for the add button to appear (confirms user is authenticated and UI loaded)
    await gameDetail.addToLibraryButton().waitFor({ state: "visible" });
    await gameDetail.addToLibraryButton().click();

    await expect(gameDetail.libraryModal()).toBeVisible();

    await gameDetail.cancelButton().click();

    await expect(gameDetail.libraryModal()).not.toBeVisible();
    await expect(gameDetail.addToLibraryButton()).toBeVisible();
  });
});
