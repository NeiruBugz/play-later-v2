import type { Locator, Page } from "@playwright/test";

export class SidebarPage {
  constructor(private readonly page: Page) {}

  rail(): Locator {
    return this.page
      .getByRole("complementary")
      .filter({ has: this.page.getByRole("link", { name: "Library" }) });
  }

  navLink(label: string): Locator {
    return this.page.getByRole("navigation").getByRole("link", { name: label });
  }

  searchTrigger(): Locator {
    return this.page.getByRole("button", { name: /search/i });
  }
}
