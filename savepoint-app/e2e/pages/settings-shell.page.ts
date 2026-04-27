import type { Locator, Page } from "@playwright/test";

export class SettingsShellPage {
  constructor(private readonly page: Page) {}

  async goto(section = "profile"): Promise<void> {
    await this.page.goto(`/settings/${section}`);
    await this.page.waitForLoadState("networkidle");
  }

  async gotoRoot(): Promise<void> {
    await this.page.goto("/settings");
    await this.page.waitForLoadState("networkidle");
  }

  async gotoLegacyPath(): Promise<void> {
    await this.page.goto("/profile/settings");
    await this.page.waitForLoadState("networkidle");
  }

  navLink(label: string): Locator {
    return this.page.getByRole("link", { name: label });
  }

  logoutButton(): Locator {
    return this.page.getByRole("button", { name: /sign out/i });
  }

  heading(level: 1 | 2 = 2): Locator {
    return this.page.getByRole("heading", { level });
  }
}
