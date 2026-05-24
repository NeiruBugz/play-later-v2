import { beforeEach, describe, expect, it, vi } from "vitest";

import { searchLibraryAwareGamesWorker } from "./search-library-aware-games.worker";

const searchGames = vi.fn();
const getLibraryItemsByIgdbIds = vi.fn();

vi.mock("@/shared/api/igdb", () => ({
  searchGames: (...args: unknown[]) => searchGames(...args),
}));

vi.mock(
  "@/entities/library-item/api/get-library-items-by-igdb-ids.server",
  () => ({
    getLibraryItemsByIgdbIds: (...args: unknown[]) =>
      getLibraryItemsByIgdbIds(...args),
  })
);

const igdbGame = (id: number, name: string) => ({
  id,
  name,
  slug: name.toLowerCase().replace(/\s+/g, "-"),
  cover: null,
  first_release_date: null,
  platforms: [],
});

describe("searchLibraryAwareGamesWorker", () => {
  beforeEach(() => {
    searchGames.mockReset();
    getLibraryItemsByIgdbIds.mockReset();
  });

  describe("given an authed viewer who owns some of the results", () => {
    beforeEach(() => {
      searchGames.mockResolvedValue({
        games: [igdbGame(1, "Hades"), igdbGame(2, "Sword of Hades")],
        count: 2,
      });
      getLibraryItemsByIgdbIds.mockResolvedValue(
        new Map([[1, { status: "PLAYED", rating: 9 }]])
      );
    });

    it("annotates owned results with their library state and others with null", async () => {
      const result = await searchLibraryAwareGamesWorker("viewer-1", {
        name: "hades",
      });

      expect(result.games[0]?.library).toEqual({ status: "PLAYED", rating: 9 });
      expect(result.games[1]?.library).toBeNull();
    });

    it("reports how many results are already in the library", async () => {
      const result = await searchLibraryAwareGamesWorker("viewer-1", {
        name: "hades",
      });
      expect(result.ownedCount).toBe(1);
    });
  });

  describe("given an anonymous viewer", () => {
    beforeEach(() => {
      searchGames.mockResolvedValue({
        games: [igdbGame(1, "Hades")],
        count: 1,
      });
    });

    it("returns every result unowned without touching the library", async () => {
      const result = await searchLibraryAwareGamesWorker(undefined, {
        name: "hades",
      });

      expect(result.games[0]?.library).toBeNull();
      expect(result.ownedCount).toBe(0);
      expect(getLibraryItemsByIgdbIds).not.toHaveBeenCalled();
    });
  });
});
