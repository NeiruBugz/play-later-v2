import type { Locator, Page } from "@playwright/test";

export class ProfileSetupPage {
  constructor(private readonly page: Page) {}

  async goto(): Promise<void> {
    await this.page.goto("/profile/setup");
    await this.page.waitForLoadState("networkidle");
  }

  heading(): Locator {
    return this.page.getByText("Complete Your Profile", { exact: true });
  }

  // Username
  usernameInput(): Locator {
    return this.page.getByRole("textbox", { name: /username/i });
  }

  async typeUsername(value: string): Promise<void> {
    const input = this.usernameInput();
    await input.clear();
    await input.fill(value);
  }

  usernameAvailableMessage(): Locator {
    return this.page.getByText("Username available");
  }

  usernameTakenMessage(): Locator {
    return this.page.getByText("Username already exists");
  }

  // Avatar upload (shared selectors with settings page)
  fileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }

  previewAvatar(): Locator {
    return this.page.locator('img[alt*="Selected avatar preview"]');
  }

  avatarUploadButton(): Locator {
    return this.page.getByLabel("Upload selected avatar");
  }

  async selectAvatarFromPath(filePath: string): Promise<void> {
    await this.fileInput().setInputFiles(filePath);
  }

  async submitAvatarUpload(): Promise<void> {
    await this.avatarUploadButton().click();
  }

  // Actions
  skipButton(): Locator {
    return this.page.getByRole("button", { name: /skip for now/i });
  }

  completeSetupButton(): Locator {
    return this.page.getByRole("button", { name: /complete setup/i });
  }

  // Toast helpers
  private toastRegion(): Locator {
    return this.page.getByRole("region", { name: "Notifications alt+T" });
  }

  getToast(text: string | RegExp): Locator {
    return this.toastRegion().getByText(text);
  }
}
