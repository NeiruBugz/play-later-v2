import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppBottomNav } from "./app-bottom-nav";

let currentPath = "/library";

const mockNavigate = vi.fn();

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
  useNavigate: () => mockNavigate,
}));

const elements = {
  getNavLink: (name: string) => screen.getByRole("link", { name }),
  queryNavLink: (name: string) => screen.queryByRole("link", { name }),
  getLogButton: () => screen.getByRole("button", { name: "Log a session" }),
  queryLogButton: () => screen.queryByRole("button", { name: "Log a session" }),
  getAllLinks: () => screen.getAllByRole("link"),
  getNav: () => screen.getByRole("navigation"),
};

const actions = {
  clickLog: async () => {
    await userEvent.click(elements.getLogButton());
  },
};

describe("AppBottomNav", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given the bottom nav is rendered on the Library page", () => {
    beforeEach(() => {
      currentPath = "/library";
      render(<AppBottomNav />);
    });

    it("renders exactly five controls (Home, Library, Log, Journal, Profile)", () => {
      // 4 destination links + 1 Log button
      expect(elements.getAllLinks()).toHaveLength(4);
      expect(elements.getLogButton()).toBeDefined();
    });

    it("renders the Home link with href /dashboard as the first slot", () => {
      expect(elements.getNavLink("Home")).toHaveAttribute("href", "/dashboard");
    });

    it("renders the Library link with href /library", () => {
      expect(elements.getNavLink("Library")).toHaveAttribute(
        "href",
        "/library"
      );
    });

    it("renders the Journal link with href /journal", () => {
      expect(elements.getNavLink("Journal")).toHaveAttribute(
        "href",
        "/journal"
      );
    });

    it("renders the Profile link with href /profile", () => {
      expect(elements.getNavLink("Profile")).toHaveAttribute(
        "href",
        "/profile"
      );
    });

    it("renders a center Log button, not a destination link", () => {
      expect(elements.getLogButton()).toBeDefined();
    });

    it("marks the active destination with aria-current=page", () => {
      expect(elements.getNavLink("Library")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });

    it("does not mark non-active destinations with aria-current", () => {
      expect(elements.getNavLink("Home")).not.toHaveAttribute("aria-current");
      expect(elements.getNavLink("Journal")).not.toHaveAttribute(
        "aria-current"
      );
      expect(elements.getNavLink("Profile")).not.toHaveAttribute(
        "aria-current"
      );
    });

    it("hides itself at the md breakpoint", () => {
      expect(elements.getNav().className).toMatch(/md:hidden/);
    });
  });

  describe("given the user taps the Log button", () => {
    beforeEach(async () => {
      currentPath = "/library";
      render(<AppBottomNav />);
      await actions.clickLog();
    });

    it("calls navigate with a search updater that sets action to log-session", () => {
      expect(mockNavigate).toHaveBeenCalledOnce();
      const [callArg] = mockNavigate.mock.calls[0];
      // The Log button navigates via a search updater function so the
      // current route + other params are preserved.
      const updater = callArg.search;
      expect(typeof updater).toBe("function");
      const result = updater({});
      expect(result).toMatchObject({ action: "log-session" });
    });
  });

  describe("given the active destination has a non-color active indicator", () => {
    beforeEach(() => {
      currentPath = "/journal";
      render(<AppBottomNav />);
    });

    it("marks the Journal link with aria-current=page (color-only active is not acceptable)", () => {
      expect(elements.getNavLink("Journal")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });

  describe("given tap-target sizes", () => {
    beforeEach(() => {
      currentPath = "/library";
      render(<AppBottomNav />);
    });

    it("destination links carry a 44px min-height utility (h-11 or min-h-11)", () => {
      const libraryLink = elements.getNavLink("Library");
      expect(
        libraryLink.className.includes("h-11") ||
          libraryLink.className.includes("min-h-11")
      ).toBe(true);
    });

    it("the Log button is a ≥44px circular FAB", () => {
      const logButton = elements.getLogButton();
      // The Log FAB is a 56px circle (size-14) — a true square, satisfying the ≥44px tap-target requirement.
      expect(
        logButton.className.includes("size-14") ||
          logButton.className.includes("h-14")
      ).toBe(true);
      expect(logButton.className.includes("rounded-full")).toBe(true);
    });
  });
});
