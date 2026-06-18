import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SettingsList } from "./settings-list";

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
  useNavigate: () => vi.fn(),
}));

vi.mock("@/features/toggle-theme", () => ({
  ThemeToggle: () => <div data-testid="theme-toggle">Theme Toggle</div>,
}));

const elements = {
  getProfileRow: () => screen.getByRole("link", { name: "Profile" }),
  getAccountRow: () => screen.getByRole("link", { name: "Account" }),
  getAppearanceHeader: () =>
    screen.getByTestId("settings-group-header-appearance"),
  getAccountHeader: () => screen.getByTestId("settings-group-header-account"),
  getThemeToggle: () => screen.getByTestId("theme-toggle"),
  getFooter: () => screen.getByText("SavePoint · for patient gamers"),
};

describe("SettingsList", () => {
  describe("given the settings list is rendered", () => {
    beforeEach(() => {
      render(<SettingsList />);
    });

    it("renders a Profile row that navigates to /settings/profile", () => {
      expect(elements.getProfileRow()).toHaveAttribute(
        "href",
        "/settings/profile"
      );
    });

    it("renders an Account row that navigates to /settings/account", () => {
      expect(elements.getAccountRow()).toHaveAttribute(
        "href",
        "/settings/account"
      );
    });

    it("renders an Appearance group and an Account group", () => {
      expect(elements.getAppearanceHeader()).toBeDefined();
      expect(elements.getAccountHeader()).toBeDefined();
    });

    it("renders the ThemeToggle inside the Appearance group", () => {
      expect(elements.getThemeToggle()).toBeDefined();
    });

    it("renders the version footer tagline", () => {
      expect(elements.getFooter()).toBeDefined();
    });

    it("renders Profile and Account rows as full-height tappable elements", () => {
      const settingsRows = screen.getAllByTestId("settings-row");
      expect(settingsRows.length).toBeGreaterThanOrEqual(2);
    });
  });

  describe("given activeSegment is 'profile'", () => {
    beforeEach(() => {
      render(<SettingsList activeSegment="profile" />);
    });

    it("marks the Profile row with data-active", () => {
      expect(elements.getProfileRow()).toHaveAttribute("data-active", "");
    });

    it("does not mark the Account row as active", () => {
      expect(elements.getAccountRow()).not.toHaveAttribute("data-active");
    });
  });

  describe("given activeSegment is 'account'", () => {
    beforeEach(() => {
      render(<SettingsList activeSegment="account" />);
    });

    it("marks the Account row with data-active", () => {
      expect(elements.getAccountRow()).toHaveAttribute("data-active", "");
    });

    it("does not mark the Profile row as active", () => {
      expect(elements.getProfileRow()).not.toHaveAttribute("data-active");
    });
  });
});
