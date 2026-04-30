import { getPlatformsForLibraryModal } from "@/data-access-layer/handlers/platform/get-platforms-for-library-modal";
import { GameDetailService } from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import * as platformService from "@/data-access-layer/services/platform/platform-service";
import {
  createFullGameFixture,
  platformApiResponseFixture,
} from "@/test/fixtures";

vi.mock("@/data-access-layer/services/game-detail/game-detail-service", () => ({
  GameDetailService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/platform/platform-service", () => ({
  getPlatformsForGame: vi.fn(),
  savePlatforms: vi.fn(),
}));

describe("getPlatformsForLibraryModal", () => {
  let mockGameDetailService: {
    populateGameInDatabase: ReturnType<typeof vi.fn>;
  };
  let mockGetPlatformsForGame: ReturnType<typeof vi.fn>;
  let mockIgdbService: {
    getGameDetails: ReturnType<typeof vi.fn>;
    getPlatforms: ReturnType<typeof vi.fn>;
  };
  let mockSavePlatforms: ReturnType<typeof vi.fn>;

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
    vi.resetAllMocks();

    mockGameDetailService = {
      populateGameInDatabase: vi.fn(),
    };

    mockGetPlatformsForGame = vi.mocked(platformService.getPlatformsForGame);

    mockIgdbService = {
      getGameDetails: vi.fn(),
      getPlatforms: vi.fn(),
    };

    mockSavePlatforms = vi.mocked(platformService.savePlatforms);

    vi.mocked(GameDetailService).mockImplementation(function () {
      return mockGameDetailService as unknown as GameDetailService;
    });
    vi.mocked(IgdbService).mockImplementation(function () {
      return mockIgdbService as unknown as IgdbService;
    });
  });

  describe("success scenarios", () => {
    it("should return platforms immediately when found in database (fast path)", async () => {
      mockGetPlatformsForGame.mockResolvedValue(mockPlatformsResponse);

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

      expect(mockGetPlatformsForGame).toHaveBeenCalledWith(validIgdbId);
      expect(mockIgdbService.getGameDetails).not.toHaveBeenCalled();
    });

    it("should fetch from IGDB when database returns empty platforms", async () => {
      mockGetPlatformsForGame
        .mockResolvedValueOnce({ supportedPlatforms: [], otherPlatforms: [] })
        .mockResolvedValueOnce(mockPlatformsResponse);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockSavePlatforms.mockResolvedValue([]);
      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

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
      expect(mockSavePlatforms).toHaveBeenCalled();
      expect(mockGameDetailService.populateGameInDatabase).toHaveBeenCalledWith(
        mockIgdbGame
      );
      expect(mockGetPlatformsForGame).toHaveBeenCalledTimes(2);
    });

    it("should fetch all IGDB platforms when game has no platforms", async () => {
      const gameWithoutPlatforms = createFullGameFixture({
        id: validIgdbId,
        platforms: [],
      });

      mockGetPlatformsForGame
        .mockResolvedValueOnce({ supportedPlatforms: [], otherPlatforms: [] })
        .mockResolvedValueOnce({
          supportedPlatforms: [],
          otherPlatforms: mockPlatformsResponse.otherPlatforms,
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

      mockSavePlatforms.mockResolvedValue([]);

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      expect(mockIgdbService.getPlatforms).toHaveBeenCalled();
      expect(mockSavePlatforms).toHaveBeenCalled();
    });

    it("should return empty arrays when all fallbacks fail", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        supportedPlatforms: [],
        otherPlatforms: [],
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
    it("should handle database NotFoundError by falling through to IGDB", async () => {
      const { NotFoundError } = await import("@/shared/lib/errors");

      mockGetPlatformsForGame
        .mockRejectedValueOnce(new NotFoundError("Game not found"))
        .mockResolvedValueOnce(mockPlatformsResponse);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockSavePlatforms.mockResolvedValue([]);
      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
    });

    it("should handle unexpected exceptions", async () => {
      mockGetPlatformsForGame.mockRejectedValue(new Error("Unexpected error"));

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unexpected error");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockGetPlatformsForGame.mockRejectedValue("String error message");

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An unexpected error occurred");
      }
    });

    it("should handle upsert failures gracefully and continue", async () => {
      mockGetPlatformsForGame
        .mockResolvedValueOnce({ supportedPlatforms: [], otherPlatforms: [] })
        .mockResolvedValueOnce(mockPlatformsResponse);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockSavePlatforms.mockRejectedValue(new Error("Upsert failed"));
      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(false);
    });
  });

  describe("edge cases", () => {
    it("should handle IGDB game with undefined platforms", async () => {
      const gameWithUndefinedPlatforms = createFullGameFixture({
        id: validIgdbId,
        platforms: undefined,
      });

      mockGetPlatformsForGame
        .mockResolvedValueOnce({ supportedPlatforms: [], otherPlatforms: [] })
        .mockResolvedValueOnce({
          supportedPlatforms: [],
          otherPlatforms: mockPlatformsResponse.otherPlatforms,
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

      mockSavePlatforms.mockResolvedValue([]);

      const result = await getPlatformsForLibraryModal({ igdbId: validIgdbId });

      expect(result.success).toBe(true);
      expect(mockIgdbService.getPlatforms).toHaveBeenCalled();
    });

    it("should handle IGDB returning null game", async () => {
      mockGetPlatformsForGame.mockResolvedValue({
        supportedPlatforms: [],
        otherPlatforms: [],
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
