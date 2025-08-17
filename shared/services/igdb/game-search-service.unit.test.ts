import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SearchResponse } from "@/shared/types";
import { GameSearchService } from "./game-search-service";

// Mock the IGDB API
vi.mock("@/shared/lib/igdb", () => ({
  default: {
    search: vi.fn(),
  },
}));

import igdbApi from "@/shared/lib/igdb";

describe("GameSearchService", () => {
  let service: GameSearchService;
  let mockSearch: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GameSearchService();
    mockSearch = vi.mocked(igdbApi.search);
  });

  describe("searchGames", () => {
    it("should return error for empty search query", async () => {
      const result = await service.searchGames({ name: "" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search query is required and cannot be empty");
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("should return error for undefined search query", async () => {
      const result = await service.searchGames({ name: "undefined" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search query is required and cannot be empty");
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("should return error for whitespace-only search query", async () => {
      const result = await service.searchGames({ name: "   " });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Search query is required and cannot be empty");
      expect(mockSearch).not.toHaveBeenCalled();
    });

    it("should return empty results when IGDB returns no games", async () => {
      mockSearch.mockResolvedValue([]);

      const result = await service.searchGames({ name: "nonexistent game" });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual([]);
      expect(result.data?.count).toBe(0);
      expect(mockSearch).toHaveBeenCalledWith({
        name: "nonexistent game",
        fields: { platforms: "" },
      });
    });

    it("should return empty results when IGDB returns null/undefined", async () => {
      mockSearch.mockResolvedValue(null);

      const result = await service.searchGames({ name: "test game" });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual([]);
      expect(result.data?.count).toBe(0);
    });

    it("should return successful results with games", async () => {
      const mockGames: SearchResponse[] = [
        {
          id: 1,
          name: "Test Game",
          cover: { id: 1, image_id: "cover123" },
          first_release_date: 1234567890,
          platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
        },
        {
          id: 2,
          name: "Another Game",
          cover: { id: 2, image_id: "cover456" },
          first_release_date: 1234567891,
          platforms: [{ id: 48, name: "PlayStation 4" }],
        },
      ];

      mockSearch.mockResolvedValue(mockGames);

      const result = await service.searchGames({ name: "test" });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual(mockGames);
      expect(result.data?.count).toBe(2);
      expect(mockSearch).toHaveBeenCalledWith({
        name: "test",
        fields: { platforms: "" },
      });
    });

    it("should pass platform filters to IGDB API", async () => {
      const mockGames: SearchResponse[] = [
        {
          id: 1,
          name: "PC Game",
          cover: { id: 1, image_id: "cover123" },
          first_release_date: 1234567890,
          platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
        },
      ];

      mockSearch.mockResolvedValue(mockGames);

      const result = await service.searchGames({
        name: "test",
        fields: { platforms: "6" },
      });

      expect(result.success).toBe(true);
      expect(result.data?.games).toEqual(mockGames);
      expect(mockSearch).toHaveBeenCalledWith({
        name: "test",
        fields: { platforms: "6" },
      });
    });

    it("should handle IGDB API errors", async () => {
      const apiError = new Error("IGDB API is down");
      mockSearch.mockRejectedValue(apiError);

      const result = await service.searchGames({ name: "test" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to search games");
      expect(mockSearch).toHaveBeenCalledWith({
        name: "test",
        fields: { platforms: "" },
      });
    });

    it("should handle non-Error exceptions", async () => {
      mockSearch.mockRejectedValue("String error");

      const result = await service.searchGames({ name: "test" });

      expect(result.success).toBe(false);
      expect(result.error).toBe("Failed to search games");
    });
  });
});