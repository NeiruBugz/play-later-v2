import {
  findGameByIgdbId,
  findPlatformsForGame,
} from "@/data-access-layer/repository";
import {
  repositoryError,
  RepositoryErrorCode,
  repositorySuccess,
} from "@/data-access-layer/repository/types";
import type { Game, Platform } from "@prisma/client";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { PlatformService } from "./platform-service";

// Mock repository functions
vi.mock("@/data-access-layer/repository", () => ({
  findGameByIgdbId: vi.fn(),
  findPlatformsForGame: vi.fn(),
}));

describe("PlatformService", () => {
  let service: PlatformService;
  let mockFindGameByIgdbId: ReturnType<typeof vi.fn>;
  let mockFindPlatformsForGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new PlatformService();
    mockFindGameByIgdbId = vi.mocked(findGameByIgdbId);
    mockFindPlatformsForGame = vi.mocked(findPlatformsForGame);
  });

  describe("getPlatformsForGame", () => {
    const validIgdbId = 12345;
    const mockGameId = "clx123abc456def";

    const mockGame: Game = {
      id: mockGameId,
      igdbId: validIgdbId,
      title: "Test Game",
      slug: "test-game",
      summary: "A test game",
      storyline: null,
      coverImage: "https://example.com/cover.jpg",
      releaseDate: new Date("2024-01-01"),
      aggregatedRating: 85.5,
      aggregatedRatingCount: 100,
      category: "main_game",
      checksum: "test-checksum",
      url: "https://igdb.com/games/test-game",
      createdAt: new Date("2025-01-01"),
      updatedAt: new Date("2025-01-01"),
    };

    const mockSupportedPlatforms: Platform[] = [
      {
        id: "plat1",
        igdbId: 167,
        name: "PlayStation 5",
        slug: "ps5",
        abbreviation: "PS5",
        alternativeName: null,
        generation: 9,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: "plat2",
        igdbId: 169,
        name: "Xbox Series X|S",
        slug: "xbox-series-xs",
        abbreviation: "Series X|S",
        alternativeName: null,
        generation: 9,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    const mockOtherPlatforms: Platform[] = [
      {
        id: "plat3",
        igdbId: 6,
        name: "PC (Microsoft Windows)",
        slug: "win",
        abbreviation: "PC",
        alternativeName: "Windows",
        generation: null,
        platformFamily: null,
        platformType: null,
        checksum: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ];

    describe("success scenarios", () => {
      it("should return success result with platforms when both repositories succeed", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        mockFindPlatformsForGame.mockResolvedValue(
          repositorySuccess({
            supportedPlatforms: mockSupportedPlatforms,
            otherPlatforms: mockOtherPlatforms,
          })
        );

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.supportedPlatforms).toEqual(mockSupportedPlatforms);
          expect(result.data.otherPlatforms).toEqual(mockOtherPlatforms);
          expect(result.data.supportedPlatforms).toHaveLength(2);
          expect(result.data.otherPlatforms).toHaveLength(1);
        }

        expect(mockFindGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
        expect(mockFindGameByIgdbId).toHaveBeenCalledTimes(1);
        expect(mockFindPlatformsForGame).toHaveBeenCalledWith(mockGameId);
        expect(mockFindPlatformsForGame).toHaveBeenCalledTimes(1);
      });

      it("should return success with empty platform arrays", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        mockFindPlatformsForGame.mockResolvedValue(
          repositorySuccess({
            supportedPlatforms: [],
            otherPlatforms: [],
          })
        );

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.supportedPlatforms).toEqual([]);
          expect(result.data.otherPlatforms).toEqual([]);
        }
      });

      it("should return success with only supported platforms", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        mockFindPlatformsForGame.mockResolvedValue(
          repositorySuccess({
            supportedPlatforms: mockSupportedPlatforms,
            otherPlatforms: [],
          })
        );

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.supportedPlatforms).toEqual(mockSupportedPlatforms);
          expect(result.data.otherPlatforms).toEqual([]);
        }
      });

      it("should return success with only other platforms", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        mockFindPlatformsForGame.mockResolvedValue(
          repositorySuccess({
            supportedPlatforms: [],
            otherPlatforms: mockOtherPlatforms,
          })
        );

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.supportedPlatforms).toEqual([]);
          expect(result.data.otherPlatforms).toEqual(mockOtherPlatforms);
        }
      });
    });

    describe("game not found scenarios", () => {
      it("should return error when game does not exist in database", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(null));

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Game not found");
        }

        expect(mockFindGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
        expect(mockFindPlatformsForGame).not.toHaveBeenCalled();
      });

      it("should return error when findGameByIgdbId repository fails", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Database connection failed"
          )
        );

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to fetch game");
        }

        expect(mockFindGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
        expect(mockFindPlatformsForGame).not.toHaveBeenCalled();
      });
    });

    describe("platform fetch error scenarios", () => {
      it("should return error when findPlatformsForGame repository fails", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        mockFindPlatformsForGame.mockResolvedValue(
          repositoryError(
            RepositoryErrorCode.DATABASE_ERROR,
            "Failed to query platforms"
          )
        );

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Failed to fetch platforms");
        }

        expect(mockFindGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
        expect(mockFindPlatformsForGame).toHaveBeenCalledWith(mockGameId);
      });
    });

    describe("exception handling", () => {
      it("should handle unexpected exceptions from findGameByIgdbId", async () => {
        // Arrange
        const unexpectedError = new Error("Unexpected database error");
        mockFindGameByIgdbId.mockRejectedValue(unexpectedError);

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Unexpected database error");
        }
      });

      it("should handle unexpected exceptions from findPlatformsForGame", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        const unexpectedError = new Error("Query timeout");
        mockFindPlatformsForGame.mockRejectedValue(unexpectedError);

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Query timeout");
        }
      });

      it("should handle non-Error exceptions", async () => {
        // Arrange
        mockFindGameByIgdbId.mockRejectedValue("String error");

        // Act
        const result = await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("An unexpected error occurred");
        }
      });
    });

    describe("edge cases", () => {
      it("should handle game with zero igdbId", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(null));

        // Act
        const result = await service.getPlatformsForGame(0);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Game not found");
        }
      });

      it("should handle negative igdbId", async () => {
        // Arrange
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(null));

        // Act
        const result = await service.getPlatformsForGame(-1);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Game not found");
        }
      });

      it("should handle very large igdbId", async () => {
        // Arrange
        const largeIgdbId = 999999999;
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(null));

        // Act
        const result = await service.getPlatformsForGame(largeIgdbId);

        // Assert
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error).toBe("Game not found");
        }

        expect(mockFindGameByIgdbId).toHaveBeenCalledWith(largeIgdbId);
      });
    });

    describe("service method isolation", () => {
      it("should not mutate input parameters", async () => {
        // Arrange
        const inputIgdbId = 12345;
        mockFindGameByIgdbId.mockResolvedValue(repositorySuccess(mockGame));
        mockFindPlatformsForGame.mockResolvedValue(
          repositorySuccess({
            supportedPlatforms: mockSupportedPlatforms,
            otherPlatforms: mockOtherPlatforms,
          })
        );

        // Act
        await service.getPlatformsForGame(inputIgdbId);

        // Assert - input should remain unchanged
        expect(inputIgdbId).toBe(12345);
      });

      it("should call repositories in correct order (game first, then platforms)", async () => {
        // Arrange
        const callOrder: string[] = [];

        mockFindGameByIgdbId.mockImplementation(async () => {
          callOrder.push("findGameByIgdbId");
          return repositorySuccess(mockGame);
        });

        mockFindPlatformsForGame.mockImplementation(async () => {
          callOrder.push("findPlatformsForGame");
          return repositorySuccess({
            supportedPlatforms: mockSupportedPlatforms,
            otherPlatforms: mockOtherPlatforms,
          });
        });

        // Act
        await service.getPlatformsForGame(validIgdbId);

        // Assert
        expect(callOrder).toEqual([
          "findGameByIgdbId",
          "findPlatformsForGame",
        ]);
      });
    });
  });
});
