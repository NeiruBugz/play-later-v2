import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { Profile } from "@/entities/profile/model/types";

import { checkUsernameFn, updateProfileFn } from "../../api/update-profile";
import { ProfileSettingsForm } from "./profile-settings-form";

vi.mock("../../api/update-profile", () => ({
  updateProfileFn: vi.fn(),
  checkUsernameFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

const stubProfile: Profile = {
  id: "user-stub-1",
  name: "Stub User",
  username: "stubuser",
  image: null,
  isPublicProfile: false,
};

const elements = {
  getDisplayNameInput: () => screen.getByLabelText("Display name"),
  getUsernameInput: () => screen.getByLabelText("Username"),
  getVisibilityToggle: () =>
    screen.getByRole("switch", { name: "Public profile" }),
  getSaveButton: () => screen.getByRole("button", { name: "Save changes" }),
  getServerErrorMessage: () => screen.getByRole("alert"),
  getUsernameAvailableStatus: () => screen.queryByText("Username available"),
  getUsernameTakenStatus: () => screen.queryByText("Username already exists"),
};

const actions = {
  fillForm: async ({ name, username }: { name: string; username: string }) => {
    await userEvent.clear(elements.getDisplayNameInput());
    await userEvent.type(elements.getDisplayNameInput(), name);
    await userEvent.clear(elements.getUsernameInput());
    await userEvent.type(elements.getUsernameInput(), username);
  },
  toggleVisibility: () => userEvent.click(elements.getVisibilityToggle()),
  submitForm: () => userEvent.click(elements.getSaveButton()),
};

describe("ProfileSettingsForm", () => {
  describe("given valid changes are submitted", () => {
    beforeEach(async () => {
      vi.mocked(updateProfileFn).mockResolvedValue({
        ...stubProfile,
        name: "New Name",
        username: "newuser",
      });

      render(<ProfileSettingsForm profile={stubProfile} />);
      await actions.fillForm({ name: "New Name", username: "newuser" });
      await actions.submitForm();
    });

    it("calls updateProfileFn with the typed values", () => {
      expect(vi.mocked(updateProfileFn)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          name: "New Name",
          username: "newuser",
          isPublicProfile: false,
        }),
      });
    });

    it("fires toast.success on resolution", () => {
      expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Profile updated");
    });
  });

  describe("given the visibility toggle is flipped", () => {
    beforeEach(async () => {
      vi.mocked(updateProfileFn).mockResolvedValue({
        ...stubProfile,
        isPublicProfile: true,
      });

      render(<ProfileSettingsForm profile={stubProfile} />);
      await actions.toggleVisibility();
      await actions.submitForm();
    });

    it("includes the new isPublicProfile value in the payload", () => {
      expect(vi.mocked(updateProfileFn)).toHaveBeenCalledWith({
        data: expect.objectContaining({
          isPublicProfile: true,
        }),
      });
    });
  });

  describe("given the server fn rejects with an error", () => {
    beforeEach(async () => {
      vi.mocked(updateProfileFn).mockRejectedValue(
        new Error("Username is already taken")
      );

      render(<ProfileSettingsForm profile={stubProfile} />);
      await actions.submitForm();
    });

    it("surfaces the server error message inline", () => {
      expect(elements.getServerErrorMessage()).toBeDefined();
      expect(elements.getServerErrorMessage().textContent).toContain(
        "Username is already taken"
      );
    });

    it("fires toast.error with the server message", () => {
      expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
        "Username is already taken"
      );
    });
  });

  describe("given a username is being typed (useUsernameValidation debounce)", () => {
    afterEach(() => {
      vi.useRealTimers();
    });

    beforeEach(async () => {
      vi.useFakeTimers();

      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

      vi.mocked(checkUsernameFn).mockResolvedValue({ available: true });

      render(<ProfileSettingsForm profile={stubProfile} />);

      await user.clear(elements.getUsernameInput());
      await user.type(elements.getUsernameInput(), "newusername");
    });

    it("does not call checkUsernameFn before the debounce window expires", () => {
      expect(vi.mocked(checkUsernameFn)).not.toHaveBeenCalled();
    });

    it("calls checkUsernameFn after the debounce window", async () => {
      await vi.advanceTimersByTimeAsync(500);

      expect(vi.mocked(checkUsernameFn)).toHaveBeenCalledWith({
        data: { username: "newusername" },
      });
    });
  });
});
