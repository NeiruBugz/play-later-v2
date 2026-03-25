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
              slug: "test-game",
              cover: { id: 1, image_id: "cover1" },
              platforms: [{ id: 6, name: "PC" }],
              release_dates: [
                {
                  id: 1,
                  human: "2024",
                  platform: {
                    id: 6,
                    name: "PC",
                    human: "PC (Microsoft Windows)",
                  },
                },
              ],
              first_release_date: 1704067200,
              game_type: 0,
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
              slug: "cyberpunk-2077",
              cover: { id: 1, image_id: "cover1" },
              platforms: [{ id: 6, name: "PC" }],
              release_dates: [
                {
                  id: 1,
                  human: "2020",
                  platform: {
                    id: 6,
                    name: "PC",
                    human: "PC (Microsoft Windows)",
                  },
                },
              ],
              first_release_date: 1607299200,
              game_type: 0,
            },
            {
              id: 2,
              name: "The Witcher 3",
              slug: "the-witcher-3",
              cover: { id: 2, image_id: "cover2" },
              platforms: [
                { id: 6, name: "PC" },
                { id: 48, name: "PlayStation 4" },
              ],
              release_dates: [
                {
                  id: 2,
                  human: "2015",
                  platform: {
                    id: 6,
                    name: "PC",
                    human: "PC (Microsoft Windows)",
                  },
                },
              ],
              first_release_date: 1431993600,
              game_type: 0,
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

        const result = await service.getTopRatedGames();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(3);
          expect(result.data.games[0].name).toBe(
            "The Legend of Zelda: Breath of the Wild"
          );
          expect(result.data.games[0].aggregated_rating).toBe(97.5);
          expect(result.data.games[1].aggregated_rating).toBe(96.2);
          expect(result.data.games[2].aggregated_rating).toBe(95.8);

          expect(result.data.games[0].aggregated_rating!).toBeGreaterThan(
            result.data.games[1].aggregated_rating!
          );
          expect(result.data.games[1].aggregated_rating!).toBeGreaterThan(
            result.data.games[2].aggregated_rating!
          );
        }
      });
      it("should handle empty response gracefully", async () => {
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

        const result = await service.getTopRatedGames();

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
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

        const result = await service.getTopRatedGames();

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch top-rated games");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getTopRatedGames();

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

        const result = await service.searchPlatformByName(params);

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
        const params = { platformName: "" };

        const result = await service.searchPlatformByName(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });

      it("should return NOT_FOUND when no platforms match the search", async () => {
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

        const result = await service.searchPlatformByName(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toContain("No platforms found");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
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

        const result = await service.searchPlatformByName(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to search platforms");
        }
      });

      it("should return VALIDATION_ERROR when platform name is whitespace only", async () => {
        const params = { platformName: "   " };

        const result = await service.searchPlatformByName(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });

      it("should return VALIDATION_ERROR when platform name is null", async () => {
        const params = { platformName: null as unknown as string };

        const result = await service.searchPlatformByName(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });

      it("should return VALIDATION_ERROR when platform name is undefined", async () => {
        const params = { platformName: undefined as unknown as string };

        const result = await service.searchPlatformByName(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Platform name is required");
        }
      });
    });
  });
});
