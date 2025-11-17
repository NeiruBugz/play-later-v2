import type { Locator, Page } from "@playwright/test";
export class ProfilePage {
  constructor(private readonly page: Page) {}
  async goto(): Promise<void> {
    await this.page.goto("/profile");
    await this.page.waitForLoadState("networkidle");
  }
  container(): Locator {
    return this.page.getByTestId("profile-page");
  }
  heading(level: number = 2, name?: string | RegExp): Locator {
    return this.page.getByRole("heading", { level, ...(name ? { name } : {}) });
  }
  emailText(email: string): Locator {
    return this.page.getByText(email);
  }
  joinedText(): Locator {
    return this.page.getByText(/Joined/);
  }
  avatarImage(): Locator {
    return this.page.locator("img[alt*='avatar']");
  }
  avatarPlaceholder(): Locator {
    return this.page.getByTestId("profile-avatar-placeholder");
  }
  emptyLibraryText(): Locator {
    return this.page.getByText(/Your library is empty/i);
  }
  statsHeading(): Locator {
    return this.page.getByRole("heading", { name: "Library Stats" });
  }
  statsGrid(): Locator {
    return this.page.getByTestId("profile-stats-grid");
  }
  statusCards(): Locator {
    return this.page.getByTestId("profile-status-card");
  }
  statusCard(label: string): Locator {
    return this.statusCards().filter({ hasText: label });
  }
  recentlyPlayedHeading(): Locator {
    return this.page.getByRole("heading", { name: "Recently Played" });
  }
  recentGamesGrid(): Locator {
    return this.page.getByTestId("profile-recent-games-grid");
  }
  recentGameCards(): Locator {
    return this.page.getByTestId("profile-recent-game-card");
  }
  recentGameCardByTitle(title: string): Locator {
    return this.recentGameCards().filter({ hasText: title });
  }
  recentGameImageByTitle(title: string): Locator {
    return this.recentGameCardByTitle(title).locator(`img[alt='${title}']`);
  }
  async recentGameTitles(): Promise<string[]> {
    const titles = await this.recentGameCards().evaluateAll((cards) =>
      cards
        .map((card) =>
          card
            .querySelector("[data-testid='profile-recent-game-title']")
            ?.textContent?.trim()
        )
        .filter((t): t is string => Boolean(t))
    );
    return titles;
  }
}
