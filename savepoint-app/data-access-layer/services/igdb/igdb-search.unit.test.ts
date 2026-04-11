import { __resetTokenCacheForTests } from "@/shared/lib/igdb";

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
    __resetTokenCacheForTests();
    service = new IgdbService();
  });

  describe("searchGamesByName", () => {
    describe("when service throws", () => {
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
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => null,
          });
        const result = await service.searchGamesByName({ name: "test game" });

        expect(result.success).toBe(false);
        if ("error" in result) {
          expect(result.error).toBe("Failed to find games");
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        }
      });

      it("should return NOT_FOUND when API returns undefined", async () => {
        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          })
          .mockResolvedValueOnce({
            ok: true,
            json: async () => undefined,
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
});
