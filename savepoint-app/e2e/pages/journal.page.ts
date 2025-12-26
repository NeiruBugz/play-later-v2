import type { Locator, Page } from "@playwright/test";

export class JournalPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/journal");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoNewEntry(): Promise<void> {
    await this.page.goto("/journal/new");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoEntry(entryId: string): Promise<void> {
    await this.page.goto(`/journal/${entryId}`);
    await this.page.waitForLoadState("networkidle");
  }

  async gotoEditEntry(entryId: string): Promise<void> {
    await this.page.goto(`/journal/${entryId}/edit`);
    await this.page.waitForLoadState("networkidle");
  }

  heading(): Locator {
    return this.page.locator("h1.heading-xl");
  }

  writeNewEntryButton(): Locator {
    return this.page.getByRole("link", { name: "Write New Entry" });
  }

  writeFirstEntryButton(): Locator {
    return this.page.getByRole("link", { name: "Write Your First Entry" });
  }

  emptyStateText(): Locator {
    return this.page.getByText("No journal entries yet");
  }

  journalEntriesHeading(): Locator {
    return this.page.locator("h2.heading-md", { hasText: "Journal Entries" });
  }

  entryCard(title: string): Locator {
    return this.page.getByRole("link", { name: new RegExp(title) });
  }

  entryCards(): Locator {
    return this.page.locator('a[href^="/journal/"]').filter({
      has: this.page.locator('[class*="Card"]'),
    });
  }

  loadMoreButton(): Locator {
    return this.page.getByRole("button", { name: "Load More" });
  }

  selectGameHeading(): Locator {
    return this.page.locator("h2", { hasText: "Select a Game" });
  }

  gameSearchInput(): Locator {
    return this.page.getByPlaceholder("Search your games...");
  }

  gameButton(gameTitle: string): Locator {
    return this.page.getByRole("button", { name: gameTitle });
  }

  noGamesInLibraryText(): Locator {
    return this.page.getByText("No games in your library");
  }

  browseGamesButton(): Locator {
    return this.page.getByRole("button", { name: "Browse Games" });
  }

  titleInput(): Locator {
    return this.page.getByLabel("Title");
  }

  contentTextarea(): Locator {
    return this.page.getByLabel("What's on your mind?");
  }

  hoursPlayedInput(): Locator {
    return this.page.getByLabel("Hours Played (Optional)");
  }

  saveThoughtButton(): Locator {
    return this.page.getByRole("button", { name: "Save thought" });
  }

  saveChangesButton(): Locator {
    return this.page.getByRole("button", { name: "Save Changes" });
  }

  cancelButton(): Locator {
    return this.page.getByRole("button", { name: "Cancel" });
  }

  async fillEntryForm(data: {
    title?: string;
    content: string;
    hoursPlayed?: number;
  }): Promise<void> {
    if (data.title) {
      await this.titleInput().fill(data.title);
    }
    await this.contentTextarea().fill(data.content);
    if (data.hoursPlayed !== undefined) {
      await this.hoursPlayedInput().fill(data.hoursPlayed.toString());
    }
  }

  async submitNewEntry(): Promise<void> {
    await this.saveThoughtButton().click();
    await this.page.waitForURL(/\/journal\/[a-z0-9-]+$/);
  }

  async submitEditEntry(): Promise<void> {
    await this.saveChangesButton().click();
    await this.page.waitForURL(/\/journal\/[a-z0-9-]+$/);
  }

  entryTitle(): Locator {
    return this.page.locator("h1.heading-xl");
  }

  entryContent(): Locator {
    return this.page.locator("p.whitespace-pre-wrap");
  }

  hoursPlayedText(): Locator {
    return this.page.getByText(/\d+ hours/);
  }

  createdAtTimestamp(): Locator {
    return this.page.locator("time", { hasText: /Created/ });
  }

  updatedAtTimestamp(): Locator {
    return this.page.locator("time", { hasText: /Updated/ });
  }

  editButton(): Locator {
    return this.page.getByRole("link", { name: "Edit" });
  }

  deleteButton(): Locator {
    return this.page.getByRole("button", { name: "Delete" });
  }

  deleteDialog(): Locator {
    return this.page.getByRole("dialog");
  }

  deleteDialogTitle(): Locator {
    return this.deleteDialog().getByText("Delete Journal Entry");
  }

  confirmDeleteButton(): Locator {
    return this.page.getByRole("button", { name: "Confirm deletion" });
  }

  cancelDeleteButton(): Locator {
    return this.deleteDialog().getByRole("button", { name: "Cancel deletion" });
  }

  async confirmDelete(): Promise<void> {
    await this.confirmDeleteButton().click();
    await this.page.waitForURL("/journal");
  }

  successToast(): Locator {
    return this.page.locator('[data-sonner-toast]', {
      hasText: /created|updated|deleted/i,
    });
  }

  gameCard(): Locator {
    return this.page.locator('[class*="CardTitle"]', { hasText: "Game" });
  }
}
