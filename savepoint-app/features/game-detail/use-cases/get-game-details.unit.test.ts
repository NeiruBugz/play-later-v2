import {
  GameDetailService,
  IgdbService,
  JournalService,
  LibraryService,
} from "@/data-access-layer/services";
import {
  createFullGameFixture,
  createJournalEntryFixture,
  createSimpleLibraryItemFixture,
} from "@/test/fixtures";

import { getGameDetails } from "./get-game-details";

vi.mock("next/cache", () => ({
  cacheLife: vi.fn(),
  cacheTag: vi.fn(),
}));

vi.mock("@/data-access-layer/services", () => ({
  GameDetailService: vi.fn(),
  IgdbService: vi.fn(),
  LibraryService: vi.fn(),
  JournalService: vi.fn(),
}));

describe("getGameDetails", () => {
  let mockGameDetailService: {
    populateGameInDatabase: ReturnType<typeof vi.fn>;
  };
  let mockIgdbService: {
    getGameDetailsBySlug: ReturnType<typeof vi.fn>;
    getTimesToBeat: ReturnType<typeof vi.fn>;
  };
  let mockLibraryService: {
    findGameByIgdbId: ReturnType<typeof vi.fn>;
    findMostRecentLibraryItemByGameId: ReturnType<typeof vi.fn>;
    findAllLibraryItemsByGameId: ReturnType<typeof vi.fn>;
  };
  let mockJournalService: {
    findJournalEntriesByGameId: ReturnType<typeof vi.fn>;
  };

  const mockGame = createFullGameFixture();
  const mockLibraryItem = createSimpleLibraryItemFixture();
  const mockJournalEntry = createJournalEntryFixture();

  beforeEach(() => {
    vi.resetAllMocks();

    mockGameDetailService = {
      populateGameInDatabase: vi.fn(),
    };

    mockIgdbService = {
      getGameDetailsBySlug: vi.fn(),
      getTimesToBeat: vi.fn(),
    };

    mockLibraryService = {
      findGameByIgdbId: vi.fn(),
      findMostRecentLibraryItemByGameId: vi.fn(),
      findAllLibraryItemsByGameId: vi.fn(),
    };

    mockJournalService = {
      findJournalEntriesByGameId: vi.fn(),
    };

    vi.mocked(GameDetailService).mockImplementation(function () {
      return mockGameDetailService as unknown as GameDetailService;
    });
    vi.mocked(IgdbService).mockImplementation(function () {
      return mockIgdbService as unknown as IgdbService;
    });
    vi.mocked(LibraryService).mockImplementation(function () {
      return mockLibraryService as unknown as LibraryService;
    });
    vi.mocked(JournalService).mockImplementation(function () {
      return mockJournalService as unknown as JournalService;
    });
  });

  describe("success scenarios", () => {
    it("should return game details without user data when userId is not provided", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: {
          mainStory: 50,
          completionist: 150,
        },
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockGame);
        expect(result.data.franchiseIds).toEqual([169, 234]);
        expect(result.data.timesToBeat).toEqual({
          mainStory: 50,
          completionist: 150,
        });
        expect(result.data.userLibraryStatus).toBeUndefined();
        expect(result.data.journalEntries).toEqual([]);
      }

      expect(mockIgdbService.getGameDetailsBySlug).toHaveBeenCalledWith({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });
      expect(mockIgdbService.getTimesToBeat).toHaveBeenCalledWith({
        igdbId: 12345,
      });
      expect(mockLibraryService.findGameByIgdbId).not.toHaveBeenCalled();
    });

    it("should return game details with user library status when userId is provided", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        id: "game-456",
        igdbId: 12345,
        slug: mockGame.slug,
      });

      mockLibraryService.findMostRecentLibraryItemByGameId.mockResolvedValue(
        mockLibraryItem
      );

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([
        mockLibraryItem,
      ]);

      mockJournalService.findJournalEntriesByGameId.mockResolvedValue([
        mockJournalEntry,
      ]);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockGame);
        expect(result.data.userLibraryStatus).toEqual({
          mostRecent: mockLibraryItem,
          updatedAt: mockLibraryItem.updatedAt,
          allItems: [mockLibraryItem],
        });
        expect(result.data.journalEntries).toEqual([mockJournalEntry]);
      }

      expect(mockLibraryService.findGameByIgdbId).toHaveBeenCalledWith(12345);
      expect(
        mockLibraryService.findMostRecentLibraryItemByGameId
      ).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
      });
      expect(
        mockLibraryService.findAllLibraryItemsByGameId
      ).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
      });
      expect(
        mockJournalService.findJournalEntriesByGameId
      ).toHaveBeenCalledWith({
        userId: "user-123",
        gameId: "game-456",
        limit: 3,
      });
    });

    it("should handle franchise as object with id property", async () => {
      const gameWithObjectFranchise = {
        ...mockGame,
        franchise: { id: 169, name: "The Legend of Zelda" },
        franchises: [],
      };

      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: gameWithObjectFranchise,
      });

      mockIgdbService.getTimesToBeat.mockRejectedValue(
        new Error("No data available")
      );

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.franchiseIds).toEqual([169]);
        expect(result.data.timesToBeat).toBeUndefined();
      }
    });

    it("should handle multiple franchises and deduplicate", async () => {
      const gameWithDuplicates = {
        ...mockGame,
        franchise: 169,
        franchises: [169, 234, 169],
      };

      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: gameWithDuplicates,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.franchiseIds).toEqual([169, 234]);
      }
    });

    it("should handle game without franchise data", async () => {
      const gameWithoutFranchise = {
        ...mockGame,
        franchise: undefined,
        franchises: [],
      };

      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: gameWithoutFranchise,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.franchiseIds).toEqual([]);
      }
    });

    it("should handle user with no library items or journal entries", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        id: "game-456",
        igdbId: 12345,
        slug: mockGame.slug,
      });

      mockLibraryService.findMostRecentLibraryItemByGameId.mockResolvedValue(
        null
      );

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockJournalService.findJournalEntriesByGameId.mockResolvedValue([]);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userLibraryStatus).toBeUndefined();
        expect(result.data.journalEntries).toEqual([]);
      }
    });

    it("should handle game not in database yet (for authenticated user)", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      mockLibraryService.findGameByIgdbId.mockResolvedValue(null);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.userLibraryStatus).toBeUndefined();
        expect(result.data.journalEntries).toEqual([]);
      }

      expect(
        mockLibraryService.findMostRecentLibraryItemByGameId
      ).not.toHaveBeenCalled();
    });

    it("should continue when populateGameInDatabase fails silently", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockRejectedValue(
        new Error("Database error")
      );

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockGame);
      }
    });

    it("should handle franchise as zero value", async () => {
      const gameWithZeroFranchise = {
        ...mockGame,
        franchise: 0,
        franchises: [],
      };

      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: gameWithZeroFranchise,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.franchiseIds).toEqual([]);
      }
    });
  });

  describe("error scenarios", () => {
    it("should return error when IGDB fetch fails", async () => {
      mockIgdbService.getGameDetailsBySlug.mockRejectedValue(
        new Error("Game not found in IGDB")
      );

      const result = await getGameDetails({
        slug: "nonexistent-game",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found in IGDB");
      }

      expect(mockIgdbService.getTimesToBeat).not.toHaveBeenCalled();
      expect(
        mockGameDetailService.populateGameInDatabase
      ).not.toHaveBeenCalled();
    });

    it("should handle unexpected errors gracefully", async () => {
      mockIgdbService.getGameDetailsBySlug.mockRejectedValue(
        new Error("Network timeout")
      );

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Network timeout");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockIgdbService.getGameDetailsBySlug.mockRejectedValue(
        "String error message"
      );

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch game details");
      }
    });

    it("should handle library service errors gracefully when fetching user data", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        id: "game-456",
        igdbId: 12345,
        slug: mockGame.slug,
      });

      mockLibraryService.findMostRecentLibraryItemByGameId.mockRejectedValue(
        new Error("Database connection lost")
      );

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockJournalService.findJournalEntriesByGameId.mockResolvedValue([]);

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
        userId: "user-123",
      });

      expect(result.success).toBe(false);
    });

    it("should handle journal service errors gracefully", async () => {
      mockIgdbService.getGameDetailsBySlug.mockResolvedValue({
        game: mockGame,
      });

      mockIgdbService.getTimesToBeat.mockResolvedValue({
        timesToBeat: undefined,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        id: "game-456",
        igdbId: 12345,
        slug: mockGame.slug,
      });

      mockLibraryService.findMostRecentLibraryItemByGameId.mockResolvedValue(
        mockLibraryItem
      );

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([
        mockLibraryItem,
      ]);

      mockJournalService.findJournalEntriesByGameId.mockRejectedValue(
        new Error("Failed to fetch journal entries")
      );

      const result = await getGameDetails({
        slug: "the-legend-of-zelda-breath-of-the-wild",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.journalEntries).toEqual([]);
        expect(result.data.userLibraryStatus).toBeDefined();
      }
    });
  });
});
