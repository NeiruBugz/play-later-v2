import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "./settings";

// Mock useIsDesktop BEFORE importing the route so we can control the branch
const mockUseIsDesktop = vi.fn(() => false);

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mockUseIsDesktop(),
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
  }),
  useRouterState: ({ select }: any) =>
    select({ location: { pathname: "/settings" } }),
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock("@/widgets/settings-rail", () => ({
  SettingsRail: ({ activeSegment }: { activeSegment?: string }) => (
    <nav data-testid="settings-rail" data-segment={activeSegment} />
  ),
  SettingsList: ({ activeSegment }: { activeSegment?: string }) => (
    <nav
      data-testid="settings-list"
      data-segment={activeSegment}
      role="navigation"
      aria-label="Settings"
    >
      <a href="/settings/profile">Profile</a>
      <a href="/settings/account">Account</a>
    </nav>
  ),
}));

const SettingsLayout = Route.options.component as React.ComponentType;

const elements = {
  getSettingsRail: () => screen.queryByTestId("settings-rail"),
  getSettingsList: () => screen.queryByTestId("settings-list"),
  getOutlet: () => screen.getByTestId("outlet"),
  // exact name match avoids colliding with "Back to profile"
  getProfileLink: () => screen.getByRole("link", { name: "Profile" }),
  getAccountLink: () => screen.getByRole("link", { name: "Account" }),
};

describe("SettingsLayout", () => {
  describe("given the user is on a phone (desktop=false)", () => {
    beforeEach(() => {
      mockUseIsDesktop.mockReturnValue(false);
      render(<SettingsLayout />);
    });

    it("renders the mobile settings list (settings-list)", () => {
      expect(elements.getSettingsList()).not.toBeNull();
    });

    it("does not render the desktop settings rail at the top level", () => {
      expect(elements.getSettingsRail()).toBeNull();
    });

    it("renders a Profile row that links to /settings/profile", () => {
      expect(elements.getProfileLink()).toHaveAttribute(
        "href",
        "/settings/profile"
      );
    });

    it("renders an Account row that links to /settings/account", () => {
      expect(elements.getAccountLink()).toHaveAttribute(
        "href",
        "/settings/account"
      );
    });
  });

  describe("given the user is on desktop (desktop=true)", () => {
    beforeEach(() => {
      mockUseIsDesktop.mockReturnValue(true);
      render(<SettingsLayout />);
    });

    it("renders the desktop settings rail", () => {
      expect(elements.getSettingsRail()).not.toBeNull();
    });

    it("does not render the full-page mobile settings list", () => {
      // On desktop the outlet renders immediately alongside the rail
      // The settings-list component is not rendered in the desktop branch
      expect(elements.getSettingsList()).toBeNull();
    });

    it("renders the outlet for the selected settings panel", () => {
      expect(elements.getOutlet()).toBeDefined();
    });
  });
});
