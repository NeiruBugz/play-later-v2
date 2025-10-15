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
    describe("Success Cases", () => {
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
    });

    describe("Edge Cases", () => {
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

    describe("Error Cases", () => {
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
});
