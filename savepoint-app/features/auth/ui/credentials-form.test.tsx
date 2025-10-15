import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import the mocked functions
import { signInAction } from "../server-actions/sign-in";
import { signUpAction } from "../server-actions/sign-up";
import { CredentialsForm } from "./credentials-form";

// Mock the server actions
vi.mock("../server-actions/sign-in", () => ({
  signInAction: vi.fn(),
}));

vi.mock("../server-actions/sign-up", () => ({
  signUpAction: vi.fn(),
}));

const mockSignInAction = vi.mocked(signInAction);
const mockSignUpAction = vi.mocked(signUpAction);

const elements = {
  getEmailInput: () => screen.getByLabelText("Email"),
  getPasswordInput: () => screen.getByLabelText("Password"),
  getNameInput: () => screen.queryByLabelText("Name (Optional)"),
  getSignInSubmitButton: () => screen.getByRole("button", { name: "Sign In" }),
  getSignUpSubmitButton: () => screen.getByRole("button", { name: "Sign Up" }),
  getLoadingStateButton: () =>
    screen.getByRole("button", { name: "Loading..." }),
  getSignInToggle: () => screen.getByRole("button", { name: "Sign in" }),
  getSignUpToggle: () => screen.getByRole("button", { name: "Sign up" }),
  getErrorMessage: () =>
    screen.queryByText(/Invalid|Email already|An unexpected/),
  getPasswordHint: () => screen.queryByText("Must be at least 8 characters"),
};

const actions = {
  toggleSignUpMode: async () => {
    const user = userEvent.setup();
    await user.click(elements.getSignUpToggle());
  },
  toggleSignInMode: async () => {
    const user = userEvent.setup();
    await user.click(elements.getSignInToggle());
  },
  typeInEmailField: async (emailValue: string = "test@example.com") => {
    const user = userEvent.setup();
    await user.type(elements.getEmailInput(), emailValue);
  },
  typeInPasswordField: async (passwordValue: string = "password") => {
    const user = userEvent.setup();
    await user.type(elements.getPasswordInput(), passwordValue);
  },
  clickSignInSubmit: async () => {
    const user = userEvent.setup();
    await user.click(elements.getSignInSubmitButton());
  },
};

