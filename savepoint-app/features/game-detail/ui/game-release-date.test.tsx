import { render, screen } from "@testing-library/react";

import { GameReleaseDate } from "./game-release-date";

describe("GameReleaseDate", () => {
  describe("when release date is provided", () => {
    it("should display formatted release date in 'MMM dd, yyyy' format", () => {
      const timestamp = 1673740800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Jan 15, 2023"
      );
    });

    it("should correctly format dates from different months", () => {
      const timestamp = 1735084800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Dec 25, 2024"
      );
    });

    it("should correctly format dates from different years", () => {
      const timestamp = 1488499200;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Mar 3, 2017"
      );
    });

    it("should handle very old release dates", () => {
      const timestamp = 473385600;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Jan 1, 1985"
      );
    });

    it("should have proper text styling", () => {
      const timestamp = 1673740800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      const paragraph = screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "p" &&
          content.includes("Release Date:")
        );
      });
      expect(paragraph).toHaveClass("text-sm");
      expect(paragraph).toHaveClass("text-muted-foreground");
    });
  });

  describe("when release date is missing", () => {
    it("should display 'N/A' placeholder when firstReleaseDate is undefined", () => {
      render(<GameReleaseDate firstReleaseDate={undefined} />);

      expect(screen.getByText("Release Date: N/A")).toBeVisible();
    });

    it("should display 'N/A' placeholder when firstReleaseDate is null", () => {
      render(<GameReleaseDate firstReleaseDate={null} />);

      expect(screen.getByText("Release Date: N/A")).toBeVisible();
    });

    it("should display 'N/A' placeholder when firstReleaseDate is 0", () => {
      render(<GameReleaseDate firstReleaseDate={0} />);

      expect(screen.getByText("Release Date: N/A")).toBeVisible();
    });

    it("should have proper text styling for placeholder", () => {
      render(<GameReleaseDate firstReleaseDate={null} />);

      const paragraph = screen.getByText((content, element) => {
        return (
          element?.tagName.toLowerCase() === "p" &&
          content === "Release Date: N/A"
        );
      });
      expect(paragraph).toHaveClass("text-sm");
      expect(paragraph).toHaveClass("text-muted-foreground");
    });
  });

  describe("edge cases", () => {
    it("should handle future release dates", () => {
      const timestamp = 1893456000;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Jan 1, 2030"
      );
    });

    it("should handle leap year dates", () => {
      const timestamp = 1709164800;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Feb 29, 2024"
      );
    });

    it("should handle dates at year boundaries", () => {
      const timestamp = 1704024000;
      render(<GameReleaseDate firstReleaseDate={timestamp} />);

      expect(screen.getByText(/Release Date:/)).toHaveTextContent(
        "Release Date: Dec 31, 2023"
      );
    });
  });
});
