import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameReleaseDate } from "./game-release-date";

describe("GameReleaseDate", () => {
  describe("when release date is provided", () => {
    it("should display formatted release date in 'MMM dd, yyyy' format", () => {
      // January 15, 2023 00:00:00 UTC
      const timestamp = 1673740800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Jan 15, 2023"
      );
    });

    it("should correctly format dates from different months", () => {
      // December 25, 2024 00:00:00 UTC
      const timestamp = 1735084800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Dec 25, 2024"
      );
    });

    it("should correctly format dates from different years", () => {
      // March 3, 2017 00:00:00 UTC (Nintendo Switch release date example)
      const timestamp = 1488499200;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Mar 3, 2017"
      );
    });

    it("should handle very old release dates", () => {
      // January 1, 1985 00:00:00 UTC (NES era example)
      const timestamp = 473385600;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Jan 1, 1985"
      );
    });

    it("should have proper text styling", () => {
      const timestamp = 1673740800;
      const { container } = render(
        <GameReleaseDate firstReleaseDate={timestamp} />
      );

      const paragraph = container.querySelector("p");
      expect(paragraph).toHaveClass("text-sm");
      expect(paragraph).toHaveClass("text-muted-foreground");
    });
  });

  describe("when release date is missing", () => {
    it("should display 'N/A' placeholder when firstReleaseDate is undefined", () => {
      render(<GameReleaseDate firstReleaseDate={undefined} />);

      expect(screen.getByText("Release Date: N/A")).toBeInTheDocument();
    });

    it("should display 'N/A' placeholder when firstReleaseDate is null", () => {
      render(<GameReleaseDate firstReleaseDate={null} />);

      expect(screen.getByText("Release Date: N/A")).toBeInTheDocument();
    });

    it("should display 'N/A' placeholder when firstReleaseDate is 0", () => {
      render(<GameReleaseDate firstReleaseDate={0} />);

      expect(screen.getByText("Release Date: N/A")).toBeInTheDocument();
    });

    it("should have proper text styling for placeholder", () => {
      const { container } = render(<GameReleaseDate firstReleaseDate={null} />);

      const paragraph = container.querySelector("p");
      expect(paragraph).toHaveClass("text-sm");
      expect(paragraph).toHaveClass("text-muted-foreground");
    });
  });

  describe("edge cases", () => {
    it("should handle future release dates", () => {
      // January 1, 2030 00:00:00 UTC
      const timestamp = 1893456000;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Jan 1, 2030"
      );
    });

    it("should handle leap year dates", () => {
      // February 29, 2024 00:00:00 UTC
      const timestamp = 1709164800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Feb 29, 2024"
      );
    });

    it("should handle dates at year boundaries", () => {
      // December 31, 2023 12:00:00 UTC (midday to avoid timezone edge cases)
      const timestamp = 1704024000;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Dec 31, 2023"
      );
    });
  });
});
