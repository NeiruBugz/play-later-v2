import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";

import { CommandPaletteProvider } from "@/features/command-palette";

import { EmptyLibraryHero } from "./empty-library-hero";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

function renderWithProvider(ui: React.ReactElement) {
  return render(<CommandPaletteProvider>{ui}</CommandPaletteProvider>);
}

describe("EmptyLibraryHero", () => {
  describe("library variant", () => {
    it("renders the heading and description", () => {
      renderWithProvider(<EmptyLibraryHero variant="library" />);
      expect(
        screen.getByRole("heading", { name: /start your gaming journey/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/track what you/i)).toBeInTheDocument();
    });

    it("renders the Steam import CTA pointing at /steam/games", () => {
      renderWithProvider(<EmptyLibraryHero variant="library" />);
      const link = screen.getByRole("link", { name: /import from steam/i });
      expect(link).toHaveAttribute("href", "/steam/games");
    });

    it("renders the Search for Games CTA pointing at /games/search", () => {
      renderWithProvider(<EmptyLibraryHero variant="library" />);
      const link = screen.getByRole("link", { name: /search for games/i });
      expect(link).toHaveAttribute("href", "/games/search");
    });

    it("does not render a Browse Popular CTA", () => {
      renderWithProvider(<EmptyLibraryHero variant="library" />);
      expect(
        screen.queryByRole("link", { name: /browse popular/i })
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: /browse popular/i })
      ).not.toBeInTheDocument();
    });

    it("applies library-variant container styling", () => {
      renderWithProvider(<EmptyLibraryHero variant="library" />);
      const root = screen.getByTestId("empty-library-hero");
      expect(root).toHaveAttribute("data-variant", "library");
      expect(root.className).toContain("max-w-2xl");
    });
  });

  describe("dashboard variant", () => {
    it("renders the heading and description", () => {
      renderWithProvider(<EmptyLibraryHero variant="dashboard" />);
      expect(
        screen.getByRole("heading", { name: /start your gaming journey/i })
      ).toBeInTheDocument();
      expect(screen.getByText(/track what you/i)).toBeInTheDocument();
    });

    it("renders Steam import as a link and Search for Games as a palette button", () => {
      renderWithProvider(<EmptyLibraryHero variant="dashboard" />);
      expect(
        screen.getByRole("link", { name: /import from steam/i })
      ).toHaveAttribute("href", "/steam/games");
      expect(
        screen.queryByRole("link", { name: /search for games/i })
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: /search for games/i })
      ).toBeInTheDocument();
    });

    it("opens the command palette when Search for Games is clicked", async () => {
      renderWithProvider(<EmptyLibraryHero variant="dashboard" />);
      const button = screen.getByRole("button", {
        name: /search for games/i,
      });
      await userEvent.click(button);
    });

    it("does not render a Browse Popular CTA", () => {
      renderWithProvider(<EmptyLibraryHero variant="dashboard" />);
      expect(
        screen.queryByRole("link", { name: /browse popular/i })
      ).not.toBeInTheDocument();
    });

    it("applies dashboard-variant container styling distinct from library", () => {
      renderWithProvider(<EmptyLibraryHero variant="dashboard" />);
      const root = screen.getByTestId("empty-library-hero");
      expect(root).toHaveAttribute("data-variant", "dashboard");
      expect(root.className).not.toContain("max-w-2xl");
    });
  });

  it("defaults to the library variant when no prop is passed", () => {
    renderWithProvider(<EmptyLibraryHero />);
    expect(screen.getByTestId("empty-library-hero")).toHaveAttribute(
      "data-variant",
      "library"
    );
  });
});
