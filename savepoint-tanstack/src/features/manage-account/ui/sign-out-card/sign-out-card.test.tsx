import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { SignOutCard } from "./sign-out-card";

const elements = {
  getTitle: () => screen.getByText("Sign out"),
  getDescription: () =>
    screen.getByText("Sign out of your account on this device."),
  getActionButton: () =>
    screen.getByRole("button", { name: "Sign out action stub" }),
  queryEmailField: () => screen.queryByLabelText("Email"),
  queryDeleteAccount: () => screen.queryByText("Delete account"),
  queryPasswordField: () => screen.queryByLabelText("Password"),
};

describe("SignOutCard", () => {
  describe("given the card is rendered with a sign-out action slot", () => {
    beforeEach(() => {
      render(
        <SignOutCard
          action={<button type="button">Sign out action stub</button>}
        />
      );
    });

    it("renders the 'Sign out' title", () => {
      expect(elements.getTitle()).toBeDefined();
    });

    it("renders the descriptive copy", () => {
      expect(elements.getDescription()).toBeDefined();
    });

    it("renders the action slot inside the card", () => {
      expect(elements.getActionButton()).toBeDefined();
    });

    it("does not render an email field", () => {
      expect(elements.queryEmailField()).toBeNull();
    });

    it("does not render a delete-account affordance", () => {
      expect(elements.queryDeleteAccount()).toBeNull();
    });

    it("does not render a password field", () => {
      expect(elements.queryPasswordField()).toBeNull();
    });
  });
});
