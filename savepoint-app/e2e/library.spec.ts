import { expect, test } from "@playwright/test";

import { LibraryPage } from "./pages/library.page";

test.describe("[library] Library page", () => {
  test("displays all status filter buttons", async ({ page }) => {
    const library = new LibraryPage(page);
    await library.goto();

    await expect(library.heading()).toBeVisible();

    await expect(library.allStatusesButton()).toBeVisible();
    await expect(library.curiousAboutButton()).toBeVisible();
    await expect(library.currentlyExploringButton()).toBeVisible();
    await expect(library.takingABreakButton()).toBeVisible();
    await expect(library.experiencedButton()).toBeVisible();
    await expect(library.wishlistButton()).toBeVisible();
    await expect(library.revisitingButton()).toBeVisible();
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
    await expect(library.curiousAboutButton()).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    await library.curiousAboutButton().click();

    await expect(library.curiousAboutButton()).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await expect(library.allStatusesButton()).toHaveAttribute(
      "aria-pressed",
      "false"
    );

    expect(page.url()).toContain("status=CURIOUS_ABOUT");
  });
});
