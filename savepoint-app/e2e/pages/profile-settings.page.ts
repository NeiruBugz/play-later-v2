import type { Locator, Page } from "@playwright/test";
export class ProfileSettingsPage {
  constructor(private readonly page: Page) {}
  async goto(): Promise<void> {
    await this.page.goto("/profile/settings");
    await this.page.waitForLoadState("networkidle");
  }
  usernameInput(): Locator {
    return this.page.getByRole("textbox", { name: /username/i });
  }
  saveButton(): Locator {
    return this.page.getByRole("button", { name: "Save Changes" });
  }
  async typeUsername(value: string): Promise<void> {
    const input = this.usernameInput();
    await input.clear();
    await input.fill(value);
  }
  async changeUsername(value: string): Promise<void> {
    await this.typeUsername(value);
    await this.saveButton().click();
  }
  usernameAvailableMessage(): Locator {
    return this.page.getByText("Username available");
  }
  usernameTakenMessage(): Locator {
    return this.page.getByText("Username already exists");
  }
  usernameTooShortMessage(): Locator {
    return this.page.getByText("Username must be at least 3 characters");
  }
  usernameTooLongMessage(): Locator {
    return this.page.getByText("Username must not exceed 25 characters");
  }
  profileUpdatedToast(): Locator {
    return this.getToast(/profile updated successfully/i);
  }
  backButton(): Locator {
    return this.page.getByRole("button", { name: /back/i });
  }
  uploadAvatarButton(): Locator {
    return this.page.getByRole("button", { name: "Upload avatar" });
  }
  fileInput(): Locator {
    return this.page.locator('input[type="file"]');
  }
  previewAvatar(): Locator {
    return this.page.locator('img[alt*="Selected avatar preview"]');
  }
  currentAvatar(): Locator {
    return this.page.locator('img[alt*="Current avatar"]');
  }
  avatarUploadButton(): Locator {
    return this.page.getByLabel("Upload selected avatar");
  }
  avatarCancelButton(): Locator {
    return this.page.getByRole("button", { name: "Cancel" });
  }
  avatarUploadSuccessToast(): Locator {
    return this.getToast("Profile image uploaded successfully");
  }
  async selectAvatarFromPath(filePath: string): Promise<void> {
    await this.fileInput().setInputFiles(filePath);
  }
  async submitAvatarUpload(): Promise<void> {
    await this.avatarUploadButton().click();
  }
  private toastRegion(): Locator {
    return this.page.getByRole("region", { name: "Notifications alt+T" });
  }
  getToast(text: string | RegExp): Locator {
    return this.toastRegion().getByText(text);
  }
}
