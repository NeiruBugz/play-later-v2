import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { EmptyLibraryHero } from "./empty-library-hero";

describe("EmptyLibraryHero", () => {
  describe("library variant", () => {
    it("renders the heading and description", () => {
      render(<EmptyLibraryHero variant="library" />);
      expect(
        screen.getByRole("heading", { name: /start your gaming journey/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/track what you/i)).toBeInTheDocument();
    });

    it("renders the Steam import CTA pointing at /steam/games", () => {
      render(<EmptyLibraryHero variant="library" />);
      const link = screen.getByRole("link", { name: /import from steam/i });
      expect(link).toHaveAttribute("href", "/steam/games");
    });

    it("renders the Search for Games CTA pointing at /games/search", () => {
      render(<EmptyLibraryHero variant="library" />);
      const link = screen.getByRole("link", { name: /search for games/i });
      expect(link).toHaveAttribute("href", "/games/search");
    });

    it("does not render a Browse Popular CTA", () => {
      render(<EmptyLibraryHero variant="library" />);
      expect(
        screen.queryByRole("link", { name: /browse popular/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /browse popular/i })
      ).not.toBeInTheDocument();
    });

    it("applies library-variant container styling", () => {
      render(<EmptyLibraryHero variant="library" />);
      const root = screen.getByTestId("empty-library-hero");
      expect(root).toHaveAttribute("data-variant", "library");
      expect(root.className).toContain("max-w-2xl");
    });
  });

  describe("dashboard variant", () => {
    it("renders the heading and description", () => {
      render(<EmptyLibraryHero variant="dashboard" />);
      expect(
        screen.getByRole("heading", { name: /start your gaming journey/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/track what you/i)).toBeInTheDocument();
    });

    it("renders both CTAs with correct hrefs", () => {
      render(<EmptyLibraryHero variant="dashboard" />);
      expect(
        screen.getByRole("link", { name: /import from steam/i })
      ).toHaveAttribute("href", "/steam/games");
      expect(
        screen.getByRole("link", { name: /search for games/i })
      ).toHaveAttribute("href", "/games/search");
    });

    it("does not render a Browse Popular CTA", () => {
      render(<EmptyLibraryHero variant="dashboard" />);
      expect(
        screen.queryByRole("link", { name: /browse popular/i })
      ).not.toBeInTheDocument();
    });

    it("applies dashboard-variant container styling distinct from library", () => {
      render(<EmptyLibraryHero variant="dashboard" />);
      const root = screen.getByTestId("empty-library-hero");
      expect(root).toHaveAttribute("data-variant", "dashboard");
      expect(root.className).not.toContain("max-w-2xl");
    });
  });

  it("defaults to the library variant when no prop is passed", () => {
    render(<EmptyLibraryHero />);
    expect(screen.getByTestId("empty-library-hero")).toHaveAttribute(
      "data-variant",
      "library"
    );
  });
});
