import { beforeEach, describe, expect, it, vi } from "vitest";

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

  describe("searchGamesByName", () => {
    describe("when service throws", () => {
      it("should return INTERNAL_ERROR when API throws error", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });
        const result = await service.searchGamesByName({ name: "test game" });

        expect(result.success).toBe(false);
        if ("error" in result) {
          expect(result.error).toBe("Failed to find games");
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });

      it("should return VALIDATION_ERROR for empty game name", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });
        const result = await service.searchGamesByName({ name: "" });

        expect(result.success).toBe(false);
        if ("error" in result) {
          expect(result.error).toBe("Game name is required for search");
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });

      it("should return VALIDATION_ERROR for whitespace-only game name", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });
        const result = await service.searchGamesByName({ name: "   " });

        expect(result.success).toBe(false);
        if ("error" in result) {
          expect(result.error).toBe("Game name is required for search");
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });

      it("should return NOT_FOUND when API returns null", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });
        const result = await service.searchGamesByName({ name: "test game" });

        expect(result.success).toBe(false);
        if ("error" in result) {
          expect(result.error).toBe("Failed to find games");
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });

      it("should return NOT_FOUND when API returns undefined", async () => {
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });
        const result = await service.searchGamesByName({ name: "test game" });

        expect(result.success).toBe(false);
        if ("error" in result) {
          expect(result.error).toBe("Failed to find games");
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });
    });

    describe("when service returns", () => {
      describe("given only name field is provided", () => {
        it("should return empty results when no games found", async () => {
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

          const result = await service.searchGamesByName({
            name: "nonexistent game",
          });

          expect(result.success).toBe(true);
          if ("data" in result) {
            expect(result.data?.games).toEqual([]);
            expect(result.data?.count).toBe(0);
          }
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

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          });

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockGames,
          });

          const result = await service.searchGamesByName({ name: "test game" });

          expect(result.success).toBe(true);
          if ("data" in result) {
            expect(result.data?.games).toEqual(mockGames);
          }
        });
      });

      describe("given platform field", () => {
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

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          });

          mockFetch.mockResolvedValueOnce({
            ok: true,
            json: async () => mockGames,
          });
          const result = await service.searchGamesByName({
            name: "cyberpunk",
            fields: { platform: "PC" },
          });

          expect(result.success).toBe(true);
          if ("data" in result) {
            expect(result.data?.games).toEqual(mockGames);
            expect(result.data?.count).toBe(2);
          }
        });
      });
    });
  });

  describe("getGameBySteamAppId", () => {
    describe("when service returns", () => {
      it("should return game when valid Steam app ID is provided", async () => {
        const params = { steamAppId: 570 };
        const mockGame = { id: 1234, name: "Dota 2" };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [mockGame],
        });

        const result = await service.getGameBySteamAppId(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.game.id).toBe(1234);
          expect(result.data.game.name).toBe("Dota 2");
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when Steam app ID is 0", async () => {
        const params = { steamAppId: 0 };

        const result = await service.getGameBySteamAppId(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid Steam app ID is required");
        }
      });

      it("should return VALIDATION_ERROR when Steam app ID is negative", async () => {
        const params = { steamAppId: -100 };

        const result = await service.getGameBySteamAppId(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid Steam app ID is required");
        }
      });

      it("should return NOT_FOUND when no IGDB game matches Steam app ID", async () => {
        const params = { steamAppId: 999999 };

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

        const result = await service.getGameBySteamAppId(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("No IGDB game found");
          expect(result.error).toContain("999999");
        }
      });

      it("should return NOT_FOUND when API request fails", async () => {
        const params = { steamAppId: 570 };

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
          json: async () => null,
        });

        const result = await service.getGameBySteamAppId(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });

      it("should return NOT_FOUND when token fetch fails", async () => {
        const params = { steamAppId: 570 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameBySteamAppId(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });
    });
  });

  describe("getTopRatedGames", () => {
    describe("when service returns", () => {
      it("should return games sorted by rating when API call succeeds", async () => {
        // Given: IGDB API returns top rated games
        const mockGames = [
          {
            id: 1942,
            name: "The Legend of Zelda: Breath of the Wild",
            cover: { image_id: "co1wyc" },
            aggregated_rating: 97.5,
          },
          {
            id: 119171,
            name: "Elden Ring",
            cover: { image_id: "co4jni" },
            aggregated_rating: 96.2,
          },
          {
            id: 1020,
            name: "Grand Theft Auto V",
            cover: { image_id: "co1r8z" },
            aggregated_rating: 95.8,
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
          json: async () => mockGames,
        });

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get successful response with sorted games
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(3);
          expect(result.data.games[0].name).toBe(
            "The Legend of Zelda: Breath of the Wild"
          );
          expect(result.data.games[0].aggregated_rating).toBe(97.5);
          expect(result.data.games[1].aggregated_rating).toBe(96.2);
          expect(result.data.games[2].aggregated_rating).toBe(95.8);
          // Verify games are sorted by rating descending
          expect(result.data.games[0].aggregated_rating!).toBeGreaterThan(
            result.data.games[1].aggregated_rating!
          );
          expect(result.data.games[1].aggregated_rating!).toBeGreaterThan(
            result.data.games[2].aggregated_rating!
          );
        }
      });
      it("should handle empty response gracefully", async () => {
        // Given: IGDB API returns empty array
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

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: Token fetch succeeds but IGDB API fails
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

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch top-rated games");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We request top rated games
        const result = await service.getTopRatedGames();

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("searchPlatformByName", () => {
    describe("when service returns", () => {
      it("should return matching platforms when valid platform name is provided", async () => {
        // Given: Valid platform name "PlayStation"
        const params = { platformName: "PlayStation" };
        const mockPlatforms = [
          { id: 167, name: "PlayStation 5", abbreviation: "PS5" },
          { id: 48, name: "PlayStation 4", abbreviation: "PS4" },
          { id: 46, name: "PlayStation Vita", abbreviation: "PSVita" },
          { id: 9, name: "PlayStation 3", abbreviation: "PS3" },
          { id: 8, name: "PlayStation 2", abbreviation: "PS2" },
          { id: 7, name: "PlayStation", abbreviation: "PS1" },
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
          json: async () => mockPlatforms,
        });

        // When: We search for platforms by name
        const result = await service.searchPlatformByName(params);

        // Then: We get successful response with matching platforms
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.platforms).toHaveLength(6);
          expect(result.data.platforms[0].id).toBe(167);
          expect(result.data.platforms[0].name).toBe("PlayStation 5");
          expect(result.data.platforms[0].abbreviation).toBe("PS5");
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when platform name is empty", async () => {
        // Given: Empty platform name
        const params = { platformName: "" };

        // When: We search for platforms
        const result = await service.searchPlatformByName(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });

      it("should return NOT_FOUND when no platforms match the search", async () => {
        // Given: Platform name that doesn't exist
        const params = { platformName: "NonexistentPlatform" };

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

        // When: We search for platforms
        const result = await service.searchPlatformByName(params);

        // Then: We get NOT_FOUND error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("No platforms found");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: Token fetch succeeds but IGDB API fails
        const params = { platformName: "PlayStation" };

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

        // When: We search for platforms
        const result = await service.searchPlatformByName(params);

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to search platforms");
        }
      });

      it("should return VALIDATION_ERROR when platform name is whitespace only", async () => {
        // Given: Whitespace-only platform name
        const params = { platformName: "   " };

        // When: We search for platforms
        const result = await service.searchPlatformByName(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });

      it("should return VALIDATION_ERROR when platform name is null", async () => {
        // Given: Null platform name (type coercion)
        const params = { platformName: null as unknown as string };

        // When: We search for platforms
        const result = await service.searchPlatformByName(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });

      it("should return VALIDATION_ERROR when platform name is undefined", async () => {
        // Given: Undefined platform name (type coercion)
        const params = { platformName: undefined as unknown as string };

        // When: We search for platforms
        const result = await service.searchPlatformByName(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });
    });
  });

  describe("getGameScreenshots", () => {
    describe("when service returns", () => {
      it("should return screenshots when valid game ID is provided", async () => {
        // Given: Valid game ID and IGDB API returns screenshots
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

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get successful response with screenshots
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
        // Given: Valid game ID but IGDB API returns empty array
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

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get successful response with empty array (NOT an error)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.screenshots).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        // Given: Null game ID
        const params = { gameId: null as unknown as number };

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        // Given: Undefined game ID
        const params = { gameId: undefined as unknown as number };

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: Game ID is 0
        const params = { gameId: 0 };

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: Negative game ID
        const params = { gameId: -100 };

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: Token fetch succeeds but IGDB API fails
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

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch game screenshots");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1942 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We request game screenshots
        const result = await service.getGameScreenshots(params);

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getSimilarGames", () => {
    describe("when service returns", () => {
      it("should return similar games when valid game ID is provided", async () => {
        // Given: A valid game ID and mocked similar games response
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 1234,
            similar_games: [5000, 5001, 5002, 5003],
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

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get a successful response with similar games
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.similarGames).toBeDefined();
          expect(Array.isArray(result.data.similarGames)).toBe(true);
          expect(result.data.similarGames).toEqual([5000, 5001, 5002, 5003]);
          expect(result.data.similarGames).toHaveLength(4);
        }
      });

      it("should handle empty response gracefully (game has no similar games)", async () => {
        // Given: Valid game ID but no similar games
        const params = { gameId: 9999 };
        const mockResponse = [
          {
            id: 9999,
            // No similar_games field
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

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get successful response with empty array (NOT an error)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.similarGames).toEqual([]);
        }
      });

      it("should handle game not found in response", async () => {
        // Given: Valid game ID but API returns empty array
        const params = { gameId: 7777 };

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

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.similarGames).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        // Given: Null game ID
        const params = { gameId: null as unknown as number };

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        // Given: Undefined game ID
        const params = { gameId: undefined as unknown as number };

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: Game ID is 0
        const params = { gameId: 0 };

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: Negative game ID
        const params = { gameId: -100 };

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get validation error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: Token fetch succeeds but IGDB API fails
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

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch similar games");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We request similar games
        const result = await service.getSimilarGames(params);

        // Then: We get error response
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getGameGenres", () => {
    describe("when service returns", () => {
      it("should return genres when valid game ID is provided", async () => {
        // Given: A valid game ID and mocked IGDB response
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

        // When: We request game genres
        const result = await service.getGameGenres(params);

        // Then: We get a successful response with genres
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
        // Given: Game exists but has no genres
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

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get successful response with empty genres
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toEqual([]);
        }
      });

      it("should handle response without genres field", async () => {
        // Given: Game exists but response has no genres field
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

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get successful response with empty genres
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toEqual([]);
        }
      });

      it("should handle API returning empty array (game not found)", async () => {
        // Given: API returns empty array
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

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get successful response with empty genres
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.genres).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        // Given: An invalid game ID (null)
        const params = { gameId: null as unknown as number };

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        // Given: An invalid game ID (undefined)
        const params = { gameId: undefined as unknown as number };

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: An invalid game ID (0)
        const params = { gameId: 0 };

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: An invalid game ID (negative)
        const params = { gameId: -100 };

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        // Given: IGDB API returns error
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

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch game genres");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We request genres
        const result = await service.getGameGenres(params);

        // Then: We get INTERNAL_ERROR
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
        // Given: Valid game ID and IGDB API returns rating data
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

        // When: We request the game's aggregated rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get a successful response with rating data
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gameId).toBe(1942);
          expect(result.data.rating).toBe(87.5);
          expect(result.data.count).toBe(42);
        }
      });

      it("should handle missing rating data gracefully", async () => {
        // Given: Game exists but has no rating data
        const params = { gameId: 1234 };
        const mockResponse = [{ id: 1234 }]; // No rating fields

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

        // When: We request rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get success with undefined rating
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.gameId).toBe(1234);
          expect(result.data.rating).toBeUndefined();
          expect(result.data.count).toBeUndefined();
        }
      });

      it("should handle rating without count", async () => {
        // Given: Game has rating but no count
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

        // When: We request rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get success with rating but no count
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
        // Given: Null game ID
        const params = { gameId: null as unknown as number };

        // When: We attempt to get rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        // Given: Undefined game ID
        const params = { gameId: undefined as unknown as number };

        // When: We attempt to get rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: Game ID is 0
        const params = { gameId: 0 };

        // When: We attempt to get rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: Negative game ID
        const params = { gameId: -100 };

        // When: We attempt to get rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return NOT_FOUND when game does not exist", async () => {
        // Given: Game ID that doesn't exist
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

        // When: We request rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get NOT_FOUND error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("No game found with ID");
          expect(result.error).toContain("999999");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: Token fetch succeeds but IGDB API fails
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

        // When: We request rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch game aggregated rating"
          );
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We request rating
        const result = await service.getGameAggregatedRating(params);

        // Then: We get INTERNAL_ERROR
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
        // Given: A valid game ID and mocked IGDB response
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

        // When: We fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get successful response with completion time data
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
        // Given: Valid game ID but no completion time data in IGDB
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

        // When: We fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get successful response with null completion times
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.completionTimes).toBeNull();
        }
      });

      it("should handle partial completion time data", async () => {
        // Given: Completion time data with only main gameplay time
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

        // When: We fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get successful response with partial data
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
        // Given: Invalid game ID (null)
        const params = { gameId: null as unknown as number };

        // When: We attempt to fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        // Given: Invalid game ID (undefined)
        const params = { gameId: undefined as unknown as number };

        // When: We attempt to fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: Invalid game ID (0)
        const params = { gameId: 0 };

        // When: We attempt to fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: Invalid game ID (negative)
        const params = { gameId: -100 };

        // When: We attempt to fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: IGDB API is experiencing errors
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

        // When: We attempt to fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch game completion times"
          );
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We attempt to fetch completion times
        const result = await service.getGameCompletionTimes(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getGameExpansions", () => {
    describe("when service returns", () => {
      it("should return expansions when valid game ID is provided", async () => {
        // Given: A valid game ID and mocked IGDB response with expansions
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 1234,
            expansions: [
              {
                id: 5000,
                name: "The Witcher 3: Blood and Wine",
                cover: {
                  id: 1,
                  image_id: "co1abc",
                  url: "//images.igdb.com/igdb/image/upload/t_thumb/co1abc.jpg",
                },
                release_dates: [
                  {
                    id: 1,
                    human: "May 31, 2016",
                    platform: {
                      id: 6,
                      name: "PC (Microsoft Windows)",
                      human: "May 31, 2016",
                    },
                  },
                ],
              },
              {
                id: 5001,
                name: "The Witcher 3: Hearts of Stone",
                cover: {
                  id: 2,
                  image_id: "co1xyz",
                  url: "//images.igdb.com/igdb/image/upload/t_thumb/co1xyz.jpg",
                },
                release_dates: [],
              },
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

        // When: We request game expansions
        const result = await service.getGameExpansions(params);

        // Then: We get a successful response with expansions
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toHaveLength(2);
          expect(result.data.expansions[0].id).toBe(5000);
          expect(result.data.expansions[0].name).toBe(
            "The Witcher 3: Blood and Wine"
          );
          expect(result.data.expansions[0].cover.image_id).toBe("co1abc");
          expect(result.data.expansions[1].id).toBe(5001);
          expect(result.data.expansions[1].name).toBe(
            "The Witcher 3: Hearts of Stone"
          );
        }
      });

      it("should handle empty response (game has no expansions) gracefully", async () => {
        // Given: Game has no expansions
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 1234,
            expansions: [],
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

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toEqual([]);
        }
      });

      it("should handle response without expansions field", async () => {
        // Given: API response without expansions field
        const params = { gameId: 1234 };
        const mockResponse = [
          {
            id: 1234,
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

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toEqual([]);
        }
      });

      it("should handle API returning empty array (game not found)", async () => {
        // Given: Game doesn't exist
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

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get successful response with empty array (NOT an error)
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        // Given: Invalid game ID (null)
        const params = { gameId: null as unknown as number };

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        // Given: Invalid game ID (undefined)
        const params = { gameId: undefined as unknown as number };

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: Invalid game ID (0)
        const params = { gameId: 0 };

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: Invalid game ID (negative)
        const params = { gameId: -100 };

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: IGDB API error
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

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch game expansions");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We request expansions
        const result = await service.getGameExpansions(params);

        // Then: We get INTERNAL_ERROR
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
        // Given: A valid game ID and mocked artwork response
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

        // When: We fetch game artworks
        const result = await service.getGameArtworks(params);

        // Then: We get successful response with artworks
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.artworks).toHaveLength(2);
          expect(result.data.artworks[0].image_id).toBe("abc123");
          expect(result.data.artworks[0].game).toBe(1234);
          expect(result.data.artworks[1].image_id).toBe("def456");
        }
      });

      it("should return empty array when game has no artworks", async () => {
        // Given: A valid game ID but no artworks
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

        // When: We fetch game artworks
        const result = await service.getGameArtworks(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.artworks).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        // Given: Invalid game ID
        const params = { gameId: null as any };

        // When: We attempt to fetch artworks
        const result = await service.getGameArtworks(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        // Given: Invalid game ID (0)
        const params = { gameId: 0 };

        // When: We attempt to fetch artworks
        const result = await service.getGameArtworks(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        // Given: Invalid game ID (negative)
        const params = { gameId: -100 };

        // When: We attempt to fetch artworks
        const result = await service.getGameArtworks(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        // Given: IGDB API is experiencing errors
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

        // When: We attempt to fetch artworks
        const result = await service.getGameArtworks(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We attempt to fetch artworks
        const result = await service.getGameArtworks(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
  });

  describe("getFranchiseGames", () => {
    describe("when service returns", () => {
      it("should return franchise games when valid franchise ID is provided", async () => {
        // Given: A valid franchise ID and mocked IGDB response
        const params = { franchiseId: 123 };
        const mockResponse = [
          {
            id: 123,
            name: "The Legend of Zelda",
            games: [
              {
                id: 1,
                name: "The Legend of Zelda: Breath of the Wild",
                cover: { id: 10, image_id: "cover1" },
                game_type: 0,
              },
              {
                id: 2,
                name: "The Legend of Zelda: Tears of the Kingdom",
                cover: { id: 11, image_id: "cover2" },
                game_type: 0,
              },
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

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get a successful response with franchise games
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(2);
          expect(result.data.games[0].id).toBe(1);
          expect(result.data.games[0].name).toBe(
            "The Legend of Zelda: Breath of the Wild"
          );
          expect(result.data.games[1].id).toBe(2);
          expect(result.data.games[1].name).toBe(
            "The Legend of Zelda: Tears of the Kingdom"
          );
        }
      });

      it("should handle empty response (no games in franchise) gracefully", async () => {
        // Given: A valid franchise ID but no games
        const params = { franchiseId: 999 };
        const mockResponse = [
          {
            id: 999,
            name: "Empty Franchise",
            games: [],
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

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
        }
      });

      it("should handle response without games field gracefully", async () => {
        // Given: A valid franchise ID but response has no games field
        const params = { franchiseId: 888 };
        const mockResponse = [
          {
            id: 888,
            name: "Franchise without games",
            // No games field
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

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
        }
      });

      it("should handle API returning empty array", async () => {
        // Given: API returns empty array (franchise not found)
        const params = { franchiseId: 777 };

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

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when franchise ID is null", async () => {
        // Given: An invalid franchise ID (null)
        const params = { franchiseId: null as any };

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when franchise ID is undefined", async () => {
        // Given: An invalid franchise ID (undefined)
        const params = { franchiseId: undefined as any };

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when franchise ID is zero", async () => {
        // Given: An invalid franchise ID (0)
        const params = { franchiseId: 0 };

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when franchise ID is negative", async () => {
        // Given: An invalid franchise ID (negative)
        const params = { franchiseId: -100 };

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        // Given: IGDB API error
        const params = { franchiseId: 123 };

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

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch franchise games");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Token fetch fails
        const params = { franchiseId: 123 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when API returns undefined", async () => {
        // Given: API returns undefined (error occurred in makeRequest)
        const params = { franchiseId: 456 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => undefined,
        });

        // When: We call getFranchiseGames
        const result = await service.getFranchiseGames(params);

        // Then: We get INTERNAL_ERROR (undefined response means API error)
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch franchise games");
        }
      });
    });
  });

  describe("getUpcomingReleasesByIds", () => {
    describe("when service returns", () => {
      it("should return upcoming releases when valid game IDs are provided", async () => {
        // Given: Array of valid game IDs and mocked release data
        const params = { ids: [1234, 5678, 9012] };
        const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30; // 30 days from now
        const mockReleases = [
          {
            id: 1234,
            name: "Future Game 1",
            cover: { id: 1, image_id: "cover1" },
            first_release_date: futureTimestamp,
            release_dates: [
              {
                id: 1,
                human: "2025-Q4",
                platform: { id: 6, name: "PC", human: "2025-Q4" },
              },
            ],
          },
          {
            id: 5678,
            name: "Future Game 2",
            cover: { id: 2, image_id: "cover2" },
            first_release_date: futureTimestamp + 86400 * 15,
            release_dates: [
              {
                id: 2,
                human: "2026-Q1",
                platform: { id: 48, name: "PlayStation 5", human: "2026-Q1" },
              },
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
          json: async () => mockReleases,
        });

        // When: We fetch upcoming releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get successful response with releases
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.releases).toHaveLength(2);
          expect(result.data.releases[0].id).toBe(1234);
          expect(result.data.releases[0].name).toBe("Future Game 1");
          expect(result.data.releases[1].id).toBe(5678);
          expect(result.data.releases[1].name).toBe("Future Game 2");
        }
      });

      it("should return empty array when no upcoming releases found", async () => {
        // Given: Valid game IDs but no upcoming releases
        const params = { ids: [1234, 5678] };

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

        // When: We fetch upcoming releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.releases).toEqual([]);
        }
      });

      it("should handle single game ID", async () => {
        // Given: Single game ID
        const params = { ids: [1234] };
        const futureTimestamp = Math.floor(Date.now() / 1000) + 86400 * 30;
        const mockReleases = [
          {
            id: 1234,
            name: "Future Game",
            cover: { id: 1, image_id: "cover1" },
            first_release_date: futureTimestamp,
            release_dates: [],
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
          json: async () => mockReleases,
        });

        // When: We fetch upcoming releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get successful response
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.releases).toHaveLength(1);
          expect(result.data.releases[0].id).toBe(1234);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when IDs array is empty", async () => {
        // Given: Empty array of IDs
        const params = { ids: [] };

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("At least one game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when ids is undefined", async () => {
        // Given: Undefined ids
        const params = { ids: undefined as unknown as number[] };

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("At least one game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when any ID is invalid (0)", async () => {
        // Given: Array with invalid ID (0)
        const params = { ids: [1234, 0, 5678] };

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("valid positive integers");
        }
      });

      it("should return VALIDATION_ERROR when any ID is negative", async () => {
        // Given: Array with negative ID
        const params = { ids: [1234, -100, 5678] };

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("valid positive integers");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        // Given: Valid IDs but API failure
        const params = { ids: [1234, 5678] };

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

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch upcoming releases");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: Valid IDs but token fetch fails
        const params = { ids: [1234, 5678] };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when API returns undefined", async () => {
        // Given: Valid IDs but API returns undefined
        const params = { ids: [1234, 5678] };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => undefined,
        });

        // When: We attempt to fetch releases
        const result = await service.getUpcomingReleasesByIds(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch upcoming releases");
        }
      });
    });
  });

  describe("getUpcomingGamingEvents", () => {
    describe("when service returns", () => {
      it("should return upcoming events when API call succeeds", async () => {
        // Given: IGDB API returns upcoming gaming events
        const futureTimestamp = Math.floor(Date.now() / 1000) + 86400; // Tomorrow
        const mockEvents = [
          {
            id: 1,
            name: "Summer Game Fest 2025",
            start_time: futureTimestamp,
            end_time: futureTimestamp + 7200,
            checksum: "abc123",
            created_at: 1609459200,
            description: "Annual gaming event",
            event_logo: { id: 100 },
            event_networks: [1, 2, 3],
            games: [1000, 1001],
            live_stream_url: "https://example.com/stream",
            slug: "summer-game-fest-2025",
            time_zone: "America/Los_Angeles",
            updated_at: 1609459300,
            videos: [1, 2],
          },
          {
            id: 2,
            name: "E3 2025",
            start_time: futureTimestamp + 86400,
            end_time: futureTimestamp + 86400 + 7200,
            checksum: "def456",
            created_at: 1609459400,
            description: "Electronic Entertainment Expo",
            event_logo: 101,
            event_networks: [4, 5],
            games: [2000, 2001, 2002],
            slug: "e3-2025",
            time_zone: "America/Los_Angeles",
            updated_at: 1609459500,
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
          json: async () => mockEvents,
        });

        // When: We fetch upcoming gaming events
        const result = await service.getUpcomingGamingEvents();

        // Then: We get successful response with events
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.events).toHaveLength(2);
          expect(result.data.events[0].name).toBe("Summer Game Fest 2025");
          expect(result.data.events[0].start_time).toBe(futureTimestamp);
          expect(result.data.events[1].name).toBe("E3 2025");
          expect(result.data.events[1].start_time).toBe(
            futureTimestamp + 86400
          );
        }
      });

      it("should return empty array when no upcoming events exist", async () => {
        // Given: IGDB API returns empty array
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

        // When: We fetch upcoming gaming events
        const result = await service.getUpcomingGamingEvents();

        // Then: We get successful response with empty array
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.events).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        // Given: IGDB API is experiencing errors
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

        // When: We attempt to fetch events
        const result = await service.getUpcomingGamingEvents();

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch upcoming gaming events"
          );
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        // Given: OAuth token endpoint is unavailable
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        // When: We attempt to fetch events
        const result = await service.getUpcomingGamingEvents();

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when API returns undefined", async () => {
        // Given: API request fails and returns undefined
        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => undefined,
        });

        // When: We attempt to fetch events
        const result = await service.getUpcomingGamingEvents();

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain(
            "Failed to fetch upcoming gaming events"
          );
        }
      });
    });
  });

  describe("getEventLogo", () => {
    describe("when service returns", () => {
      it("should return event logo when valid logo ID is provided", async () => {
        // Given: A valid event logo ID and mocked IGDB response
        const params = { logoId: 12345 };
        const mockLogo = {
          id: 12345,
          width: 800,
          height: 400,
          image_id: "event_logo_abc123",
        };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [mockLogo],
        });

        // When: We fetch the event logo
        const result = await service.getEventLogo(params);

        // Then: We get a successful response with the logo
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.logo.id).toBe(12345);
          expect(result.data.logo.width).toBe(800);
          expect(result.data.logo.height).toBe(400);
          expect(result.data.logo.image_id).toBe("event_logo_abc123");
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when logo ID is null", async () => {
        // Given: An invalid logo ID
        const params = { logoId: null as unknown as number };

        // When: We attempt to fetch the logo
        const result = await service.getEventLogo(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid event logo ID is required");
        }
      });

      it("should return VALIDATION_ERROR when logo ID is zero or negative", async () => {
        // Given: An invalid logo ID (zero)
        const params = { logoId: 0 };

        // When: We attempt to fetch the logo
        const result = await service.getEventLogo(params);

        // Then: We get VALIDATION_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid event logo ID is required");
        }
      });

      it("should return NOT_FOUND when logo does not exist", async () => {
        // Given: A valid logo ID but no match in IGDB
        const params = { logoId: 999999 };

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        });

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [], // Empty response
        });

        // When: We attempt to fetch the logo
        const result = await service.getEventLogo(params);

        // Then: We get NOT_FOUND error
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("Event logo with ID 999999 not found");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        // Given: IGDB API is experiencing errors
        const params = { logoId: 12345 };

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

        // When: We attempt to fetch the logo
        const result = await service.getEventLogo(params);

        // Then: We get INTERNAL_ERROR
        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch event logo");
        }
      });
    });
  });
});
