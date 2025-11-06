import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameDescription } from "./game-description";

describe("GameDescription", () => {
  describe("when summary is provided", () => {
    it("should display the game summary", () => {
      const summary =
        "An epic adventure game where players explore vast landscapes.";
      render(<GameDescription summary={summary} />);

      expect(screen.getByText(summary)).toBeInTheDocument();
    });

    it("should not apply italic styling when summary exists", () => {
      const summary = "A thrilling action game.";
      render(<GameDescription summary={summary} />);

      const paragraph = screen.getByText(summary);
      expect(paragraph).not.toHaveClass("italic");
    });

    it("should display summary with proper text styling", () => {
      const summary = "Test game description.";
      render(<GameDescription summary={summary} />);

      const paragraph = screen.getByText(summary);
      expect(paragraph).toHaveClass("text-lg");
      expect(paragraph).toHaveClass("text-muted-foreground");
    });
  });

  describe("when summary is missing", () => {
    it("should display placeholder when summary is undefined", () => {
      render(<GameDescription summary={undefined} />);

      expect(screen.getByText("No description available")).toBeInTheDocument();
    });

    it("should display placeholder when summary is null", () => {
      render(<GameDescription summary={null} />);

      expect(screen.getByText("No description available")).toBeInTheDocument();
    });

    it("should display placeholder when summary is empty string", () => {
      render(<GameDescription summary="" />);

      expect(screen.getByText("No description available")).toBeInTheDocument();
    });

    it("should display placeholder when summary is only whitespace", () => {
      render(<GameDescription summary="   " />);

      expect(screen.getByText("No description available")).toBeInTheDocument();
    });

    it("should apply italic styling to placeholder text", () => {
      render(<GameDescription summary={null} />);

      const paragraph = screen.getByText("No description available");
      expect(paragraph).toHaveClass("italic");
      expect(paragraph).toHaveClass("text-muted-foreground");
    });
  });

  describe("edge cases", () => {
    it("should handle summary with leading whitespace", () => {
      const summary = "  A game with leading spaces";
      render(<GameDescription summary={summary} />);

      // Should display trimmed version
      expect(
        screen.getByText("A game with leading spaces")
      ).toBeInTheDocument();
    });

    it("should handle summary with trailing whitespace", () => {
      const summary = "A game with trailing spaces  ";
      render(<GameDescription summary={summary} />);

      // Should display trimmed version
      expect(
        screen.getByText("A game with trailing spaces")
      ).toBeInTheDocument();
    });

    it("should handle very long summaries without truncation", () => {
      const longSummary =
        "This is a very long game description that goes on and on with lots of detail about the gameplay, story, characters, and world. ".repeat(
          5
        );
      render(<GameDescription summary={longSummary} />);

      expect(screen.getByText(longSummary.trim())).toBeInTheDocument();
    });

    it("should preserve internal line breaks and formatting", () => {
      const summaryWithLineBreaks =
        "First paragraph.\n\nSecond paragraph with more details.";
      const { container } = render(
        <GameDescription summary={summaryWithLineBreaks} />
      );

      // Verify that the text content includes the line breaks
      const paragraph = container.querySelector("p");
      expect(paragraph?.textContent).toBe(summaryWithLineBreaks);
    });
  });
});
