import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";

import { updateProfileFormAction } from "../server-actions/update-profile";
import { ProfileSettingsForm } from "./profile-settings-form";

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
  },
}));

vi.mock("../server-actions/update-profile", () => ({
  updateProfileFormAction: vi.fn(),
}));

vi.mock("../../setup-profile/server-actions/upload-avatar", () => ({
  uploadAvatar: vi.fn(),
}));

const mockUpdateProfileFormAction = vi.mocked(updateProfileFormAction);
const mockToastSuccess = vi.mocked(toast.success);

const elements = {
  getCard: () => screen.getByRole("form"),
  getTitle: () => screen.getByText("Profile Settings"),
  getDescription: () => screen.getByText(/Update your profile information/i),
  getUsernameInput: () => screen.getByLabelText("Username"),
  getUsernameHint: () => screen.getByText(/Must be 3-25 characters/i),
  getSubmitButton: () => screen.getByRole("button", { name: /save changes/i }),
  getSavingButton: () => screen.getByRole("button", { name: /saving.../i }),
  queryValidationError: () => screen.queryByText(/username must/i),
  getValidationError: () => screen.getByText(/username must/i),
  queryServerError: () => screen.queryByText(/username already exists/i),
  getServerError: () => screen.getByText(/username already exists/i),
};

const actions = {
  typeUsername: async (value: string) => {
    const input = elements.getUsernameInput();
    await userEvent.clear(input);
    await userEvent.type(input, value);
  },

  submitForm: async () => {
    await userEvent.click(elements.getSubmitButton());
  },

  typeAndSubmit: async (username: string) => {
    await actions.typeUsername(username);
    await actions.submitForm();
  },
};

