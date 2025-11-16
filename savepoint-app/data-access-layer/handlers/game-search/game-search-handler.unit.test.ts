import { IgdbService } from "@/data-access-layer/services/igdb";
import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";
import type { ServiceResult } from "@/data-access-layer/services/types";
import { beforeEach, describe, expect, it, vi } from "vitest";

// Import mocked functions after mock definitions
import { checkRateLimit } from "@/shared/lib/rate-limit";
import { GAME_TYPE } from "@/shared/types";

import type { RequestContext } from "../types";
import { gameSearchHandler } from "./game-search-handler";

// Mock dependencies
vi.mock("@/data-access-layer/services/igdb");
vi.mock("@/shared/lib/rate-limit");

const mockIgdbService = vi.mocked(IgdbService);
const mockCheckRateLimit = vi.mocked(checkRateLimit);

describe("gameSearchHandler", () => {
  // Mock request context
  const mockContext: RequestContext = {
    ip: "192.168.1.1",
    headers: new Headers(),
    url: new URL("http://localhost/api/games/search"),
  };

  beforeEach(() => {
    vi.clearAllMocks();

    // Default rate limit mock (allowed)
    mockCheckRateLimit.mockResolvedValue({
      allowed: true,
      remaining: 19,
    });
  });

  describe("when user searches for a game", () => {
    it("should return games when valid query is provided", async () => {
      // Arrange
      const mockSearchResult: ServiceResult<GameSearchResult> = {
        success: true,
        data: {
          games: [
            {
              id: 1,
              name: "The Legend of Zelda: Breath of the Wild",
              cover: { id: 123, image_id: "co3p2d" },
              platforms: [{ id: 1, name: "Nintendo Switch" }],
              first_release_date: 1488326400,
              slug: "the-legend-of-zelda-breath-of-the-wild",
              game_type: GAME_TYPE.MAIN_GAME,
            },
          ],
          count: 1,
        },
      };

      mockIgdbService.prototype.searchGamesByName = vi
        .fn()
        .mockResolvedValue(mockSearchResult);

      // Act
      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.status).toBe(200);
        expect(result.data.games).toHaveLength(1);
        expect(result.data.games[0]?.name).toBe(
          "The Legend of Zelda: Breath of the Wild"
        );
        expect(result.data.count).toBe(1);
      }
    });

    it("should validate minimum 3 characters", async () => {
      // Act
      const result = await gameSearchHandler(
        { query: "ze", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("Invalid search parameters");
      }
    });

    it("should handle missing query parameter", async () => {
      // Act
      const result = await gameSearchHandler(
        { query: "", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("Invalid search parameters");
      }
    });

    it("should validate offset is non-negative", async () => {
      // Act
      const result = await gameSearchHandler(
        { query: "zelda", offset: -1 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(400);
        expect(result.error).toBe("Invalid search parameters");
      }
    });

    it("should support pagination with offset", async () => {
      // Arrange
      const mockSearchResult: ServiceResult<GameSearchResult> = {
        success: true,
        data: {
          games: [
            {
              id: 100,
              name: "Game from page 2",
              cover: { id: 123, image_id: "test" },
              platforms: [{ id: 123, name: "PC" }],
              first_release_date: 1234567890,
              slug: "game-from-page-2",
              game_type: GAME_TYPE.MAIN_GAME,
            },
          ],
          count: 1,
        },
      };

      const searchSpy = vi.fn().mockResolvedValue(mockSearchResult);
      mockIgdbService.prototype.searchGamesByName = searchSpy;

      // Act
      const result = await gameSearchHandler(
        { query: "zelda", offset: 20 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(true);
      expect(searchSpy).toHaveBeenCalledWith({
        name: "zelda",
        offset: 20,
      });
    });

    it("should handle empty IGDB response gracefully", async () => {
      // Arrange
      const mockSearchResult: ServiceResult<GameSearchResult> = {
        success: true,
        data: {
          games: [],
          count: 0,
        },
      };

      mockIgdbService.prototype.searchGamesByName = vi
        .fn()
        .mockResolvedValue(mockSearchResult);

      // Act
      const result = await gameSearchHandler(
        { query: "nonexistentgame12345", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.games).toEqual([]);
        expect(result.data.count).toBe(0);
      }
    });
  });

  describe("when user encounters rate limiting", () => {
    it("should return 429 when rate limit exceeded", async () => {
      // Arrange
      mockCheckRateLimit.mockResolvedValue({
        allowed: false,
        remaining: 0,
      });

      // Act
      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(429);
        expect(result.error).toBe("Rate limit exceeded. Try again later.");
        expect(result.headers).toMatchObject({
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": "0",
          "Retry-After": "3600",
        });
      }
    });
  });

  describe("when IGDB service has issues", () => {
    it("should return 500 when IGDB service fails", async () => {
      // Arrange
      const mockErrorResult: ServiceResult<GameSearchResult> = {
        success: false,
        error: "IGDB API is unavailable",
      };

      mockIgdbService.prototype.searchGamesByName = vi
        .fn()
        .mockResolvedValue(mockErrorResult);

      // Act
      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe("IGDB API is unavailable");
      }
    });

    it("should return default error message when service error has no message", async () => {
      // Arrange
      const mockErrorResult: ServiceResult<GameSearchResult> = {
        success: false,
        error: "",
      };

      mockIgdbService.prototype.searchGamesByName = vi
        .fn()
        .mockResolvedValue(mockErrorResult);

      // Act
      const result = await gameSearchHandler(
        { query: "zelda", offset: 0 },
        mockContext
      );

      // Assert
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.status).toBe(500);
        expect(result.error).toBe(
          "Game search is temporarily unavailable. Please try again later."
        );
      }
    });
  });
});
