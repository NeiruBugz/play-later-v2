import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
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

const mockOpenCommandPalette = vi.fn();

vi.mock("@/features/command-palette", () => ({
  openCommandPalette: (...args: any[]) => mockOpenCommandPalette(...args),
}));

const elements = {
  getBrandLink: () => screen.getByRole("link", { name: "SavePoint" }),
  getSearchButton: () => screen.getByRole("button", { name: "Search games" }),
  querySearchLink: () => screen.queryByRole("link", { name: "Search games" }),
  getThemeToggle: () => screen.getByTestId("theme-toggle"),
};

const actions = {
  clickSearch: async () => {
    await userEvent.click(elements.getSearchButton());
  },
};

describe("AppMobileTopbar", () => {
  beforeEach(() => {
    mockOpenCommandPalette.mockReset();
  });

  describe("given the mobile topbar is rendered", () => {
    beforeEach(() => {
      render(<AppMobileTopbar />);
    });

    it("renders a brand link pointing to /", () => {
      expect(elements.getBrandLink()).toHaveAttribute("href", "/");
    });

    it("renders a search button (not a link to /games/search)", () => {
      expect(elements.getSearchButton()).toBeDefined();
    });

    it("does not render a link pointing to /games/search", () => {
      expect(elements.querySearchLink()).toBeNull();
    });

    it("renders the theme toggle", () => {
      elements.getThemeToggle();
    });

    it("hides itself at the md breakpoint", () => {
      expect(screen.getByTestId("app-mobile-topbar").className).toMatch(
        /md:hidden/
      );
    });

    it("search button carries a 44px size utility (h-11 or w-11), not h-9/w-9", () => {
      const searchButton = elements.getSearchButton();
      const hasCorrectSize =
        (searchButton.className.includes("h-11") ||
          searchButton.className.includes("min-h-11")) &&
        (searchButton.className.includes("w-11") ||
          searchButton.className.includes("min-w-11"));
      const hasOldSize =
        searchButton.className.includes("h-9") &&
        searchButton.className.includes("w-9");
      // Must have 44px-equivalent sizing and must NOT still use the old 36px sizing
      expect(hasOldSize).toBe(false);
      expect(hasCorrectSize).toBe(true);
    });
  });

  describe("given the user taps the search button", () => {
    beforeEach(async () => {
      render(<AppMobileTopbar />);
      await actions.clickSearch();
    });

    it("opens the command palette instead of navigating to /games/search", () => {
      expect(mockOpenCommandPalette).toHaveBeenCalledOnce();
    });
  });
});
