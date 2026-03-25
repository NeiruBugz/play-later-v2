import { ServiceErrorCode } from "../types";
import { IgdbService } from "./igdb-service";

vi.mock("@/env.mjs", () => ({
  env: {
    IGDB_CLIENT_ID: "test-client-id",
    IGDB_CLIENT_SECRET: "test-client-secret",
  },
}));

const mockFetch = vi.fn();
Object.defineProperty(global, "fetch", {
  writable: true,
  value: mockFetch,
});

describe("IgdbService", () => {
  let service: IgdbService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockFetch.mockReset();
    service = new IgdbService();
  });

  describe("getGameGenres", () => {
    describe("when service returns", () => {
      it("should return genres when valid game ID is provided", async () => {
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 1234,
            genres: [
              { id: 5, name: "Shooter" },
              { id: 12, name: "Role-playing (RPG)" },
            ],
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toHaveLength(2);
          expect(result.data.genres[0].id).toBe(5);
          expect(result.data.genres[0].name).toBe("Shooter");
          expect(result.data.genres[1].id).toBe(12);
          expect(result.data.genres[1].name).toBe("Role-playing (RPG)");
        }
      });

      it("should handle empty response (game has no genres)", async () => {
        const params = { gameId: 1234 };
        const mockResponse = [{ id: 1234, genres: [] }];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toEqual([]);
        }
      });

      it("should handle response without genres field", async () => {
        const params = { gameId: 1234 };
        const mockResponse = [{ id: 1234 }];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toEqual([]);
        }
      });

      it("should handle API returning empty array (game not found)", async () => {
        const params = { gameId: 9999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as unknown as number };

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        const params = { gameId: undefined as unknown as number };

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch game genres");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameGenres(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getGameAggregatedRating", () => {
    describe("when service returns", () => {
      it("should return aggregated rating when valid game ID is provided", async () => {
        const params = { gameId: 1942 };
        const mockResponse = [
          {
            id: 1942,
            aggregated_rating: 87.5,
            aggregated_rating_count: 42,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gameId).toBe(1942);
          expect(result.data.rating).toBe(87.5);
          expect(result.data.count).toBe(42);
        }
      });

      it("should handle missing rating data gracefully", async () => {
        const params = { gameId: 1234 };
        const mockResponse = [{ id: 1234 }];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gameId).toBe(1234);
          expect(result.data.rating).toBeUndefined();
          expect(result.data.count).toBeUndefined();
        }
      });

      it("should handle rating without count", async () => {
        const params = { gameId: 5678 };
        const mockResponse = [
          {
            id: 5678,
            aggregated_rating: 92.3,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gameId).toBe(5678);
          expect(result.data.rating).toBe(92.3);
          expect(result.data.count).toBeUndefined();
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as unknown as number };

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        const params = { gameId: undefined as unknown as number };

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return NOT_FOUND when game does not exist", async () => {
        const params = { gameId: 999999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("No game found with ID");
          expect(result.error).toContain("999999");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch game aggregated rating"
          );
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameAggregatedRating(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getGameCompletionTimes", () => {
    describe("when service returns", () => {
      it("should return completion times when valid game ID is provided", async () => {
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 1,
            game_id: 1234,
            gameplay_main: 36000,
            gameplay_main_extra: 54000,
            gameplay_completionist: 90000,
            completeness: 85,
            created_at: 1609459200,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completionTimes).toBeDefined();
          expect(result.data.completionTimes?.id).toBe(1);
          expect(result.data.completionTimes?.game_id).toBe(1234);
          expect(result.data.completionTimes?.gameplay_main).toBe(36000);
          expect(result.data.completionTimes?.gameplay_main_extra).toBe(54000);
          expect(result.data.completionTimes?.gameplay_completionist).toBe(
            90000
          );
          expect(result.data.completionTimes?.completeness).toBe(85);
        }
      });

      it("should handle missing completion time data gracefully (empty response)", async () => {
        const params = { gameId: 9999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completionTimes).toBeNull();
        }
      });

      it("should handle partial completion time data", async () => {
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 2,
            game_id: 1234,
            gameplay_main: 18000,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockResponse,
        });

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completionTimes).toBeDefined();
          expect(result.data.completionTimes?.gameplay_main).toBe(18000);
          expect(
            result.data.completionTimes?.gameplay_main_extra
          ).toBeUndefined();
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as unknown as number };

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        const params = { gameId: undefined as unknown as number };

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch game completion times"
          );
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameCompletionTimes(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getGameScreenshots", () => {
    describe("when service returns", () => {
      it("should return screenshots when valid game ID is provided", async () => {
        const params = { gameId: 1942 };
        const mockScreenshots = [
          {
            id: 123456,
            game: 1942,
            image_id: "sc_zelda_botw_1",
            url: "//images.igdb.com/igdb/image/upload/t_screenshot_med/sc_zelda_botw_1.jpg",
            width: 1920,
            height: 1080,
          },
          {
            id: 123457,
            game: 1942,
            image_id: "sc_zelda_botw_2",
            url: "//images.igdb.com/igdb/image/upload/t_screenshot_med/sc_zelda_botw_2.jpg",
            width: 1920,
            height: 1080,
          },
          {
            id: 123458,
            game: 1942,
            image_id: "sc_zelda_botw_3",
            url: "//images.igdb.com/igdb/image/upload/t_screenshot_med/sc_zelda_botw_3.jpg",
            width: 1920,
            height: 1080,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockScreenshots,
        });

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.screenshots).toHaveLength(3);
          expect(result.data.screenshots[0].id).toBe(123456);
          expect(result.data.screenshots[0].image_id).toBe("sc_zelda_botw_1");
          expect(result.data.screenshots[0].game).toBe(1942);
          expect(result.data.screenshots[0].url).toContain("screenshot_med");
          expect(result.data.screenshots[0].width).toBe(1920);
          expect(result.data.screenshots[0].height).toBe(1080);
        }
      });

      it("should handle empty response gracefully (game has no screenshots)", async () => {
        const params = { gameId: 9999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.screenshots).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as unknown as number };

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        const params = { gameId: undefined as unknown as number };

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        const params = { gameId: 1942 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch game screenshots");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1942 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameScreenshots(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getGameArtworks", () => {
    describe("when service returns", () => {
      it("should return artworks when valid game ID is provided", async () => {
        const params = { gameId: 1234 };
        const mockArtworks = [
          {
            id: 1,
            image_id: "abc123",
            game: 1234,
            checksum: "checksum1",
            url: "//images.igdb.com/igdb/image/upload/t_thumb/abc123.jpg",
            width: 1920,
            height: 1080,
            alpha_channel: false,
            animated: false,
          },
          {
            id: 2,
            image_id: "def456",
            game: 1234,
            checksum: "checksum2",
            url: "//images.igdb.com/igdb/image/upload/t_thumb/def456.jpg",
            width: 1920,
            height: 1080,
            alpha_channel: true,
            animated: false,
          },
        ];

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => mockArtworks,
        });

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.artworks).toHaveLength(2);
          expect(result.data.artworks[0].image_id).toBe("abc123");
          expect(result.data.artworks[0].game).toBe(1234);
          expect(result.data.artworks[1].image_id).toBe("def456");
        }
      });

      it("should return empty array when game has no artworks", async () => {
        const params = { gameId: 9999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.artworks).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as any };

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameArtworks(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });
});
