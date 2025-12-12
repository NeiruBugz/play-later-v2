import * as platformRepository from "@/data-access-layer/repository/platform/platform-repository";
import * as gameDetailService from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { PlatformService } from "@/data-access-layer/services/platform/platform-service";
import {
  createFullGameFixture,
  platformApiResponseFixture,
} from "@/test/fixtures";

import { getPlatformsForLibraryModal } from "./get-platforms-for-library-modal";

vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/platform/platform-service", () => ({
  PlatformService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/game-detail/game-detail-service", () => ({
  populateGameInDatabase: vi.fn(),
}));

vi.mock("@/data-access-layer/repository/platform/platform-repository", () => ({
  upsertPlatforms: vi.fn(),
}));

describe("getPlatformsForLibraryModal", () => {
  let mockPlatformService: {
    getPlatformsForGame: ReturnType<typeof vi.fn>;
  };
  let mockIgdbService: {
    getGameDetails: ReturnType<typeof vi.fn>;
    getPlatforms: ReturnType<typeof vi.fn>;
  };
  let mockPopulateGameInDatabase: ReturnType<typeof vi.fn>;
  let mockUpsertPlatforms: ReturnType<typeof vi.fn>;

  const validIgdbId = 12345;

  const mockPlatformsResponse = {
    supportedPlatforms: platformApiResponseFixture.data.supportedPlatforms,
    otherPlatforms: platformApiResponseFixture.data.otherPlatforms,
  };

  const mockIgdbGame = createFullGameFixture({
    id: validIgdbId,
    name: "Test Game",
    slug: "test-game",
    platforms: [
      { id: 167, name: "PlayStation 5", slug: "ps5" },
      { id: 6, name: "PC", slug: "pc" },
    ],
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockPlatformService = {
      getPlatformsForGame: vi.fn(),
    };

    mockIgdbService = {
      getGameDetails: vi.fn(),
      getPlatforms: vi.fn(),
    };

    mockPopulateGameInDatabase = vi.mocked(
      gameDetailService.populateGameInDatabase
    );

    mockUpsertPlatforms = vi.mocked(platformRepository.upsertPlatforms);

    vi.mocked(PlatformService).mockImplementation(function () {
      return mockPlatformService as unknown as PlatformService;
    });
    vi.mocked(IgdbService).mockImplementation(function () {
      return mockIgdbService as unknown as IgdbService;
    });
  });

  describe("success scenarios", () => {
    it("should return platforms immediately when found in database (fast path)", async () => {
      mockPlatformService.getPlatformsForGame.mockResolvedValue({
        success: true,
        data: mockPlatformsResponse,
      });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.supportedPlatforms).toEqual(
          mockPlatformsResponse.supportedPlatforms
        );
        expect(result.data.otherPlatforms).toEqual(
          mockPlatformsResponse.otherPlatforms
        );
      }

      expect(mockPlatformService.getPlatformsForGame).toHaveBeenCalledWith(
        validIgdbId
      );
      expect(mockIgdbService.getGameDetails).not.toHaveBeenCalled();
    });

    it("should fetch from IGDB when database returns empty platforms", async () => {
      mockPlatformService.getPlatformsForGame
        .mockResolvedValueOnce({
          success: true,
          data: { supportedPlatforms: [], otherPlatforms: [] },
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockPlatformsResponse,
        });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockUpsertPlatforms.mockResolvedValue({ ok: true, data: [] });
      mockPopulateGameInDatabase.mockResolvedValue({ ok: true });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.supportedPlatforms).toEqual(
          mockPlatformsResponse.supportedPlatforms
        );
      }

      expect(mockIgdbService.getGameDetails).toHaveBeenCalledWith({
        gameId: validIgdbId,
      });
      expect(mockUpsertPlatforms).toHaveBeenCalled();
      expect(mockPopulateGameInDatabase).toHaveBeenCalledWith(mockIgdbGame);
      expect(mockPlatformService.getPlatformsForGame).toHaveBeenCalledTimes(2);
    });

    it("should fetch all IGDB platforms when game has no platforms", async () => {
      const gameWithoutPlatforms = createFullGameFixture({
        id: validIgdbId,
        platforms: [],
      });

      mockPlatformService.getPlatformsForGame
        .mockResolvedValueOnce({
          success: true,
          data: { supportedPlatforms: [], otherPlatforms: [] },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            supportedPlatforms: [],
            otherPlatforms: mockPlatformsResponse.otherPlatforms,
          },
        });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: gameWithoutPlatforms },
      });

      mockIgdbService.getPlatforms.mockResolvedValue({
        success: true,
        data: {
          platforms: [
            { id: 167, name: "PlayStation 5" },
            { id: 6, name: "PC" },
          ],
        },
      });

      mockUpsertPlatforms.mockResolvedValue({ ok: true, data: [] });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      expect(mockIgdbService.getPlatforms).toHaveBeenCalled();
      expect(mockUpsertPlatforms).toHaveBeenCalled();
    });

    it("should return empty arrays when all fallbacks fail", async () => {
      mockPlatformService.getPlatformsForGame.mockResolvedValue({
        success: true,
        data: { supportedPlatforms: [], otherPlatforms: [] },
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: false,
        error: "IGDB API error",
      });

      mockIgdbService.getPlatforms.mockResolvedValue({
        success: false,
        error: "IGDB API error",
      });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.supportedPlatforms).toEqual([]);
        expect(result.data.otherPlatforms).toEqual([]);
      }
    });
  });

  describe("error scenarios", () => {
    it("should handle database service errors gracefully", async () => {
      mockPlatformService.getPlatformsForGame.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockUpsertPlatforms.mockResolvedValue({ ok: true, data: [] });
      mockPopulateGameInDatabase.mockResolvedValue({ ok: true });

      mockPlatformService.getPlatformsForGame
        .mockResolvedValueOnce({
          success: false,
          error: "Database error",
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockPlatformsResponse,
        });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
    });

    it("should handle unexpected exceptions", async () => {
      mockPlatformService.getPlatformsForGame.mockRejectedValue(
        new Error("Unexpected error")
      );

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unexpected error");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockPlatformService.getPlatformsForGame.mockRejectedValue(
        "String error message"
      );

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An unexpected error occurred");
      }
    });

    it("should handle upsert failures gracefully and continue", async () => {
      mockPlatformService.getPlatformsForGame
        .mockResolvedValueOnce({
          success: true,
          data: { supportedPlatforms: [], otherPlatforms: [] },
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockPlatformsResponse,
        });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockUpsertPlatforms.mockResolvedValue({
        ok: false,
        error: { message: "Upsert failed" },
      });
      mockPopulateGameInDatabase.mockResolvedValue({ ok: true });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
    });
  });

  describe("edge cases", () => {
    it("should handle IGDB game with undefined platforms", async () => {
      const gameWithUndefinedPlatforms = createFullGameFixture({
        id: validIgdbId,
        platforms: undefined,
      });

      mockPlatformService.getPlatformsForGame
        .mockResolvedValueOnce({
          success: true,
          data: { supportedPlatforms: [], otherPlatforms: [] },
        })
        .mockResolvedValueOnce({
          success: true,
          data: {
            supportedPlatforms: [],
            otherPlatforms: mockPlatformsResponse.otherPlatforms,
          },
        });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: gameWithUndefinedPlatforms },
      });

      mockIgdbService.getPlatforms.mockResolvedValue({
        success: true,
        data: {
          platforms: [{ id: 6, name: "PC" }],
        },
      });

      mockUpsertPlatforms.mockResolvedValue({ ok: true, data: [] });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      expect(mockIgdbService.getPlatforms).toHaveBeenCalled();
    });

    it("should handle IGDB returning null game", async () => {
      mockPlatformService.getPlatformsForGame.mockResolvedValue({
        success: true,
        data: { supportedPlatforms: [], otherPlatforms: [] },
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: null },
      });

      mockIgdbService.getPlatforms.mockResolvedValue({
        success: false,
        error: "No platforms",
      });

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.supportedPlatforms).toEqual([]);
        expect(result.data.otherPlatforms).toEqual([]);
      }
    });
  });
});