describe("ProfileSettingsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUpdateProfileFormAction.mockResolvedValue({
      status: "idle",
    });
  });

  describe("given form just rendered", () => {
    it("should display all form elements", () => {
      render(
        <ProfileSettingsForm
          currentUsername="testuser"
          currentAvatar="https://example.com/avatar.jpg"
        />
      );

      expect(elements.getTitle()).toBeVisible();
      expect(elements.getDescription()).toBeVisible();
      expect(elements.getUsernameInput()).toBeVisible();
      expect(elements.getUsernameHint()).toBeVisible();
      expect(elements.getSubmitButton()).toBeVisible();
    });

    it("should populate username input with current value", () => {
      render(
        <ProfileSettingsForm
          currentUsername="existinguser"
          currentAvatar={null}
        />
      );

      expect(elements.getUsernameInput()).toHaveValue("existinguser");
    });

    it("should handle null current username", () => {
      render(
        <ProfileSettingsForm currentUsername={null} currentAvatar={null} />
      );

      expect(elements.getUsernameInput()).toHaveValue("");
    });

    it("should include hidden avatarUrl input", () => {
      render(
        <ProfileSettingsForm
          currentUsername="testuser"
          currentAvatar="https://example.com/avatar.jpg"
        />
      );

      const hiddenInput = screen.getByTestId("avatar-url-input");
      expect(hiddenInput).toBeInTheDocument();
      expect(hiddenInput).toHaveValue("https://example.com/avatar.jpg");
    });

    it("should handle null avatar URL", () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      const hiddenInput = screen.getByTestId("avatar-url-input");
      expect(hiddenInput).toHaveValue("");
    });
  });

  describe("given user types in username field", () => {
    it("should update username value", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("newusername");

      expect(elements.getUsernameInput()).toHaveValue("newusername");
    });

    it("should show validation error when username is too short", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        expect(elements.getValidationError()).toHaveTextContent(
          "Username must be at least 3 characters"
        );
      });
    });

    it("should show validation error when username is too long", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("a".repeat(26));

      await waitFor(() => {
        expect(elements.getValidationError()).toHaveTextContent(
          "Username must not exceed 25 characters"
        );
      });
    });

    it("should remove validation error when username becomes valid", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        expect(elements.getValidationError()).toBeVisible();
      });

      await actions.typeUsername("abc");

      await waitFor(() => {
        expect(elements.queryValidationError()).not.toBeInTheDocument();
      });
    });
  });

  describe("given user submits form", () => {
    it("should prevent submission when validation error exists", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");
      await actions.submitForm();

      expect(mockUpdateProfileFormAction).not.toHaveBeenCalled();
      expect(elements.getValidationError()).toBeVisible();
    });

    it("should disable submit button when validation error exists", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        expect(elements.getSubmitButton()).toBeDisabled();
      });
    });

    it("should allow submission when username is valid", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "success",
        message: "Profile updated successfully!",
        submittedUsername: "validusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("validusername");

      await waitFor(() => {
        expect(mockUpdateProfileFormAction).toHaveBeenCalled();
      });
    });
  });

  describe("given form submission succeeds", () => {
    it("should display success toast", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "success",
        message: "Profile updated successfully!",
        submittedUsername: "newusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("newusername");

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith(
          "Profile updated successfully!"
        );
      });
    });

    it("should update username to submitted value", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "success",
        message: "Profile updated successfully!",
        submittedUsername: "updatedusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("  updatedusername  ");

      await waitFor(() => {
        expect(elements.getUsernameInput()).toHaveValue("updatedusername");
      });
    });

    it("should clear validation error on success", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "success",
        message: "Profile updated successfully!",
        submittedUsername: "newusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        expect(elements.getValidationError()).toBeVisible();
      });

      await actions.typeAndSubmit("newusername");

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalled();
        expect(elements.queryValidationError()).not.toBeInTheDocument();
      });
    });

    it("should use custom success message from server", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "success",
        message: "Custom success message",
        submittedUsername: "newusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("newusername");

      await waitFor(() => {
        expect(mockToastSuccess).toHaveBeenCalledWith("Custom success message");
      });
    });
  });

  describe("given form submission fails", () => {
    it("should display server error message", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "takenusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("takenusername");

      await waitFor(() => {
        expect(elements.getServerError()).toBeVisible();
      });
    });

    it("should not display server error if submitted username differs from current", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "oldusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("differentusername");

      await waitFor(() => {
        expect(elements.queryServerError()).not.toBeInTheDocument();
      });
    });

    it("should display error only when trimmed username matches submitted", async () => {
      mockUpdateProfileFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "takenusername",
      });

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("  takenusername  ");

      await waitFor(() => {
        expect(elements.getServerError()).toBeVisible();
      });
    });
  });

  describe("given form is pending", () => {
    it("should disable username input while submitting", async () => {
      mockUpdateProfileFormAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  status: "success",
                  message: "Done",
                  submittedUsername: "newusername",
                }),
              100
            );
          })
      );

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("newusername");

      expect(elements.getUsernameInput()).toBeDisabled();
    });

    it("should show saving button text while submitting", async () => {
      mockUpdateProfileFormAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  status: "success",
                  message: "Done",
                  submittedUsername: "newusername",
                }),
              100
            );
          })
      );

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("newusername");

      expect(elements.getSavingButton()).toBeVisible();
    });

    it("should disable submit button while submitting", async () => {
      mockUpdateProfileFormAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  status: "success",
                  message: "Done",
                  submittedUsername: "newusername",
                }),
              100
            );
          })
      );

      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeAndSubmit("newusername");

      expect(elements.getSavingButton()).toBeDisabled();
    });
  });

  describe("given accessibility features", () => {
    it("should link validation error to input via aria-describedby", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        const input = elements.getUsernameInput();
        const error = elements.getValidationError();

        expect(input).toHaveAttribute("aria-describedby", "username-error");
        expect(error).toHaveAttribute("id", "username-error");
      });
    });

    it("should set aria-invalid when validation fails", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        expect(elements.getUsernameInput()).toHaveAttribute(
          "aria-invalid",
          "true"
        );
      });
    });

    it("should display error message for invalid username", async () => {
      render(
        <ProfileSettingsForm currentUsername="testuser" currentAvatar={null} />
      );

      await actions.typeUsername("ab");

      await waitFor(() => {
        const error = elements.getValidationError();
        expect(error).toBeVisible();
        expect(error).toHaveTextContent(
          "Username must be at least 3 characters"
        );
      });
    });
  });
});
