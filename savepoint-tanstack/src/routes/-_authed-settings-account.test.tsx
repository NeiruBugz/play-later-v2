import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./_authed/settings/account";

vi.mock("@/features/auth-sign-out", () => ({
  LogoutButton: () => (
    <button type="button" data-testid="logout-button-mock">
      Sign out action
    </button>
  ),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
  }),
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  getHeading: () => screen.getByRole("heading", { name: "Account" }),
  getSignOutTitle: () => screen.getByText("Sign out"),
  getLogoutButton: () => screen.getByTestId("logout-button-mock"),
  queryEmailField: () => screen.queryByLabelText(/email/i),
  queryDeleteAccount: () => screen.queryByText(/delete account/i),
};

describe("settings/account route", () => {
  describe("given the route component is rendered", () => {
    beforeEach(() => {
      const SettingsAccountComponent = Route.options.component as ComponentType;
      render(<SettingsAccountComponent />);
    });

    it("renders the 'Account' page heading", () => {
      expect(elements.getHeading()).toBeDefined();
    });

    it("renders the SignOutCard with its title", () => {
      expect(elements.getSignOutTitle()).toBeDefined();
    });

    it("mounts the LogoutButton inside the card", () => {
      expect(elements.getLogoutButton()).toBeDefined();
    });

    it("does not render any email display", () => {
      expect(elements.queryEmailField()).toBeNull();
    });

    it("does not render a delete-account affordance", () => {
      expect(elements.queryDeleteAccount()).toBeNull();
    });
  });
});
