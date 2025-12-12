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

  curiousAboutButton(): Locator {
    return this.statusFilterButton("Curious About");
  }

  currentlyExploringButton(): Locator {
    return this.statusFilterButton("Currently Exploring");
  }

  takingABreakButton(): Locator {
    return this.statusFilterButton("Taking a Break");
  }

  experiencedButton(): Locator {
    return this.statusFilterButton("Experienced");
  }

  wishlistButton(): Locator {
    return this.statusFilterButton("Wishlist");
  }

  revisitingButton(): Locator {
    return this.statusFilterButton("Revisiting");
  }

  allStatusButtons(): Locator[] {
    return [
      this.allStatusesButton(),
      this.curiousAboutButton(),
      this.currentlyExploringButton(),
      this.takingABreakButton(),
      this.experiencedButton(),
      this.wishlistButton(),
      this.revisitingButton(),
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
