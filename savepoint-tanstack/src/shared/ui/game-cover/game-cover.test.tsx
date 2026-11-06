import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GameCover } from "./game-cover";

const elements = {
  queryImg: (name: string) => screen.queryByAltText(name),
  getPlaceholder: (name: string) => screen.getByRole("img", { name }),
};

describe("GameCover", () => {
  describe("given an IGDB image id", () => {
    beforeEach(() => {
      render(<GameCover src="co9wzc" name="Hollow Knight" />);
    });

    it("renders an <img> named after the game", () => {
      expect(elements.queryImg("Hollow Knight")).not.toBeNull();
    });

    it("builds the IGDB URL through the shared helper", () => {
      expect(elements.queryImg("Hollow Knight")?.getAttribute("src")).toBe(
        "https://images.igdb.com/igdb/image/upload/t_cover_big/co9wzc.jpg"
      );
    });
  });

  describe("given a size", () => {
    it("serves the small IGDB size for xs", () => {
      render(<GameCover src="co9wzc" name="Hollow Knight" size="xs" />);
      expect(elements.queryImg("Hollow Knight")?.getAttribute("src")).toContain(
        "t_cover_small"
      );
    });

    it("serves the 2x IGDB size for lg", () => {
      render(<GameCover src="co9wzc" name="Hollow Knight" size="lg" />);
      expect(elements.queryImg("Hollow Knight")?.getAttribute("src")).toContain(
        "t_cover_big_2x"
      );
    });
  });

  describe("given the cover is below the fold (default)", () => {
    it("loads lazily", () => {
      render(<GameCover src="c1" name="Below" />);
      expect(elements.queryImg("Below")).toHaveAttribute("loading", "lazy");
    });
  });

  describe("given priority", () => {
    beforeEach(() => {
      render(<GameCover src="c1" name="Hero" priority />);
    });

    it("loads immediately", () => {
      expect(elements.queryImg("Hero")).toHaveAttribute("loading", "eager");
    });

    it("asks the browser to fetch it first", () => {
      expect(elements.queryImg("Hero")).toHaveAttribute(
        "fetchpriority",
        "high"
      );
    });
  });

  describe("given src is null", () => {
    beforeEach(() => {
      render(<GameCover src={null} name="Hollow Knight" />);
    });

    it("does not render an <img>", () => {
      expect(elements.queryImg("Hollow Knight")).toBeNull();
    });

    it("renders a placeholder named after the game", () => {
      expect(elements.getPlaceholder("Hollow Knight")).toBeDefined();
    });

    it("shows the game name on the placeholder", () => {
      expect(screen.getByText("Hollow Knight")).toBeDefined();
    });
  });

  describe("given the image fails to load", () => {
    it("falls back to the placeholder", () => {
      render(<GameCover src="co9wzc" name="Hollow Knight" />);
      fireEvent.error(elements.queryImg("Hollow Knight")!);
      expect(elements.queryImg("Hollow Knight")).toBeNull();
      expect(elements.getPlaceholder("Hollow Knight")).toBeDefined();
    });
  });

  describe("given overlay children", () => {
    it("renders them inside the cover", () => {
      render(
        <GameCover src="co9wzc" name="Hollow Knight">
          <span>Badge</span>
        </GameCover>
      );
      expect(screen.getByText("Badge")).toBeDefined();
    });
  });
});
