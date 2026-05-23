import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppMobileTopbar } from "./app-mobile-topbar";

vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/toggle-theme", () => ({
  ThemeToggle: () => <button data-testid="theme-toggle" />,
}));

const elements = {
  getBrandLink: () => screen.getByRole("link", { name: "SavePoint" }),
  getSearchLink: () => screen.getByRole("link", { name: "Search games" }),
  getThemeToggle: () => screen.getByTestId("theme-toggle"),
};

describe("AppMobileTopbar", () => {
  describe("given the mobile topbar is rendered", () => {
    beforeEach(() => {
      render(<AppMobileTopbar />);
    });

    it("renders a brand link pointing to /", () => {
      expect(elements.getBrandLink()).toHaveAttribute("href", "/");
    });

    it("renders a search link pointing to /games/search", () => {
      expect(elements.getSearchLink()).toHaveAttribute("href", "/games/search");
    });

    it("renders the theme toggle", () => {
      elements.getThemeToggle();
    });

    it("hides itself at the md breakpoint", () => {
      expect(screen.getByTestId("app-mobile-topbar").className).toMatch(
        /md:hidden/
      );
    });
  });
});
