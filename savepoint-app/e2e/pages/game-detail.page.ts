import type { Locator, Page } from "@playwright/test";

export class GameDetailPage {
  constructor(private readonly page: Page) {}

  async goto(slug: string): Promise<void> {
    await this.page.goto(`/games/${slug}`);
    await this.page.waitForLoadState("networkidle");
    // Wait for the game title to appear (confirms IGDB data loaded)
    await this.heading().waitFor({ state: "visible", timeout: 30000 });
  }

  heading(): Locator {
    return this.page.locator("h1.display-lg");
  }

  gameTitle(): Locator {
    return this.page.locator("h1.display-lg");
  }

  addToLibraryButton(): Locator {
    return this.page.getByRole("button", { name: /Add .+ to your library/ });
  }

  manageLibraryButton(): Locator {
    return this.page.getByRole("button", {
      name: /Manage library entries for/,
    });
  }

  libraryStatusIcon(): Locator {
    return this.page.getByTestId("library-status-icon");
  }

  libraryStatusBadge(): Locator {
    return this.page.getByRole("status").locator('[aria-label^="Status:"]');
  }

  libraryModal(): Locator {
    return this.page.getByRole("dialog");
  }

  statusRadioGroup(): Locator {
    return this.page.getByRole("radiogroup", { name: "Journey status" });
  }

  statusRadio(statusLabel: string): Locator {
    return this.page.getByRole("radio", { name: statusLabel });
  }

  async selectStatus(statusLabel: string): Promise<void> {
    await this.statusRadio(statusLabel).click();
  }

  platformCombobox(): Locator {
    return this.page.getByRole("combobox", { name: "Platform (Optional)" });
  }

  async selectPlatform(platformName: string): Promise<void> {
    await this.platformCombobox().click();
    const option = this.page.getByRole("option", { name: platformName });
    await option.waitFor({ state: "visible" });
    await option.click();
    await this.page
      .locator("[data-radix-popper-content-wrapper]")
      .waitFor({ state: "hidden", timeout: 5000 })
      .catch(() => {});
    await this.page.waitForTimeout(200);
  }

  submitButton(): Locator {
    return this.libraryModal().getByRole("button", {
      name: /Add to Library|Add Entry/,
    });
  }

  async clickSubmitAndWait(): Promise<void> {
    const submitBtn = this.submitButton();
    await submitBtn.waitFor({ state: "visible" });
    await submitBtn.click();
    await this.libraryModal().waitFor({ state: "hidden", timeout: 15000 });
  }

  cancelButton(): Locator {
    return this.libraryModal().getByRole("button", { name: "Cancel" });
  }

  successToast(): Locator {
    return this.page.getByText(/added to your library|has been added/i);
  }
}
