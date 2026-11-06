import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GameCover } from "./game-cover";

const elements = {
  queryImg: (name: string) => screen.queryByAltText(name),
  getPlaceholder: (name: string) => screen.getByRole("img", { name }),
  getNamedImage: (name: string) => screen.getByRole("img", { name }),
  getVisibleName: (name: string) => screen.getByText(name),
};

const LONG_NAME =
  "The Legend of Zelda: Breath of the Wild - Nintendo Switch Special Limited Collector's Edition with Expansion Pass";

describe("GameCover", () => {
  describe("given an IGDB image id", () => {
    beforeEach(() => {
      render(<GameCover src="co9wzc" name="Hollow Knight" />);
    });

    it("renders an <img> named after the game", () => {
      expect(elements.queryImg("Hollow Knight")).not.toBeNull();
    });

    it("exposes the game name as the image's accessible name", () => {
      expect(elements.getNamedImage("Hollow Knight")).toBeInTheDocument();
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
      expect(elements.getVisibleName("Hollow Knight")).toBeInTheDocument();
    });
  });

  describe("given src is undefined", () => {
    beforeEach(() => {
      render(<GameCover src={undefined} name="Celeste" />);
    });

    it("does not render an <img>", () => {
      expect(elements.queryImg("Celeste")).toBeNull();
    });

    it("renders a placeholder named after the game", () => {
      expect(elements.getPlaceholder("Celeste")).toBeInTheDocument();
    });

    it("shows the game name as visible text", () => {
      expect(elements.getVisibleName("Celeste")).toBeInTheDocument();
    });
  });

  describe("given src is an empty string", () => {
    beforeEach(() => {
      render(<GameCover src="" name="Celeste" />);
    });

    it("does not render an <img>", () => {
      expect(elements.queryImg("Celeste")).toBeNull();
    });

    it("renders a placeholder named after the game", () => {
      expect(elements.getPlaceholder("Celeste")).toBeInTheDocument();
    });

    it("shows the game name as visible text", () => {
      expect(elements.getVisibleName("Celeste")).toBeInTheDocument();
    });
  });

  describe("given a name too long for the cover", () => {
    beforeEach(() => {
      render(<GameCover src={null} name={LONG_NAME} />);
    });

    it("keeps the full name as the accessible name", () => {
      expect(elements.getPlaceholder(LONG_NAME)).toBeInTheDocument();
    });

    // jsdom has no layout: this pins the clamp contract only. The real
    // three-line rendering is verified by the Slice 18 browser Verify task.
    it("clamps the visible name to three lines", () => {
      expect(elements.getVisibleName(LONG_NAME)).toHaveClass("line-clamp-3");
    });
  });

  describe("given the image fails to load", () => {
    beforeEach(() => {
      render(<GameCover src="co9wzc" name="Hollow Knight" />);
      fireEvent.error(elements.queryImg("Hollow Knight")!);
    });

    it("removes the <img>", () => {
      expect(elements.queryImg("Hollow Knight")).toBeNull();
    });

    it("falls back to a placeholder named after the game", () => {
      expect(elements.getPlaceholder("Hollow Knight")).toBeInTheDocument();
    });

    it("shows the game name as visible text", () => {
      expect(elements.getVisibleName("Hollow Knight")).toBeInTheDocument();
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
