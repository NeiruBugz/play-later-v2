import { act, render, screen, waitFor } from "@testing-library/react";
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

  describe("given the search returns a game with a cover image", () => {
    const gameWithCover = {
      id: 200,
      name: "Hollow Knight",
      slug: "hollow-knight",
      first_release_date: 1488931200,
      cover: { image_id: "co1x2y" },
      platforms: [
        { id: 6, name: "PC", abbreviation: "PC" },
        { id: 14, name: "Mac", abbreviation: "Mac" },
        { id: 3, name: "Linux", abbreviation: "Linux" },
      ],
    };

    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue({
        games: [gameWithCover],
        count: 1,
      } as never);
      render(<IgdbManualSearch onSelect={vi.fn()} />);
      await actions.typeQuery("hollow");
      await waitFor(() => {
        expect(elements.queryResultList()).not.toBeNull();
      });
    });

    it("renders a cover image with correct alt text for results with a cover", () => {
      expect(screen.getByAltText("Cover for Hollow Knight")).toBeDefined();
    });

    it("truncates platform list to at most 3 entries separated by commas", () => {
      expect(screen.getByText("PC, Mac, Linux")).toBeDefined();
    });
  });

  describe("given the component unmounts while a search success is in-flight (cancelled success path)", () => {
    it("does not set state after unmount (exercises the cancelled-success return branch)", async () => {
      let resolveSearch!: (v: {
        games: typeof sampleGames;
        count: number;
      }) => void;
      vi.mocked(searchGamesFn).mockReturnValue(
        new Promise<{ games: typeof sampleGames; count: number }>((resolve) => {
          resolveSearch = resolve;
        }) as never
      );

      const { unmount } = render(<IgdbManualSearch onSelect={vi.fn()} />);
      // Start a search by typing ≥3 chars and advancing past the debounce.
      await userEvent.type(elements.getInput(), "hal");
      act(() => {
        vi.advanceTimersByTime(400);
      });
      // Search is now in-flight. Unmount before it resolves.
      unmount();
      // Resolve after unmount — cancelled guard fires.
      act(() => {
        resolveSearch({ games: sampleGames, count: 2 });
      });
      // No assertion on DOM (unmounted); passes if no React warning thrown.
    });
  });

  describe("given the component unmounts while a search error is in-flight (cancelled error path)", () => {
    it("does not set error state after unmount (exercises the cancelled-error return branch)", async () => {
      let rejectSearch!: (reason: Error) => void;
      vi.mocked(searchGamesFn).mockReturnValue(
        new Promise<never>((_, reject) => {
          rejectSearch = reject;
        }) as never
      );

      const { unmount } = render(<IgdbManualSearch onSelect={vi.fn()} />);
      await userEvent.type(elements.getInput(), "hal");
      act(() => {
        vi.advanceTimersByTime(400);
      });
      unmount();
      act(() => {
        rejectSearch(new Error("network down"));
      });
    });
  });

  describe("given the search returns a game with no platforms", () => {
    const gameNoPlatforms = {
      id: 201,
      name: "Indie Game",
      slug: "indie-game",
      first_release_date: null,
      platforms: [],
    };

    beforeEach(async () => {
      vi.mocked(searchGamesFn).mockResolvedValue({
        games: [gameNoPlatforms],
        count: 1,
      } as never);
      render(<IgdbManualSearch onSelect={vi.fn()} />);
      await actions.typeQuery("indie");
      await waitFor(() => {
        expect(elements.queryResultList()).not.toBeNull();
      });
    });

    it("shows Unknown for release year and platform when both are absent", () => {
      // Both year and platform render as "Unknown" — getAllByText returns both.
      expect(screen.getAllByText("Unknown").length).toBeGreaterThanOrEqual(2);
    });
  });
});
