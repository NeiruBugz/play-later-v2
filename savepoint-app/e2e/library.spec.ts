import { expect, test } from "@playwright/test";

import { LibraryPage } from "./pages/library.page";

test.describe("[library] Library page", () => {
  test("displays all status filter buttons", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto();

    await expect(library.heading()).toBeVisible();

    await expect(library.allStatusesButton()).toBeVisible();
    await expect(library.wantToPlayButton()).toBeVisible();
    await expect(library.ownedButton()).toBeVisible();
    await expect(library.playingButton()).toBeVisible();
    await expect(library.playedButton()).toBeVisible();
  });

  test("has 'All Statuses' button selected by default", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto();

    await expect(library.allStatusesButton()).toHaveAttribute(
      "aria-pressed",
      "true"
    );
  });

  test("displays sort, platform filter, and search controls", async ({
    page,
  }) => {
    const library = new LibraryPage(page);
    await library.goto();

    await expect(library.sortBySelect()).toBeVisible();
    await expect(library.platformFilterCombobox()).toBeVisible();
    await expect(library.searchInput()).toBeVisible();
  });

  test("shows empty state when library has no games", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto();

    await expect(library.emptyStateHeading()).toBeVisible();
    await expect(library.emptyStateMessage()).toBeVisible();
    await expect(library.browseGamesLink()).toBeVisible();
    await expect(library.browseGamesLink()).toHaveAttribute(
      "href",
      "/games/search"
    );
  });

  test("clicking a status filter updates the selection", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto();

    await expect(library.allStatusesButton()).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(library.wantToPlayButton()).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await library.wantToPlayButton().click();

    await expect(library.wantToPlayButton()).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(library.allStatusesButton()).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    expect(page.url()).toContain("status=WANT_TO_PLAY");
  });
});
