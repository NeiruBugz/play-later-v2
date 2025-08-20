import { beforeEach, describe, expect, it, vi } from "vitest";

import igdbApi from "@/shared/lib/igdb";

import { IgdbService } from "./igdb-service";

// Mock the IGDB API
vi.mock("@/shared/lib/igdb", () => ({
  default: {
    search: vi.fn(),
    getGameById: vi.fn(),
    getPlatforms: vi.fn(),
  },
}));

describe("IgdbService", () => {
  let service: IgdbService;
  let mockSearch: ReturnType<typeof vi.fn>;
  let mockGetGameById: ReturnType<typeof vi.fn>;
  let mockGetPlatforms: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new IgdbService();
    mockSearch = vi.mocked(igdbApi.search);
    mockGetGameById = vi.mocked(igdbApi.getGameById);
    mockGetPlatforms = vi.mocked(igdbApi.getPlatforms);
  });

  describe("searchGames", () => {
    it("should return error for empty game name", async () => {
      const result = await service.searchGames({ name: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Game name is required for search");
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("should return error for whitespace-only game name", async () => {
      const result = await service.searchGames({ name: "   " });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Game name is required for search");
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("should search games successfully", async () => {
      const mockGames = [
        {
          id: 1,
          name: "Cyberpunk 2077",
          cover: { image_id: "cover1" },
          platforms: [{ name: "PC" }],
          release_dates: [{ human: "2020" }],
          first_release_date: 1607299200,
          category: 0,
        },
        {
          id: 2,
          name: "The Witcher 3",
          cover: { image_id: "cover2" },
          platforms: [{ name: "PC" }, { name: "PlayStation 4" }],
          release_dates: [{ human: "2015" }],
          first_release_date: 1431993600,
          category: 0,
        },
      ];

      mockSearch.mockResolvedValue(mockGames);

      const result = await service.searchGames({
        name: "cyberpunk",
        fields: { platform: "PC" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual(mockGames);
      expect(result.data?.count).toBe(2);
      expect(mockSearch).toHaveBeenCalledWith({
        name: "cyberpunk",
        fields: { platform: "PC" },
      });
    });

    it("should handle API returning null", async () => {
      mockSearch.mockResolvedValue(null);

      const result = await service.searchGames({ name: "test game" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to search games");
    });

    it("should handle API returning undefined", async () => {
      mockSearch.mockResolvedValue(undefined);

      const result = await service.searchGames({ name: "test game" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to search games");
    });

    it("should handle search without fields", async () => {
      const mockGames = [
        {
          id: 1,
          name: "Test Game",
          cover: { image_id: "cover1" },
          platforms: [{ name: "PC" }],
          release_dates: [{ human: "2024" }],
          first_release_date: 1704067200,
          category: 0,
        },
      ];

      mockSearch.mockResolvedValue(mockGames);

      const result = await service.searchGames({ name: "test game" });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual(mockGames);
      expect(mockSearch).toHaveBeenCalledWith({
        name: "test game",
        fields: undefined,
      });
    });

    it("should handle API errors", async () => {
      const apiError = new Error("IGDB API error");
      mockSearch.mockRejectedValue(apiError);

      const result = await service.searchGames({ name: "test game" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to search games");
    });

    it("should return empty results when no games found", async () => {
      mockSearch.mockResolvedValue([]);

      const result = await service.searchGames({ name: "nonexistent game" });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual([]);
      expect(result.data?.count).toBe(0);
    });
  });

  describe("getGameDetails", () => {
    it("should return error for invalid game ID", async () => {
      const result = await service.getGameDetails({ gameId: 0 });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Valid game ID is required");
      expect(mockGetGameById).not.toHaveBeenCalled();
    });

    it("should return error for negative game ID", async () => {
      const result = await service.getGameDetails({ gameId: -1 });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Valid game ID is required");
      expect(mockGetGameById).not.toHaveBeenCalled();
    });

    it("should get game details successfully", async () => {
      const mockGame = {
        id: 1,
        name: "Cyberpunk 2077",
        summary: "An open-world RPG set in a dystopian future.",
        aggregated_rating: 85.5,
        cover: { image_id: "cover1" },
        genres: [{ name: "RPG" }, { name: "Action" }],
        screenshots: [{ image_id: "screenshot1" }],
        release_dates: [{ platform: { name: "PC" }, human: "Dec 10, 2020" }],
        involved_companies: [
          {
            developer: true,
            publisher: false,
            company: { name: "CD Projekt RED" },
          },
        ],
        game_modes: [{ name: "Single player" }],
        game_engines: [{ name: "REDengine 4" }],
        player_perspectives: [{ name: "First person" }],
        themes: [{ name: "Science fiction" }],
        external_games: [
          {
            category: 1,
            name: "Steam",
            url: "https://store.steampowered.com/app/1091500",
          },
        ],
        similar_games: [
          {
            name: "The Witcher 3",
            cover: { image_id: "witcher3_cover" },
            release_dates: [{ human: "2015" }],
            first_release_date: 1431993600,
          },
        ],
        websites: [
          {
            url: "https://www.cyberpunk.net",
            category: 1,
            trusted: true,
          },
        ],
        franchise: 123,
        franchises: [456],
        game_type: { type: 0 },
      };

      mockGetGameById.mockResolvedValue(mockGame);

      const result = await service.getGameDetails({ gameId: 1 });

      expect(result.success).toBe(true);
      expect(result.data?.game).toEqual(mockGame);
      expect(mockGetGameById).toHaveBeenCalledWith(1);
    });

    it("should handle game not found", async () => {
      mockGetGameById.mockResolvedValue(undefined);

      const result = await service.getGameDetails({ gameId: 999 });

      expect(result.success).toBe(true);
      expect(result.data?.game).toBeNull();
      expect(mockGetGameById).toHaveBeenCalledWith(999);
    });

    it("should handle API errors", async () => {
      const apiError = new Error("IGDB API error");
      mockGetGameById.mockRejectedValue(apiError);

      const result = await service.getGameDetails({ gameId: 1 });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch game details");
    });
  });

  describe("getPlatforms", () => {
    it("should get platforms successfully", async () => {
      const mockPlatforms = [
        { id: 1, name: "PC" },
        { id: 48, name: "PlayStation 4" },
        { id: 49, name: "Xbox One" },
        { id: 130, name: "Nintendo Switch" },
        { id: 167, name: "PlayStation 5" },
        { id: 169, name: "Xbox Series X" },
      ];

      mockGetPlatforms.mockResolvedValue(mockPlatforms);

      const result = await service.getPlatforms();

      expect(result.success).toBe(true);
      expect(result.data?.platforms).toEqual(mockPlatforms);
      expect(mockGetPlatforms).toHaveBeenCalled();
    });

    it("should handle API returning null", async () => {
      mockGetPlatforms.mockResolvedValue(null);

      const result = await service.getPlatforms();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch platforms");
    });

    it("should handle API returning undefined", async () => {
      mockGetPlatforms.mockResolvedValue(undefined);

      const result = await service.getPlatforms();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch platforms");
    });

    it("should handle API errors", async () => {
      const apiError = new Error("IGDB API error");
      mockGetPlatforms.mockRejectedValue(apiError);

      const result = await service.getPlatforms();

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to fetch platforms");
    });

    it("should handle empty platforms list", async () => {
      mockGetPlatforms.mockResolvedValue([]);

      const result = await service.getPlatforms();

      expect(result.success).toBe(true);
      expect(result.data?.platforms).toEqual([]);
    });
  });

  describe("edge cases", () => {
    it("should handle special characters in search", async () => {
      const mockGames = [
        {
          id: 1,
          name: "Grand Theft Auto: Vice City",
          cover: { image_id: "gta_cover" },
          platforms: [{ name: "PC" }],
          release_dates: [{ human: "2002" }],
          first_release_date: 1035331200,
          category: 0,
        },
      ];

      mockSearch.mockResolvedValue(mockGames);

      const result = await service.searchGames({
        name: "Grand Theft Auto: Vice City",
      });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual(mockGames);
    });

    it("should handle very large game IDs", async () => {
      const largeGameId = 999999999;
      const mockGame = {
        id: largeGameId,
        name: "Test Game",
        summary: "A test game",
      };

      mockGetGameById.mockResolvedValue(mockGame);

      const result = await service.getGameDetails({ gameId: largeGameId });

      expect(result.success).toBe(true);
      expect(result.data?.game).toEqual(mockGame);
      expect(mockGetGameById).toHaveBeenCalledWith(largeGameId);
    });

    it("should handle complex search fields", async () => {
      const mockGames = [
        {
          id: 1,
          name: "Multi-platform Game",
          cover: { image_id: "multi_cover" },
          platforms: [{ name: "PC" }, { name: "PlayStation 5" }],
          release_dates: [{ human: "2024" }],
          first_release_date: 1704067200,
          category: 0,
        },
      ];

      mockSearch.mockResolvedValue(mockGames);

      const result = await service.searchGames({
        name: "multi platform",
        fields: {
          platform: "PC",
          platforms: "48,49",
        },
      });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual(mockGames);
      expect(mockSearch).toHaveBeenCalledWith({
        name: "multi platform",
        fields: {
          platform: "PC",
          platforms: "48,49",
        },
      });
    });
  });
});
