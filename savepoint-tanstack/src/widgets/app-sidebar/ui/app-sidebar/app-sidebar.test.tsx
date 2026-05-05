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
  image: "https://example.com/a.png",
};

const elements = {
  getNavLink: (name: string) => screen.getByRole("link", { name }),
  getBrandLink: () => screen.getByRole("link", { name: "SavePoint" }),
  getSearchTrigger: () =>
    screen.getByRole("button", { name: "Open command palette" }),
  getThemeToggle: () => screen.getByTestId("theme-toggle"),
  getUserMenuTrigger: () =>
    screen.getByRole("button", { name: /Ada/i, hidden: false }),
  getSignOutItem: () => screen.getByRole("menuitem", { name: "Sign out" }),
  querySignOutItem: () => screen.queryByRole("menuitem", { name: "Sign out" }),
};

const actions = {
  openUserMenu: async () => {
    await userEvent.click(elements.getUserMenuTrigger());
  },
  clickSignOut: async () => {
    await actions.openUserMenu();
    await userEvent.click(elements.getSignOutItem());
  },
};

describe("AppSidebar", () => {
  describe("given the sidebar is rendered", () => {
    beforeEach(() => {
      currentPath = "/profile";
      render(<AppSidebar user={stubUser} />);
    });

    it("renders a brand link pointing to /", () => {
      expect(elements.getBrandLink()).toHaveAttribute("href", "/");
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

    it("calls authClient.signOut when Sign out is clicked", async () => {
      await userEvent.click(elements.getSignOutItem());
      expect(vi.mocked(authClient.signOut)).toHaveBeenCalled();
    });
  });
});
