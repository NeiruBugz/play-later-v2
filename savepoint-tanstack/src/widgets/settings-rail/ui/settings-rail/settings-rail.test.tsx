import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SettingsRail } from "./settings-rail";

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
  } & React.HTMLAttributes<HTMLAnchorElement>) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

const elements = {
  getProfileLink: () => screen.getByRole("link", { name: /Profile/ }),
  getAccountLink: () => screen.getByRole("link", { name: /Account/ }),
};

describe("SettingsRail", () => {
  describe("given no active segment", () => {
    it("renders Profile and Account links pointing at the settings routes", () => {
      render(<SettingsRail />);
      expect(elements.getProfileLink()).toHaveAttribute(
        "href",
        "/settings/profile"
      );
      expect(elements.getAccountLink()).toHaveAttribute(
        "href",
        "/settings/account"
      );
    });
  });

  describe("given activeSegment is 'profile'", () => {
    it("marks the Profile link as active via data-active", () => {
      render(<SettingsRail activeSegment="profile" />);
      expect(elements.getProfileLink()).toHaveAttribute("data-active", "");
      expect(elements.getAccountLink()).not.toHaveAttribute("data-active");
    });
  });

  describe("given activeSegment is 'account'", () => {
    it("marks the Account link as active via data-active", () => {
      render(<SettingsRail activeSegment="account" />);
      expect(elements.getAccountLink()).toHaveAttribute("data-active", "");
      expect(elements.getProfileLink()).not.toHaveAttribute("data-active");
    });
  });
});
