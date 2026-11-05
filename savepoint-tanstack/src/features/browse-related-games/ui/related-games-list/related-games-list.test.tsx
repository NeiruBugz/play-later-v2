import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { RelatedGame } from "../../api";
import { RelatedGamesList } from "./related-games-list";

function makeGames(count: number): RelatedGame[] {
  return Array.from({ length: count }, (_, index) => ({
    igdbId: index + 1,
    slug: `game-${index + 1}`,
    title: `Game ${index + 1}`,
    coverImageId: null,
  }));
}

const renderGame = (game: RelatedGame) => <span>{game.title}</span>;

const elements = {
  getGameTitles: () =>
    within(screen.getByRole("list"))
      .getAllByRole("listitem")
      .map((item) => item.textContent),
  queryToggle: () => screen.queryByRole("button"),
  getShowAll: (total: number) =>
    screen.getByRole("button", { name: `Show all (${total})` }),
  getShowFewer: () => screen.getByRole("button", { name: "Show fewer" }),
};

const actions = {
  clickToggle: () => userEvent.click(elements.queryToggle()!),
};

describe("RelatedGamesList", () => {
  describe("given more games than fit in the first page", () => {
    let fetchSpy: ReturnType<typeof vi.fn>;

    beforeEach(() => {
      fetchSpy = vi.fn();
      vi.stubGlobal("fetch", fetchSpy);
      render(
        <RelatedGamesList games={makeGames(14)} renderGame={renderGame} />
      );
    });

    it("shows only the first six games", () => {
      expect(elements.getGameTitles()).toEqual([
        "Game 1",
        "Game 2",
        "Game 3",
        "Game 4",
        "Game 5",
        "Game 6",
      ]);
    });

    it("offers to show all with the total count", () => {
      expect(elements.getShowAll(14)).toBeDefined();
    });

    describe("when the user chooses to show all", () => {
      beforeEach(async () => {
        await actions.clickToggle();
      });

      it("shows every game", () => {
        expect(elements.getGameTitles()).toHaveLength(14);
      });

      it("offers to show fewer", () => {
        expect(elements.getShowFewer()).toBeDefined();
      });

      it("makes no network request", () => {
        expect(fetchSpy).not.toHaveBeenCalled();
      });

      describe("and then chooses to show fewer", () => {
        beforeEach(async () => {
          await actions.clickToggle();
        });

        it("returns to the first six games", () => {
          expect(elements.getGameTitles()).toHaveLength(6);
          expect(elements.getShowAll(14)).toBeDefined();
        });
      });
    });
  });

  describe("given exactly six games", () => {
    beforeEach(() => {
      render(<RelatedGamesList games={makeGames(6)} renderGame={renderGame} />);
    });

    it("shows them all without a toggle", () => {
      expect(elements.getGameTitles()).toHaveLength(6);
      expect(elements.queryToggle()).toBeNull();
    });
  });

  describe("given no games", () => {
    beforeEach(() => {
      render(<RelatedGamesList games={[]} renderGame={renderGame} />);
    });

    it("shows no toggle", () => {
      expect(elements.queryToggle()).toBeNull();
    });
  });
});
