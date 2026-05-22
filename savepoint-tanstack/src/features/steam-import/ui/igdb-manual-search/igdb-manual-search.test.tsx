import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchGamesFn } from "@/entities/game";

import { IgdbManualSearch } from "./igdb-manual-search";

vi.mock("@/entities/game", () => ({
  searchGamesFn: vi.fn(),
}));

const elements = {
  getInput: () => screen.getByRole("textbox", { name: "IGDB search query" }),
  queryResultList: () =>
    screen.queryByRole("list", { name: "IGDB search results" }),
  queryNoResults: () => screen.queryByText("No games found"),
  querySearching: () => screen.queryByText("Searching…"),
};

const actions = {
  typeQuery: (text: string) => userEvent.type(elements.getInput(), text),
  pickResult: (name: string) =>
    userEvent.click(screen.getByRole("button", { name: `Select ${name}` })),
};

const sampleGames = [
  {
    id: 100,
    name: "Half-Life 2",
    slug: "half-life-2",
    first_release_date: 1099267200,
    platforms: [{ id: 6, name: "PC", abbreviation: "PC" }],
  },
  {
    id: 101,
    name: "Half-Life: Alyx",
    slug: "half-life-alyx",
    first_release_date: 1584921600,
    platforms: [{ id: 6, name: "PC", abbreviation: "PC" }],
  },
];

describe(IgdbManualSearch, () => {
  beforeEach(() => {
    vi.mocked(searchGamesFn).mockReset();
  });

  describe("given the user types fewer than 3 characters", () => {
    let onSelect: (igdbId: number) => void;
    beforeEach(async () => {
      onSelect = vi.fn() as unknown as (igdbId: number) => void;
      render(<IgdbManualSearch onSelect={onSelect} />);
      await actions.typeQuery("hl");
      // Wait beyond the 300ms debounce.
      await new Promise((r) => setTimeout(r, 350));
    });

    it("does not call the search server fn", () => {
      expect(vi.mocked(searchGamesFn)).not.toHaveBeenCalled();
    });
  });

  describe("given the search server fn returns matches", () => {
    let onSelect: (igdbId: number) => void;
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue({
        games: sampleGames,
        count: sampleGames.length,
      } as never);
      onSelect = vi.fn() as unknown as (igdbId: number) => void;
      render(<IgdbManualSearch onSelect={onSelect} />);
      await actions.typeQuery("half");
      await waitFor(() => {
        expect(elements.queryResultList()).not.toBeNull();
      });
    });

    it("renders one result row per match", () => {
      expect(screen.getByText("Half-Life 2")).toBeDefined();
      expect(screen.getByText("Half-Life: Alyx")).toBeDefined();
    });

    it("invokes onSelect with the picked igdb id", async () => {
      await actions.pickResult("Half-Life 2");
      expect(onSelect).toHaveBeenCalledWith(100);
    });
  });

  describe("given the search server fn returns no matches", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue({
        games: [],
        count: 0,
      } as never);
      render(<IgdbManualSearch onSelect={vi.fn()} />);
      await actions.typeQuery("zzznomatchzzz");
      await waitFor(() => {
        expect(elements.queryNoResults()).not.toBeNull();
      });
    });

    it("renders an explicit 'no games found' message", () => {
      expect(elements.queryNoResults()).not.toBeNull();
    });
  });

  describe("given the search server fn throws", () => {
    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockRejectedValue(new Error("boom"));
      render(<IgdbManualSearch onSelect={vi.fn()} />);
      await actions.typeQuery("anything");
      await waitFor(() => {
        expect(
          screen.queryByText("Failed to search games. Please try again.")
        ).not.toBeNull();
      });
    });

    it("surfaces a user-friendly error", () => {
      expect(
        screen.getByText("Failed to search games. Please try again.")
      ).toBeDefined();
    });
  });
});
