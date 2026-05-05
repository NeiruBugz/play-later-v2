import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "@/shared/api/auth-client";

import { EmailSignInForm } from "./email-sign-in-form";

vi.mock("@/shared/api/auth-client", () => ({
  authClient: {
    signIn: {
      email: vi.fn(),
    },
  },
  signIn: {
    email: vi.fn(),
  },
}));

const elements = {
  getEmailInput: () => screen.getByLabelText("Email"),
  getPasswordInput: () => screen.getByLabelText("Password"),
  getSubmitButton: () => screen.getByRole("button", { name: "Sign in" }),
  queryEmailInput: () => screen.queryByLabelText("Email"),
};

const actions = {
  typeEmail: (value: string) => userEvent.type(elements.getEmailInput(), value),
  typePassword: (value: string) =>
    userEvent.type(elements.getPasswordInput(), value),
  submitForm: () => userEvent.click(elements.getSubmitButton()),
};

describe("EmailSignInForm", () => {
  describe("given the form is enabled and user submits valid credentials", () => {
    beforeEach(async () => {
      render(<EmailSignInForm enabled={true} />);

      await actions.typeEmail("user@example.com");
      await actions.typePassword("s3cr3t!");
      await actions.submitForm();
    });

    it("calls authClient.signIn.email with the typed email and password", () => {
      expect(vi.mocked(authClient.signIn.email)).toHaveBeenCalledWith(
        expect.objectContaining({
          email: "user@example.com",
          password: "s3cr3t!",
        })
      );
    });
  });

  describe("given the form is enabled", () => {
    beforeEach(() => {
      render(<EmailSignInForm enabled={true} />);
    });

    it("renders the email input", () => {
      expect(elements.getEmailInput()).toBeDefined();
    });
  });

  describe("given the form is disabled", () => {
    beforeEach(() => {
      render(<EmailSignInForm enabled={false} />);
    });

    it("does not render the email input", () => {
      expect(elements.queryEmailInput()).toBeNull();
    });
  });
});
