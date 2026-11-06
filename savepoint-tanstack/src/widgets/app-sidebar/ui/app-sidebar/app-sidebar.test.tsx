import { act, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { STATUS_ENTRIES } from "@/entities/library-item/model";
import { authClient } from "@/shared/api/auth-client";

import { AppSidebar } from "./app-sidebar";

let currentPath = "/library";

const mockRouterInvalidate = vi.fn();
const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, activeProps, search, children, ...rest }: any) => {
    const active = currentPath === to;
    const extra = active && activeProps ? activeProps : {};
    const searchAttr =
      typeof search === "function"
        ? { "data-search": JSON.stringify(search({})) }
        : {};
    return (
      <a href={to} {...rest} {...extra} {...searchAttr}>
        {children}
      </a>
    );
  },
  useRouter: () => ({ invalidate: mockRouterInvalidate }),
  useNavigate: () => mockNavigate,
}));

vi.mock("@/shared/api/auth-client", () => ({
  authClient: {
    signOut: vi.fn(),
  },
}));

vi.mock("@/features/command-palette", () => ({
  openCommandPalette: vi.fn(),
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
  queryNavLink: (name: string) => screen.queryByRole("link", { name }),
  getBrandLink: () => screen.getByRole("link", { name: "Continue?" }),
  getSearchTrigger: () =>
    screen.getByRole("button", { name: "Open command palette" }),
  getAddGameLink: () => screen.getByRole("link", { name: "Add game" }),
  getLogSessionCta: () => screen.getByRole("button", { name: "Log" }),
  queryLogSessionCta: () => screen.queryByRole("button", { name: "Log" }),
  getThemeToggle: () => screen.getByTestId("theme-toggle"),
  getUserMenuTrigger: () =>
    screen.getByRole("button", { name: "Open user menu" }),
  getSignOutItem: () => screen.getByRole("menuitem", { name: /Sign out/ }),
  getProfileSettingsItem: () =>
    screen.getByRole("menuitem", { name: /Profile settings/ }),
  querySignOutItem: () => screen.queryByRole("menuitem", { name: /Sign out/ }),
  queryAccountItem: () => screen.queryByRole("menuitem", { name: /Account/ }),
  getCollapseToggle: () =>
    screen.getByRole("button", { name: /Collapse sidebar|Expand sidebar/ }),
  getSidebar: () => screen.getByTestId("app-sidebar"),
};

const iconClass = (control: HTMLElement) =>
  // eslint-disable-next-line testing-library/no-node-access
  control.querySelector("svg")?.getAttribute("class");

const actions = {
  openUserMenu: async () => {
    await userEvent.click(elements.getUserMenuTrigger());
  },
  clickSignOut: async () => {
    await userEvent.click(elements.getSignOutItem());
  },
  clickLogSession: async () => {
    await userEvent.click(elements.getLogSessionCta());
  },
  clickCollapseToggle: async () => {
    await userEvent.click(elements.getCollapseToggle());
  },
};

describe("AppSidebar", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
    window.localStorage.removeItem("app:sidebar-collapsed");
  });

  afterEach(() => {
    window.localStorage.removeItem("app:sidebar-collapsed");
  });

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

    it("renders a Home nav link with href /dashboard", () => {
      expect(elements.getNavLink("Home")).toHaveAttribute("href", "/dashboard");
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

    it("renders a prominent Log CTA button", () => {
      expect(elements.getLogSessionCta()).toBeDefined();
    });

    it("renders an Add game item that opens the add search", () => {
      expect(elements.getAddGameLink()).toHaveAttribute(
        "data-search",
        JSON.stringify({ action: "add-game" })
      );
    });

    it("gives Add game and Log different icons", () => {
      expect(iconClass(elements.getAddGameLink())).toContain("lucide-");
      expect(iconClass(elements.getAddGameLink())).not.toBe(
        iconClass(elements.getLogSessionCta())
      );
    });

    it("gives Add game an icon different from every status icon", () => {
      const addIcon = iconClass(elements.getAddGameLink());
      for (const { icon: StatusIcon, label } of STATUS_ENTRIES) {
        const { container, unmount } = render(<StatusIcon />);
        const statusClass = iconClass(container as unknown as HTMLElement);
        expect(addIcon, label).not.toBe(statusClass);
        unmount();
      }
    });

    it("renders the theme toggle", () => {
      elements.getThemeToggle();
    });

    it("renders the user display name", () => {
      expect(screen.getByText("Ada")).toBeDefined();
    });

    it("renders an initial-avatar fallback", () => {
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

    it("does not mark the Home link as the current page", () => {
      expect(elements.getNavLink("Home")).not.toHaveAttribute("aria-current");
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

  describe("given the user clicks the Log CTA", () => {
    beforeEach(async () => {
      currentPath = "/library";
      render(<AppSidebar user={stubUser} />);
      await actions.clickLogSession();
    });

    it("calls navigate with a search updater that sets action to log-session", () => {
      expect(mockNavigate).toHaveBeenCalledOnce();
      const [callArg] = mockNavigate.mock.calls[0];
      const updater = callArg.search;
      expect(typeof updater).toBe("function");
      const result = updater({});
      expect(result).toMatchObject({ action: "log-session" });
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
      expect(elements.getProfileSettingsItem()).toHaveAttribute(
        "href",
        "/settings/profile"
      );
    });

    it("reveals the Account menu item linking to /settings/account", () => {
      expect(elements.queryAccountItem()).toHaveAttribute(
        "href",
        "/settings/account"
      );
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

  describe("given the sidebar is expanded (default state)", () => {
    beforeEach(() => {
      currentPath = "/dashboard";
      render(<AppSidebar user={stubUser} />);
    });

    it("renders a Collapse sidebar toggle button", () => {
      expect(
        screen.getByRole("button", { name: "Collapse sidebar" })
      ).toBeDefined();
    });

    it("renders the sidebar at expanded width (w-64 class)", () => {
      expect(elements.getSidebar().className).toMatch(/w-64/);
    });

    it("renders nav link labels as visible text", () => {
      expect(screen.getByText("Home")).toBeDefined();
      expect(screen.getByText("Library")).toBeDefined();
    });
  });

  describe("given the user clicks Collapse sidebar", () => {
    beforeEach(async () => {
      currentPath = "/dashboard";
      render(<AppSidebar user={stubUser} />);
      await actions.clickCollapseToggle();
    });

    it("switches the toggle label to Expand sidebar", () => {
      expect(
        screen.getByRole("button", { name: "Expand sidebar" })
      ).toBeDefined();
    });

    it("switches the sidebar to collapsed width (w-16 class)", () => {
      expect(elements.getSidebar().className).toMatch(/w-16/);
    });

    it("nav links carry aria-label in collapsed mode so the destination is still announced", () => {
      expect(elements.getNavLink("Home")).toBeDefined();
      expect(elements.getNavLink("Library")).toBeDefined();
    });

    it("persists collapsed=true to localStorage", () => {
      expect(window.localStorage.getItem("app:sidebar-collapsed")).toBe("true");
    });
  });

  describe("given only the old sp: key has sidebar-collapsed=true on mount", () => {
    beforeEach(() => {
      window.localStorage.setItem("sp:sidebar-collapsed", "true");
      currentPath = "/dashboard";
      render(<AppSidebar user={stubUser} />);
    });

    afterEach(() => {
      window.localStorage.removeItem("sp:sidebar-collapsed");
    });

    it("mounts in collapsed state (w-16 class)", () => {
      expect(elements.getSidebar().className).toMatch(/w-16/);
    });

    it("moves the choice to the new key and deletes the old one", () => {
      expect([
        window.localStorage.getItem("app:sidebar-collapsed"),
        window.localStorage.getItem("sp:sidebar-collapsed"),
      ]).toEqual(["true", null]);
    });
  });

  describe("given localStorage has sidebar-collapsed=true on mount", () => {
    beforeEach(() => {
      window.localStorage.setItem("app:sidebar-collapsed", "true");
      currentPath = "/dashboard";
      render(<AppSidebar user={stubUser} />);
    });

    it("mounts in collapsed state (w-16 class)", () => {
      expect(elements.getSidebar().className).toMatch(/w-16/);
    });

    it("shows the Expand sidebar toggle", () => {
      expect(
        screen.getByRole("button", { name: "Expand sidebar" })
      ).toBeDefined();
    });
  });

  describe("given a collapsed preference is stored and the server rendered the default", () => {
    const recoverableErrors: unknown[] = [];
    let container: HTMLDivElement;

    beforeEach(async () => {
      recoverableErrors.length = 0;
      currentPath = "/dashboard";
      const serverHtml = renderToString(<AppSidebar user={stubUser} />);
      window.localStorage.setItem("app:sidebar-collapsed", "true");
      container = document.createElement("div");
      container.innerHTML = serverHtml;
      document.body.appendChild(container);
      await act(async () => {
        hydrateRoot(container, <AppSidebar user={stubUser} />, {
          onRecoverableError: (error) => recoverableErrors.push(error),
        });
      });
    });

    afterEach(() => {
      document.body.replaceChildren();
    });

    it("hydrates without discarding the server HTML", () => {
      expect(recoverableErrors).toEqual([]);
    });

    it("settles into the stored collapsed state", () => {
      expect(elements.getSidebar().className).toMatch(/w-16/);
    });
  });

  describe("given the stored preference is expanded and the user collapses then reloads", () => {
    it("keeps the stored preference untouched by merely mounting", () => {
      window.localStorage.setItem("app:sidebar-collapsed", "true");
      currentPath = "/dashboard";
      render(<AppSidebar user={stubUser} />);
      expect(window.localStorage.getItem("app:sidebar-collapsed")).toBe("true");
    });
  });
});
