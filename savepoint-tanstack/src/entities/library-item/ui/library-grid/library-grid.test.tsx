import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LibraryGrid } from "./library-grid";

const elements = {
  queryGridRoot: () => screen.queryByTestId("library-grid-root"),
  getGridRoot: () => screen.getByTestId("library-grid-root"),
  getAllGridItems: () => screen.getAllByTestId("library-grid-item"),
  getCoverImage: (title: string) => screen.getByAltText(title),
  queryCoverImage: (title: string) => screen.queryByAltText(title),
};

describe("LibraryGrid", () => {
  describe("given an empty games array", () => {
    beforeEach(() => {
      render(<LibraryGrid games={[]} />);
    });

    it("renders nothing (null) when games is empty", () => {
      expect(elements.queryGridRoot()).toBeNull();
    });
  });

  describe("given games with cover images", () => {
    const games = [
      {
        gameId: "game-1",
        title: "Zelda",
        coverImage: "https://example.com/zelda.jpg",
      },
      {
        gameId: "game-2",
        title: "Mario",
        coverImage: "https://example.com/mario.jpg",
      },
    ];

    beforeEach(() => {
      render(<LibraryGrid games={games} />);
    });

    it("renders the grid container", () => {
      expect(elements.getGridRoot()).toBeDefined();
    });

    it("renders a grid item for each game", () => {
      expect(elements.getAllGridItems()).toHaveLength(2);
    });

    it("renders a cover image for games with coverImage", () => {
      expect(elements.getCoverImage("Zelda")).toBeDefined();
      expect(elements.getCoverImage("Mario")).toBeDefined();
    });

    it("renders the game title text", () => {
      expect(screen.getByText("Zelda")).toBeDefined();
      expect(screen.getByText("Mario")).toBeDefined();
    });
  });

  describe("given a game with no cover image", () => {
    const games = [
      {
        gameId: "game-3",
        title: "Hades",
        coverImage: null,
      },
    ];

    beforeEach(() => {
      render(<LibraryGrid games={games} />);
    });

    it("does not render an img element for the game without cover", () => {
      expect(elements.queryCoverImage("Hades")).toBeNull();
    });

    it("still renders the game title", () => {
      expect(screen.getByText("Hades")).toBeDefined();
    });
  });
});
