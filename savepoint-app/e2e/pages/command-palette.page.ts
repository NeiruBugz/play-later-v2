import type { Locator, Page } from "@playwright/test";

export class CommandPalettePage {
  constructor(private readonly page: Page) {}

  dialog(): Locator {
    return this.page.getByRole("dialog", { name: /search/i });
  }

  searchInput(): Locator {
    return this.dialog().getByRole("combobox");
  }

  async open(): Promise<void> {
    await this.page.keyboard.press("Control+k");
    await this.dialog().waitFor({ state: "visible" });
  }

  async close(): Promise<void> {
    await this.page.keyboard.press("Escape");
    await this.dialog().waitFor({ state: "hidden" });
  }

  async search(query: string): Promise<void> {
    await this.searchInput().fill(query);
  }

  results(): Locator {
    return this.dialog().getByRole("option");
  }

  firstResult(): Locator {
    return this.dialog().getByRole("option").first();
  }
}
