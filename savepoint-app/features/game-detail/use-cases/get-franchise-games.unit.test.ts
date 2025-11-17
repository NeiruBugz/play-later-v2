import { IgdbService } from "@/data-access-layer/services";

import { FRANCHISE_GAMES_INITIAL_LIMIT } from "@/shared/constants";
import { createFranchiseGamesFixture } from "@/test/fixtures";

import { getFranchiseGames } from "./get-franchise-games";

vi.mock("@/data-access-layer/services", () => ({
  IgdbService: vi.fn(),
}));

describe("getFranchiseGames", () => {
  let mockIgdbService: {
    getFranchiseDetails: ReturnType<typeof vi.fn>;
    getFranchiseGames: ReturnType<typeof vi.fn>;
  };

  const mockFranchiseGames = createFranchiseGamesFixture();

  beforeEach(() => {
    vi.clearAllMocks();

    mockIgdbService = {
      getFranchiseDetails: vi.fn(),
      getFranchiseGames: vi.fn(),
    };

    vi.mocked(IgdbService).mockImplementation(
      () => mockIgdbService as unknown as IgdbService
    );
  });

  describe("success scenarios", () => {
    it("should return franchise games when franchise IDs are provided", async () => {
      mockIgdbService.getFranchiseDetails.mockResolvedValue({
        success: true,
        data: {
          franchise: { id: 169, name: "The Legend of Zelda" },
        },
      });

      mockIgdbService.getFranchiseGames.mockResolvedValue({
        success: true,
        data: {
          games: mockFranchiseGames,
          pagination: {
            total: 25,
            offset: 0,
            limit: FRANCHISE_GAMES_INITIAL_LIMIT,
            hasMore: true,
          },
        },
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0]).toEqual({
          franchiseId: 169,
          franchiseName: "The Legend of Zelda",
          games: mockFranchiseGames,
          hasMore: true,
          totalCount: 25,
        });
      }

      expect(mockIgdbService.getFranchiseDetails).toHaveBeenCalledWith({
        franchiseId: 169,
      });
      expect(mockIgdbService.getFranchiseGames).toHaveBeenCalledWith({
        franchiseId: 169,
        currentGameId: 12345,
        limit: FRANCHISE_GAMES_INITIAL_LIMIT,
        offset: 0,
      });
    });

    it("should handle multiple franchise IDs", async () => {
      mockIgdbService.getFranchiseDetails
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 169, name: "The Legend of Zelda" },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 234, name: "Super Mario" },
          },
        });

      mockIgdbService.getFranchiseGames
        .mockResolvedValueOnce({
          success: true,
          data: {
            games: mockFranchiseGames,
            pagination: {
              total: 2,
              offset: 0,
              limit: FRANCHISE_GAMES_INITIAL_LIMIT,
              hasMore: false,
            },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            games: [
              {
                id: 1074,
                name: "Super Mario Odyssey",
                slug: "super-mario-odyssey",
                cover: { image_id: "co1wyb" },
              },
            ],
            pagination: {
              total: 1,
              offset: 0,
              limit: FRANCHISE_GAMES_INITIAL_LIMIT,
              hasMore: false,
            },
          },
        });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169, 234],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(2);
        expect(result.data[0].franchiseId).toBe(169);
        expect(result.data[0].franchiseName).toBe("The Legend of Zelda");
        expect(result.data[1].franchiseId).toBe(234);
        expect(result.data[1].franchiseName).toBe("Super Mario");
      }
    });

    it("should return empty array when no franchise IDs are provided", async () => {
      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }

      expect(mockIgdbService.getFranchiseDetails).not.toHaveBeenCalled();
      expect(mockIgdbService.getFranchiseGames).not.toHaveBeenCalled();
    });

    it("should skip franchise when details fetch fails", async () => {
      mockIgdbService.getFranchiseDetails
        .mockResolvedValueOnce({
          success: false,
          error: "Franchise not found",
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 234, name: "Super Mario" },
          },
        });

      mockIgdbService.getFranchiseGames.mockResolvedValue({
        success: true,
        data: {
          games: mockFranchiseGames,
          pagination: {
            total: 2,
            offset: 0,
            limit: FRANCHISE_GAMES_INITIAL_LIMIT,
            hasMore: false,
          },
        },
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169, 234],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].franchiseId).toBe(234);
      }
    });

    it("should skip franchise when games fetch fails", async () => {
      mockIgdbService.getFranchiseDetails
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 169, name: "The Legend of Zelda" },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 234, name: "Super Mario" },
          },
        });

      mockIgdbService.getFranchiseGames
        .mockResolvedValueOnce({
          success: false,
          error: "Failed to fetch games",
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            games: mockFranchiseGames,
            pagination: {
              total: 2,
              offset: 0,
              limit: FRANCHISE_GAMES_INITIAL_LIMIT,
              hasMore: false,
            },
          },
        });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169, 234],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].franchiseId).toBe(234);
      }
    });

    it("should skip franchise when games array is empty", async () => {
      mockIgdbService.getFranchiseDetails.mockResolvedValue({
        success: true,
        data: {
          franchise: { id: 169, name: "The Legend of Zelda" },
        },
      });

      mockIgdbService.getFranchiseGames.mockResolvedValue({
        success: true,
        data: {
          games: [],
          pagination: {
            total: 0,
            offset: 0,
            limit: FRANCHISE_GAMES_INITIAL_LIMIT,
            hasMore: false,
          },
        },
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should include pagination data in result", async () => {
      mockIgdbService.getFranchiseDetails.mockResolvedValue({
        success: true,
        data: {
          franchise: { id: 169, name: "The Legend of Zelda" },
        },
      });

      mockIgdbService.getFranchiseGames.mockResolvedValue({
        success: true,
        data: {
          games: mockFranchiseGames,
          pagination: {
            total: 50,
            offset: 0,
            limit: FRANCHISE_GAMES_INITIAL_LIMIT,
            hasMore: true,
          },
        },
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].hasMore).toBe(true);
        expect(result.data[0].totalCount).toBe(50);
      }
    });

    it("should handle games without cover images", async () => {
      const gamesWithoutCovers = [
        {
          id: 1942,
          name: "Game Without Cover",
          slug: "game-without-cover",
        },
      ];

      mockIgdbService.getFranchiseDetails.mockResolvedValue({
        success: true,
        data: {
          franchise: { id: 169, name: "The Legend of Zelda" },
        },
      });

      mockIgdbService.getFranchiseGames.mockResolvedValue({
        success: true,
        data: {
          games: gamesWithoutCovers,
          pagination: {
            total: 1,
            offset: 0,
            limit: FRANCHISE_GAMES_INITIAL_LIMIT,
            hasMore: false,
          },
        },
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data[0].games).toEqual(gamesWithoutCovers);
      }
    });
  });

  describe("error scenarios", () => {
    it("should return error when unexpected exception occurs", async () => {
      mockIgdbService.getFranchiseDetails.mockRejectedValue(
        new Error("Network timeout")
      );

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Network timeout");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockIgdbService.getFranchiseDetails.mockRejectedValue(
        "String error message"
      );

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unknown error");
      }
    });

    it("should return empty array when all franchises fail to load", async () => {
      mockIgdbService.getFranchiseDetails.mockResolvedValue({
        success: false,
        error: "Franchise not found",
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169, 234],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should return empty array when all game fetches fail", async () => {
      mockIgdbService.getFranchiseDetails.mockResolvedValue({
        success: true,
        data: {
          franchise: { id: 169, name: "The Legend of Zelda" },
        },
      });

      mockIgdbService.getFranchiseGames.mockResolvedValue({
        success: false,
        error: "Failed to fetch games",
      });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual([]);
      }
    });

    it("should handle partial failures gracefully", async () => {
      mockIgdbService.getFranchiseDetails
        .mockResolvedValueOnce({
          success: false,
          error: "Not found",
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 234, name: "Super Mario" },
          },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            franchise: { id: 456, name: "Metroid" },
          },
        });

      mockIgdbService.getFranchiseGames
        .mockResolvedValueOnce({
          success: false,
          error: "API error",
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            games: mockFranchiseGames,
            pagination: {
              total: 2,
              offset: 0,
              limit: FRANCHISE_GAMES_INITIAL_LIMIT,
              hasMore: false,
            },
          },
        })
        .mockResolvedValueOnce({
          success: false,
          error: "API error",
        });

      const result = await getFranchiseGames({
        igdbId: 12345,
        franchiseIds: [169, 234, 456],
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].franchiseId).toBe(234);
      }
    });
  });
});
