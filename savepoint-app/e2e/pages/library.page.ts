import type { Locator, Page } from "@playwright/test";

export class LibraryPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/library");
    await this.page.waitForLoadState("networkidle");
  }

  heading(): Locator {
    return this.page.getByRole("heading", { name: "My Library", level: 1 });
  }

  sortBySelect(): Locator {
    return this.page.getByRole("combobox", { name: "Sort by" });
  }

  platformFilterCombobox(): Locator {
    return this.page.getByRole("combobox", { name: "Filter by platform" });
  }

  searchInput(): Locator {
    return this.page.getByRole("searchbox", { name: "Search games by title" });
  }

  allStatusesButton(): Locator {
    return this.page.getByRole("button", { name: "Show all statuses" });
  }

  statusFilterButton(status: string): Locator {
    return this.page.getByRole("button", { name: `Filter by ${status}` });
  }

  wantToPlayButton(): Locator {
    return this.statusFilterButton("Want to Play");
  }

  ownedButton(): Locator {
    return this.statusFilterButton("Owned");
  }

  playingButton(): Locator {
    return this.statusFilterButton("Playing");
  }

  playedButton(): Locator {
    return this.statusFilterButton("Played");
  }

  allStatusButtons(): Locator[] {
    return [
      this.allStatusesButton(),
      this.wantToPlayButton(),
      this.ownedButton(),
      this.playingButton(),
      this.playedButton(),
    ];
  }

  emptyStateHeading(): Locator {
    return this.page.getByRole("heading", { name: "Your Library is Empty" });
  }

  emptyStateMessage(): Locator {
    return this.page.getByText(
      "Start building your gaming library by searching for games and adding them."
    );
  }

  browseGamesLink(): Locator {
    return this.page.getByRole("link", { name: "Browse Games" });
  }

  clearFiltersButton(): Locator {
    return this.page.getByRole("button", { name: "Clear all filters" });
  }
}
