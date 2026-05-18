import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppBottomNav } from "./app-bottom-nav";

let currentPath = "/library";

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
}));

const elements = {
  getNavLink: (name: string) => screen.getByRole("link", { name }),
  getNav: () => screen.getByRole("navigation"),
};

describe("AppBottomNav", () => {
  describe("given the bottom nav is rendered", () => {
    beforeEach(() => {
      currentPath = "/library";
      render(<AppBottomNav />);
    });

    it("renders exactly three nav links", () => {
      expect(screen.getAllByRole("link")).toHaveLength(3);
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

    it("hides itself at the md breakpoint", () => {
      expect(elements.getNav().className).toMatch(/md:hidden/);
    });

    it("marks the current path link with aria-current=page", () => {
      expect(elements.getNavLink("Library")).toHaveAttribute(
        "aria-current",
        "page"
      );
    });
  });
});
