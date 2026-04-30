import { NotFoundError } from "@/shared/lib/errors";
import {
  __resetLimiterForTests,
  __resetTokenCacheForTests,
} from "@/shared/lib/igdb";

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

  beforeEach(async () => {
    vi.resetAllMocks();
    mockFetch.mockReset();
    __resetTokenCacheForTests();
    await __resetLimiterForTests();
    service = new IgdbService();
  });

  describe("searchGamesByName", () => {
    describe("when service throws", () => {
      it("should throw when game name is empty", async () => {
        await expect(service.searchGamesByName({ name: "" })).rejects.toThrow();
      });

      it("should throw when game name is whitespace-only", async () => {
        await expect(
          service.searchGamesByName({ name: "   " })
        ).rejects.toThrow();
      });

      it("should throw NotFoundError when API returns null", async () => {
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

        await expect(
          service.searchGamesByName({ name: "test game" })
        ).rejects.toThrow(NotFoundError);
      });

      it("should throw NotFoundError when API returns undefined", async () => {
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

        await expect(
          service.searchGamesByName({ name: "test game" })
        ).rejects.toThrow(NotFoundError);
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

          expect(result.games).toEqual([]);
          expect(result.count).toBe(0);
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

          expect(result.games).toEqual(mockGames);
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

          expect(result.games).toEqual(mockGames);
          expect(result.count).toBe(2);
        });
      });
    });
  });
});
