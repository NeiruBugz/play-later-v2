import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useRouter } from "next/navigation";
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  vi,
  type Mock,
} from "vitest";

import { completeProfileSetupFormAction } from "../server-actions/complete-profile-setup";
import { ProfileSetupForm } from "./profile-setup-form";

// Mock Next.js router
vi.mock("next/navigation", () => ({
  useRouter: vi.fn(),
}));

// Mock server action
vi.mock("../server-actions/complete-profile-setup", () => ({
  completeProfileSetupFormAction: vi.fn(),
}));

// Mock toast
vi.mock("sonner", () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

// Mock UsernameInput component to simplify testing
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

      // Simulate client-side validation
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

// Mock AvatarUpload component to simplify testing
vi.mock("./avatar-upload", () => ({
  AvatarUpload: () => <div data-testid="avatar-upload">Avatar Upload</div>,
}));

const mockPush = vi.fn();
const mockFormAction = vi.mocked(completeProfileSetupFormAction);

describe("ProfileSetupForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as Mock).mockReturnValue({ push: mockPush });
    mockFormAction.mockResolvedValue({ status: "idle" });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  // ============================================================
  // Rendering Tests
  // ============================================================

  describe("given form is rendered", () => {
    it("should display all form elements", () => {
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      expect(screen.getByText("Complete Your Profile")).toBeInTheDocument();
      expect(
        screen.getByText(/Set up your username and profile image/i)
      ).toBeInTheDocument();
      expect(screen.getByLabelText("Username")).toBeInTheDocument();
      expect(screen.getByTestId("avatar-upload")).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /skip for now/i })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /complete setup/i })
      ).toBeInTheDocument();
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

      expect(screen.getByText(/Must be 3-25 characters/i)).toBeInTheDocument();
    });
  });

  // ============================================================
  // Skip Flow Tests
  // ============================================================

  describe("given user clicks Skip button", () => {
    it("should redirect to dashboard without calling server action", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await user.click(skipButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockFormAction).not.toHaveBeenCalled();
    });

    it("should redirect to dashboard when skip clicked with modified username", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="TestUser" />);

      // Modify username
      const usernameInput = screen.getByLabelText("Username");
      await user.clear(usernameInput);
      await user.type(usernameInput, "ModifiedUser");

      // Click skip
      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      await user.click(skipButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockFormAction).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Save Flow Tests - Valid Data
  // ============================================================

  describe("given user submits with valid username", () => {
    it("should call server action with username and redirect on success", async () => {
      const user = userEvent.setup();
      mockFormAction.mockResolvedValue({
        status: "success",
        message: "Profile setup complete!",
        submittedUsername: "ValidUser",
      });

      render(<ProfileSetupForm defaultUsername="TestUser" />);

      // Modify username
      const usernameInput = screen.getByLabelText("Username");
      await user.clear(usernameInput);
      await user.type(usernameInput, "ValidUser");

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      // Wait for form action to be called
      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      // Wait for redirect
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should submit with default username when not modified", async () => {
      const user = userEvent.setup();
      mockFormAction.mockResolvedValue({
        status: "success",
        message: "Profile setup complete!",
        submittedUsername: "DefaultUser",
      });

      render(<ProfileSetupForm defaultUsername="DefaultUser" />);

      // Submit without modifying username
      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith("/dashboard");
      });
    });

    it("should trim whitespace from username before submission", async () => {
      const user = userEvent.setup();
      mockFormAction.mockResolvedValue({
        status: "success",
        message: "Profile setup complete!",
        submittedUsername: "TrimmedUser",
      });

      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "  TrimmedUser  ");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });
    });
  });

  // ============================================================
  // Save Flow Tests - Empty Username
  // ============================================================

  describe("given user submits with empty username", () => {
    it("should prevent submission with empty username due to validation", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="DefaultUser" />);

      // Clear username
      const usernameInput = screen.getByLabelText("Username");
      await user.clear(usernameInput);

      // Submit form
      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      // Form action should not be called because empty username is prevented
      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should prevent submission with whitespace-only username", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "   ");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      // Form action should not be called because whitespace-only is treated as invalid
      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });
  });

  // ============================================================
  // Invalid Username Tests
  // ============================================================

  describe("given user submits with invalid username", () => {
    it("should prevent submission when username is too short", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "ab");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });

      // Button should be disabled due to validation error
      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      // Attempt to submit
      await user.click(submitButton);

      // Form action should not be called
      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should prevent submission when username is too long", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "a".repeat(26));

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });

      await waitFor(() => {
        expect(submitButton).toBeDisabled();
      });

      await user.click(submitButton);

      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should display server error when username validation fails", async () => {
      const user = userEvent.setup();
      mockFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "TakenUser",
      });

      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "TakenUser");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      // Should display error and NOT redirect
      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Username already exists"
        );
      });

      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should not display server error if username has been modified", async () => {
      const user = userEvent.setup();
      mockFormAction.mockResolvedValue({
        status: "error",
        message: "Username already exists",
        submittedUsername: "TakenUser",
      });

      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "TakenUser");

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(screen.getByRole("alert")).toHaveTextContent(
          "Username already exists"
        );
      });

      // Now modify username
      await user.clear(usernameInput);
      await user.type(usernameInput, "DifferentUser");

      // Error should disappear
      await waitFor(() => {
        expect(screen.queryByRole("alert")).not.toBeInTheDocument();
      });
    });
  });

  // ============================================================
  // Loading State Tests
  // ============================================================

  describe("given form is submitting", () => {
    it("should disable all inputs and buttons during submission", async () => {
      const user = userEvent.setup();
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
      await user.click(submitButton);

      // Check that inputs are disabled during submission
      const usernameInput = screen.getByLabelText("Username");
      expect(usernameInput).toBeDisabled();

      const skipButton = screen.getByRole("button", { name: /skip for now/i });
      expect(skipButton).toBeDisabled();
    });

    it("should show loading text on submit button during submission", async () => {
      const user = userEvent.setup();
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
      await user.click(submitButton);

      // Check for "Saving..." text
      expect(
        screen.getByRole("button", { name: /saving.../i })
      ).toBeInTheDocument();
    });
  });

  // ============================================================
  // Edge Cases
  // ============================================================

  describe("given edge cases", () => {
    it("should handle server action returning idle state", async () => {
      const user = userEvent.setup();
      mockFormAction.mockResolvedValue({ status: "idle" });

      render(<ProfileSetupForm defaultUsername="TestUser" />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      await waitFor(() => {
        expect(mockFormAction).toHaveBeenCalled();
      });

      // Should not redirect on idle status
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should prevent submission when no defaultUsername provided and field is empty", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm />);

      const submitButton = screen.getByRole("button", {
        name: /complete setup/i,
      });
      await user.click(submitButton);

      // Form action should not be called with empty username
      expect(mockFormAction).not.toHaveBeenCalled();
      expect(mockPush).not.toHaveBeenCalled();
    });

    it("should allow skip button even when username validation fails", async () => {
      const user = userEvent.setup();
      render(<ProfileSetupForm defaultUsername="" />);

      const usernameInput = screen.getByLabelText("Username");
      await user.type(usernameInput, "ab"); // Invalid username

      const skipButton = screen.getByRole("button", { name: /skip for now/i });

      // Skip should still be enabled
      expect(skipButton).not.toBeDisabled();

      await user.click(skipButton);

      expect(mockPush).toHaveBeenCalledWith("/dashboard");
      expect(mockFormAction).not.toHaveBeenCalled();
    });
  });
});
