import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import { Mock } from "vitest";

import { completeProfileSetupFormAction } from "../server-actions/complete-profile-setup";
import { skipProfileSetup } from "../server-actions/skip-profile-setup";
import { ProfileSetupForm } from "./profile-setup-form";

vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

vi.mock("../server-actions/complete-profile-setup", () => ({
  completeProfileSetupFormAction: vi.fn(),
}));

vi.mock("../server-actions/skip-profile-setup", () => ({
  skipProfileSetup: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

vi.mock("./username-input", () => ({
  UsernameInput: ({
    value,
    onChange,
    error,
    disabled,
    onValidationChange,
  }: {
    value: string;
    onChange: (value: string) => void;
    error?: string;
    disabled?: boolean;
    onValidationChange?: (hasError: boolean) => void;
  }) => {
    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const newValue = e.target.value;
      onChange(newValue);

      const trimmed = newValue.trim();
      const hasError =
        trimmed.length > 0 && (trimmed.length < 3 || trimmed.length > 25);
      onValidationChange?.(hasError);
    };

    return (
      <div>
        <label htmlFor="username-input">Username</label>
        <input
          id="username-input"
          type="text"
          value={value}
          onChange={handleChange}
          disabled={disabled}
          aria-invalid={!!error}
        />
        {error && <div role="alert">{error}</div>}
      </div>
    );
  },
}));

vi.mock("./avatar-upload", () => ({
  AvatarUpload: () => <div data-testid="avatar-upload">Avatar Upload</div>,
}));

const mockPush = vi.fn();
const mockFormAction = vi.mocked(completeProfileSetupFormAction);
const mockSkipAction = vi.mocked(skipProfileSetup);

describe("ProfileSetupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({ push: mockPush });
    mockFormAction.mockResolvedValue({ status: "idle" });
    mockSkipAction.mockResolvedValue({ success: true });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("given form is rendered", () => {
    it("should display all form elements", () => {
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      expect(screen.getByText("Complete Your Profile")).toBeVisible();
      expect(
        screen.getByText(/Set up your username and profile image/i)
      ).toBeVisible();
      expect(screen.getByLabelText("Username")).toBeVisible();
      expect(screen.getByTestId("avatar-upload")).toBeVisible();
      expect(
        screen.getByRole("button", { name: /skip for now/i })
      ).toBeVisible();
      expect(
        screen.getByRole("button", { name: /complete setup/i })
      ).toBeVisible();
    });

    it("should pre-fill username with defaultUsername prop", () => {
      render(<ProfileSetupForm defaultUsername="JohnDoe" />);

      const usernameInput = screen.getByLabelText("Username");
      expect(usernameInput).toHaveValue("JohnDoe");
    });

    it("should handle empty defaultUsername", () => {
      render(<ProfileSetupForm />);

      const usernameInput = screen.getByLabelText("Username");
      expect(usernameInput).toHaveValue("");
    });

    it("should display helper text for username requirements", () => {
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      expect(screen.getByText(/Must be 3-25 characters/i)).toBeVisible();
    });
  });

  describe("given user clicks Skip button", () => {
    it("should persist completion via server action and redirect to dashboard", async () => {
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await userEvent.click(skipButton);

      expect(mockSkipAction).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockFormAction).not.toHaveBeenCalled();
    });

    it("should persist completion and redirect when skip clicked with modified username", async () => {
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, "ModifiedUser");

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await userEvent.click(skipButton);

      expect(mockSkipAction).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockFormAction).not.toHaveBeenCalled();
    });
  });

  describe("given user submits with valid username", () => {
    it("should call server action with username and redirect on success", async () => {
      mockFormAction.mockResolvedValue({
        status: "success",
        message: "Profile setup complete!",
        submittedUsername: "ValidUser",
      });

      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, "ValidUser");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should submit with default username when not modified", async () => {
      mockFormAction.mockResolvedValue({
        status: "success",
        message: "Profile setup complete!",
        submittedUsername: "DefaultUser",
      });

      render(<ProfileSetupForm defaultUsername="DefaultUser" />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should trim whitespace from username before submission", async () => {
      mockFormAction.mockResolvedValue({
        status: "success",
        message: "Profile setup complete!",
        submittedUsername: "TrimmedUser",
      });

      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "  TrimmedUser  ");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });
    });
  });

  describe("given user submits with empty username", () => {
    it("should prevent submission with empty username due to validation", async () => {
      render(<ProfileSetupForm defaultUsername="DefaultUser" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.clear(usernameInput);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should prevent submission with whitespace-only username", async () => {
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "   ");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  describe("given user submits with invalid username", () => {
    it("should prevent submission when username is too short", async () => {
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "ab");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      await userEvent.click(submitButton);

      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should prevent submission when username is too long", async () => {
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "a".repeat(26));

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      await userEvent.click(submitButton);

      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should display server error when username validation fails", async () => {
      mockFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "TakenUser",
      });

      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "TakenUser");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Username already exists"
        );
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should not display server error if username has been modified", async () => {
      mockFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "TakenUser",
      });

      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "TakenUser");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Username already exists"
        );
      });

      await userEvent.clear(usernameInput);
      await userEvent.type(usernameInput, "DifferentUser");

      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  describe("given form is submitting", () => {
    it("should disable all inputs and buttons during submission", async () => {
      mockFormAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  status: "success",
                  message: "Done",
                  submittedUsername: "TestUser",
                }),
              100
            );
          })
      );

      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      const usernameInput = screen.getByLabelText("Username");
      expect(usernameInput).toBeDisabled();

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      expect(skipButton).toBeDisabled();
    });

    it("should show loading text on submit button during submission", async () => {
      mockFormAction.mockImplementation(
        () =>
          new Promise((resolve) => {
            setTimeout(
              () =>
                resolve({
                  status: "success",
                  message: "Done",
                  submittedUsername: "TestUser",
                }),
              100
            );
          })
      );

      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      expect(screen.getByRole("button", { name: /saving.../i })).toBeVisible();
    });
  });

  describe("given edge cases", () => {
    it("should handle server action returning idle state", async () => {
      mockFormAction.mockResolvedValue({ status: "idle" });

      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should prevent submission when no defaultUsername provided and field is empty", async () => {
      render(<ProfileSetupForm />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await userEvent.click(submitButton);

      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should allow skip button even when username validation fails", async () => {
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await userEvent.type(usernameInput, "ab");

      const skipButton = screen.getByRole("button", { name: /skip for now/i });

      expect(skipButton).toBeEnabled();

      await userEvent.click(skipButton);

      expect(mockSkipAction).toHaveBeenCalled();
      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockFormAction).not.toHaveBeenCalled();
    });
  });
});
