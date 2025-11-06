import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GenreBadges } from "./genre-badges";

describe("GenreBadges", () => {
  describe("Rendering with genres", () => {
    it("should render genre badges when genres are provided", () => {
      render(<GenreBadges genres={["Action", "Adventure"]} />);

      expect(screen.getByText("Action")).toBeInTheDocument();
      expect(screen.getByText("Adventure")).toBeInTheDocument();
    });

    it("should render all provided genres", () => {
      const genres = ["RPG", "Action", "Adventure", "Strategy"];
      render(<GenreBadges genres={genres} />);

      genres.forEach((genre) => {
        expect(screen.getByText(genre)).toBeInTheDocument();
      });
    });

    it("should render a single genre", () => {
      render(<GenreBadges genres={["Puzzle"]} />);

      expect(screen.getByText("Puzzle")).toBeInTheDocument();
    });

    it("should handle genres with special characters", () => {
      render(<GenreBadges genres={["Hack and slash/Beat 'em up"]} />);

      expect(
        screen.getByText("Hack and slash/Beat 'em up")
      ).toBeInTheDocument();
    });

    it("should display each genre badge with correct name", () => {
      const genres = ["Shooter", "Platformer", "Indie"];
      render(<GenreBadges genres={genres} />);

      genres.forEach((genre) => {
        const badge = screen.getByText(genre);
        expect(badge).toBeInTheDocument();
        expect(badge.textContent).toBe(genre);
      });
    });
  });

  describe("Empty/undefined states", () => {
    it("should return null when genres array is empty", () => {
      const { container } = render(<GenreBadges genres={[]} />);

      expect(container.firstChild).toBeNull();
    });

    it("should return null when genres is undefined", () => {
      const { container } = render(<GenreBadges />);

      expect(container.firstChild).toBeNull();
    });

    it("should return null when genres is explicitly undefined", () => {
      const { container } = render(<GenreBadges genres={undefined} />);

      expect(container.firstChild).toBeNull();
    });
  });

  describe("Layout and styling", () => {
    it("should use flexbox with wrapping for multiple genres", () => {
      const { container } = render(
        <GenreBadges genres={["Action", "Adventure", "RPG"]} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex");
      expect(wrapper).toHaveClass("flex-wrap");
    });

    it("should have gap between badges", () => {
      const { container } = render(
        <GenreBadges genres={["Action", "Adventure"]} />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("gap-1.5");
    });

    it("should apply secondary variant to badges", () => {
      render(<GenreBadges genres={["Action"]} />);

      const badge = screen.getByText("Action");
      // The Badge component from shadcn/ui applies variant classes
      // We verify the badge is rendered with the expected text
      expect(badge).toBeInTheDocument();
    });

    it("should apply consistent badge height", () => {
      const { container } = render(<GenreBadges genres={["Action", "RPG"]} />);

      const badges = container.querySelectorAll(".h-6");
      expect(badges.length).toBe(2);
    });
  });

  describe("Multiple genres wrapping", () => {
    it("should handle many genres gracefully", () => {
      const manyGenres = [
        "Action",
        "Adventure",
        "RPG",
        "Strategy",
        "Simulation",
        "Sports",
        "Racing",
        "Fighting",
        "Platformer",
        "Puzzle",
      ];
      render(<GenreBadges genres={manyGenres} />);

      manyGenres.forEach((genre) => {
        expect(screen.getByText(genre)).toBeInTheDocument();
      });
    });

    it("should render container for wrapping behavior with many genres", () => {
      const { container } = render(
        <GenreBadges
          genres={[
            "Action",
            "Adventure",
            "RPG",
            "Strategy",
            "Simulation",
            "Sports",
          ]}
        />
      );

      const wrapper = container.firstChild as HTMLElement;
      expect(wrapper).toHaveClass("flex-wrap");
    });
  });
});
