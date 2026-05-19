import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { authClient } from "@/shared/api/auth-client";

import { AppSidebar } from "./app-sidebar";

let currentPath = "/library";

const mockRouterInvalidate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, activeProps, children, ...rest }: any) => {
    const active = currentPath === to;
    const extra = active && activeProps ? activeProps : {};
    return (
      <a href={to} {...rest} {...extra}>
        {children}
      </a>
    );
  },
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
}));

vi.mock("@/shared/api/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

vi.mock("@/features/toggle-theme", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" />,
}));

const stubUser = {
  id: "u1",
  name: "Ada",
  username: "ada",
  image: "https://example.com/a.png",
};

const elements = {
  getNavLink: (name: string) => screen.getByRole("link", { name }),
  getBrandLink: () => screen.getByRole("link", { name: "SavePoint" }),
  getSearchTrigger: () =>
    screen.getByRole("button", { name: "Open command palette" }),
  getThemeToggle: () => screen.getByTestId("theme-toggle"),
  getUserMenuTrigger: () =>
    screen.getByRole("button", { name: "Open user menu" }),
  getSignOutItem: () => screen.getByRole("menuitem", { name: /Sign out/ }),
  getProfileSettingsItem: () =>
    screen.getByRole("menuitem", { name: /Profile settings/ }),
  querySignOutItem: () => screen.queryByRole("menuitem", { name: /Sign out/ }),
  queryAccountItem: () => screen.queryByRole("menuitem", { name: /Account/ }),
};

const actions = {
  openUserMenu: async () => {
    await userEvent.click(elements.getUserMenuTrigger());
  },
  clickSignOut: async () => {
    await userEvent.click(elements.getSignOutItem());
  },
};

describe("AppSidebar", () => {
  describe("given the sidebar is rendered", () => {
    beforeEach(() => {
      currentPath = "/profile";
      render(<AppSidebar user={stubUser} />);
    });

    it("renders a brand link pointing to /dashboard", () => {
      expect(elements.getBrandLink()).toHaveAttribute("href", "/dashboard");
    });

    it("renders the search trigger button", () => {
      elements.getSearchTrigger();
    });

    it("renders a Library link with href /library", () => {
      expect(elements.getNavLink("Library")).toHaveAttribute(
        "href",
        "/library"
      );
    });

    it("renders a Journal link with href /journal", () => {
      expect(elements.getNavLink("Journal")).toHaveAttribute(
        "href",
        "/journal"
      );
    });

    it("renders a Profile link with href /profile", () => {
      expect(elements.getNavLink("Profile")).toHaveAttribute(
        "href",
        "/profile"
      );
    });

    it("renders a Settings link with href /settings/profile", () => {
      expect(elements.getNavLink("Settings")).toHaveAttribute(
        "href",
        "/settings/profile"
      );
    });

    it("renders the theme toggle", () => {
      elements.getThemeToggle();
    });

    it("renders the user display name", () => {
      expect(screen.getByText("Ada")).toBeDefined();
    });

    it("renders an initial-avatar fallback (Phase 3 visual-parity push)", () => {
      // The Radix Avatar primitive renders the fallback span once the
      // image fails to load; in the test environment no <img> resolves,
      // so the fallback is mounted immediately.
      expect(screen.getByLabelText("Ada")).toBeDefined();
    });

    it("does not show the sign-out item before the menu is opened", () => {
      expect(elements.querySignOutItem()).toBeNull();
    });
  });

  describe("given the current path is /library", () => {
    beforeEach(() => {
      currentPath = "/library";
      render(<AppSidebar user={stubUser} />);
    });

    it("marks the Library link as the current page", () => {
      expect(elements.getNavLink("Library")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Profile link as the current page", () => {
      expect(elements.getNavLink("Profile")).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("does not mark the Journal link as the current page", () => {
      expect(elements.getNavLink("Journal")).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("does not mark the Settings link as the current page", () => {
      expect(elements.getNavLink("Settings")).not.toHaveAttribute(
        "aria-current"
      );
    });
  });

  describe("given the current path is /profile", () => {
    beforeEach(() => {
      currentPath = "/profile";
      render(<AppSidebar user={stubUser} />);
    });

    it("marks the Profile link as the current page", () => {
      expect(elements.getNavLink("Profile")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark the Library link as the current page", () => {
      expect(elements.getNavLink("Library")).not.toHaveAttribute(
        "aria-current"
      );
    });
  });

  describe("given the user opens the user menu", () => {
    beforeEach(async () => {
      currentPath = "/library";
      vi.mocked(authClient.signOut).mockResolvedValue(undefined as any);
      render(<AppSidebar user={stubUser} />);
      await actions.openUserMenu();
    });

    it("reveals the Sign out menu item", () => {
      elements.getSignOutItem();
    });

    it("reveals the Profile settings menu item linking to /settings/profile", () => {
      // DropdownMenuItem with asChild renders the Link as the menuitem; the
      // mocked Link forwards `to` as `href` on the underlying <a>.
      expect(elements.getProfileSettingsItem()).toHaveAttribute(
        "href",
        "/settings/profile"
      );
    });

    it("omits the Account entry until S18 ships /settings/account", () => {
      expect(elements.queryAccountItem()).toBeNull();
    });

    it("calls authClient.signOut when Sign out is clicked", async () => {
      await actions.clickSignOut();
      expect(vi.mocked(authClient.signOut)).toHaveBeenCalled();
    });

    it("closes the menu when Escape is pressed", async () => {
      await userEvent.keyboard("{Escape}");
      expect(elements.querySignOutItem()).toBeNull();
    });
  });
});