describe("CredentialsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSignInAction.mockResolvedValue({ success: true, message: "Success" });
    mockSignUpAction.mockResolvedValue({ success: true, message: "Success" });
  });

  describe("given opened in default state", () => {
    it("should display sign in mode by default", () => {
      render(<CredentialsForm />);

      expect(elements.getEmailInput()).toBeVisible();
      expect(elements.getPasswordInput()).toBeVisible();
      expect(elements.getNameInput()).not.toBeInTheDocument();
      expect(elements.getSignInSubmitButton()).toBeVisible();
      expect(elements.getSignUpToggle()).toBeVisible();
    });
  });

  describe("given sign up toggle clicked", () => {
    beforeEach(async () => {
      render(<CredentialsForm />);
      await actions.toggleSignUpMode();

      await waitFor(() => {
        expect(elements.getNameInput()).toBeVisible();
      });
    });

    it("should show name field and password hint in sign-up mode", () => {
      expect(elements.getNameInput()).toBeVisible();
      expect(elements.getPasswordHint()).toBeVisible();
      expect(elements.getSignUpSubmitButton()).toBeVisible();
      expect(elements.getSignInToggle()).toBeVisible();
    });

    describe("and sign in toggle clicked", () => {
      beforeEach(async () => {
        await actions.toggleSignInMode();

        await waitFor(() => {
          expect(elements.getSignInSubmitButton()).toBeVisible();
        });
      });

      it("should display sign in form", () => {
        expect(elements.getEmailInput()).toBeVisible();
        expect(elements.getNameInput()).toBeNull();
      });
    });
  });

  describe("given sign in error state", () => {
    beforeEach(async () => {
      mockSignInAction.mockResolvedValueOnce({
        success: false,
        error: "Invalid credentials",
      });

      render(<CredentialsForm />);
      await actions.typeInEmailField();
      await actions.typeInPasswordField();
      await actions.clickSignInSubmit();

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
      });
    });

    it("should clear error when toggled into sign up mode", async () => {
      await actions.toggleSignUpMode();
      expect(elements.getErrorMessage()).toBeNull();
    });
  });

  describe("given successful sign in", () => {
    beforeEach(() => {
      mockSignInAction.mockResolvedValueOnce({
        success: true,
        message: "Success",
      });
    });

    it("should call sign in action with correct data", async () => {
      const user = userEvent.setup();
      render(<CredentialsForm />);

      await user.type(elements.getEmailInput(), "test@example.com");
      await user.type(elements.getPasswordInput(), "password");
      await user.click(elements.getSignInSubmitButton());

      await waitFor(() => {
        expect(mockSignInAction).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password",
        });
      });
    });
  });

  describe("given successful sign up", () => {
    beforeEach(() => {
      mockSignUpAction.mockResolvedValueOnce({
        success: true,
        message: "Success",
      });
    });

    it("should call sign up action with correct data", async () => {
      const user = userEvent.setup();
      render(<CredentialsForm />);

      await actions.toggleSignUpMode();
      await user.type(elements.getEmailInput(), "test@example.com");
      await user.type(elements.getPasswordInput(), "password123");
      await user.type(elements.getNameInput()!, "John Doe");
      await user.click(elements.getSignUpSubmitButton());

      await waitFor(() => {
        expect(mockSignUpAction).toHaveBeenCalledWith({
          email: "test@example.com",
          password: "password123",
          name: "John Doe",
        });
      });
    });
  });

  describe("given sign in failure", () => {
    beforeEach(() => {
      mockSignInAction.mockResolvedValueOnce({
        success: false,
        error: "Invalid email or password",
      });
    });

    it("should display error message", async () => {
      const user = userEvent.setup();
      render(<CredentialsForm />);

      await user.type(elements.getEmailInput(), "test@example.com");
      await user.type(elements.getPasswordInput(), "wrongpassword");
      await user.click(elements.getSignInSubmitButton());

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
        expect(elements.getErrorMessage()).toHaveTextContent(
          "Invalid email or password"
        );
      });
    });
  });

  describe("given sign up failure", () => {
    beforeEach(() => {
      mockSignUpAction.mockResolvedValueOnce({
        success: false,
        error: "Email already exists",
      });
    });

    it("should display error message", async () => {
      const user = userEvent.setup();
      render(<CredentialsForm />);

      await actions.toggleSignUpMode();
      await user.type(elements.getEmailInput(), "existing@example.com");
      await user.type(elements.getPasswordInput(), "password123");
      await user.click(elements.getSignUpSubmitButton());

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
        expect(elements.getErrorMessage()).toHaveTextContent(
          "Email already exists"
        );
      });
    });
  });

  describe("given unexpected error", () => {
    beforeEach(() => {
      mockSignInAction.mockRejectedValueOnce(new Error("Network error"));
    });

    it("should display generic error message", async () => {
      const user = userEvent.setup();
      render(<CredentialsForm />);

      await user.type(elements.getEmailInput(), "test@example.com");
      await user.type(elements.getPasswordInput(), "password");
      await user.click(elements.getSignInSubmitButton());

      await waitFor(() => {
        expect(elements.getErrorMessage()).toBeVisible();
        expect(elements.getErrorMessage()).toHaveTextContent(
          "An unexpected error occurred"
        );
      });
    });
  });

  describe("given loading state", () => {
    beforeEach(() => {
      mockSignInAction.mockImplementationOnce(async () => {
        await new Promise((resolve) => setTimeout(resolve, 100));
        return { success: true, message: "Success" };
      });
    });

    it("should show loading state during form submission", async () => {
      const user = userEvent.setup();
      render(<CredentialsForm />);

      await user.type(elements.getEmailInput(), "test@example.com");
      await user.type(elements.getPasswordInput(), "password");

      // Submit the form
      user.click(elements.getSignInSubmitButton());

      // Check loading state
      await waitFor(() => {
        expect(elements.getLoadingStateButton()).toHaveTextContent(
          "Loading..."
        );
      });
    });
  });

  describe("given form validation", () => {
    it("should have proper form validation attributes", () => {
      render(<CredentialsForm />);

      const emailInput = elements.getEmailInput();
      const passwordInput = elements.getPasswordInput();

      expect(emailInput).toHaveAttribute("type", "email");
      expect(emailInput).toHaveAttribute("required");
      expect(passwordInput).toHaveAttribute("type", "password");
      expect(passwordInput).toHaveAttribute("required");
    });

    it("should have minLength attribute for password in sign-up mode", async () => {
      render(<CredentialsForm />);

      // Toggle to sign-up mode
      await actions.toggleSignUpMode();

      const passwordInput = elements.getPasswordInput();
      expect(passwordInput).toHaveAttribute("minLength", "8");
    });
  });

  describe("given password hint visibility", () => {
    it("should show password hint only in sign-up mode", async () => {
      render(<CredentialsForm />);

      // Initially no hint in sign-in mode
      expect(elements.getPasswordHint()).not.toBeInTheDocument();

      // Toggle to sign-up mode
      await actions.toggleSignUpMode();
      expect(elements.getPasswordHint()).toBeVisible();
    });
  });
});
