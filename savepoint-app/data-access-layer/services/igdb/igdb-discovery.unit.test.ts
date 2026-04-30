import { ExternalServiceError, NotFoundError } from "@/shared/lib/errors";
import {
  __resetLimiterForTests,
  __resetTokenCacheForTests,
} from "@/shared/lib/igdb";

import { IgdbRateLimitError } from "./errors";
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

  describe("getFranchiseGames", () => {
    describe("when service returns", () => {
      it("should return franchise games when valid franchise ID and current game ID are provided", async () => {
        const params = { franchiseId: 123, currentGameId: 999 };
        const mockResponse = [
          {
            id: 1,
            name: "The Legend of Zelda: Breath of the Wild",
            slug: "the-legend-of-zelda-breath-of-the-wild",
            cover: { image_id: "cover1" },
          },
          {
            id: 2,
            name: "The Legend of Zelda: Tears of the Kingdom",
            slug: "the-legend-of-zelda-tears-of-the-kingdom",
            cover: { image_id: "cover2" },
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

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 1 }, { id: 2 }],
        });

        const result = await service.getFranchiseGames(params);

        expect(result.games).toHaveLength(2);
        expect(result.games[0].id).toBe(1);
        expect(result.games[0].name).toBe(
          "The Legend of Zelda: Breath of the Wild"
        );
        expect(result.games[0].slug).toBe(
          "the-legend-of-zelda-breath-of-the-wild"
        );
        expect(result.games[1].id).toBe(2);
        expect(result.games[1].name).toBe(
          "The Legend of Zelda: Tears of the Kingdom"
        );
        expect(result.pagination).toEqual({
          total: 2,
          offset: 0,
          limit: 20,
          hasMore: false,
        });
      });

      it("should handle empty response (no games in franchise) gracefully", async () => {
        const params = { franchiseId: 999, currentGameId: 1 };

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

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getFranchiseGames(params);

        expect(result.games).toEqual([]);
        expect(result.pagination).toEqual({
          total: 0,
          offset: 0,
          limit: 20,
          hasMore: false,
        });
      });

      it("should handle games without cover images", async () => {
        const params = { franchiseId: 888, currentGameId: 1 };
        const mockResponse = [
          {
            id: 10,
            name: "Game Without Cover",
            slug: "game-without-cover",
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

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [{ id: 10 }],
        });

        const result = await service.getFranchiseGames(params);

        expect(result.games).toHaveLength(1);
        expect(result.games[0].cover).toBeUndefined();
        expect(result.pagination).toEqual({
          total: 1,
          offset: 0,
          limit: 20,
          hasMore: false,
        });
      });

      it("should handle API returning empty array", async () => {
        const params = { franchiseId: 777, currentGameId: 5 };

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

        mockFetch.mockResolvedValueOnce({
          ok: true,
          json: async () => [],
        });

        const result = await service.getFranchiseGames(params);

        expect(result.games).toEqual([]);
        expect(result.pagination).toEqual({
          total: 0,
          offset: 0,
          limit: 20,
          hasMore: false,
        });
      });
    });

    describe("when service throws", () => {
      it("should throw ZodError when franchise ID is null", async () => {
        const params = { franchiseId: null as any, currentGameId: 1 };

        await expect(service.getFranchiseGames(params)).rejects.toThrow();
      });

      it("should throw ZodError when franchise ID is undefined", async () => {
        const params = { franchiseId: undefined as any, currentGameId: 1 };

        await expect(service.getFranchiseGames(params)).rejects.toThrow();
      });

      it("should throw ZodError when franchise ID is zero", async () => {
        const params = { franchiseId: 0, currentGameId: 1 };

        await expect(service.getFranchiseGames(params)).rejects.toThrow();
      });

      it("should throw ZodError when franchise ID is negative", async () => {
        const params = { franchiseId: -100, currentGameId: 1 };

        await expect(service.getFranchiseGames(params)).rejects.toThrow();
      });

      it("should throw ZodError when current game ID is null", async () => {
        const params = { franchiseId: 123, currentGameId: null as any };

        await expect(service.getFranchiseGames(params)).rejects.toThrow();
      });

      it("should throw ZodError when current game ID is zero", async () => {
        const params = { franchiseId: 123, currentGameId: 0 };

        await expect(service.getFranchiseGames(params)).rejects.toThrow();
      });

      it("should throw ExternalServiceError when IGDB API returns 500", async () => {
        const params = { franchiseId: 123, currentGameId: 1 };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          })
          .mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            headers: { get: () => null },
          });

        await expect(service.getFranchiseGames(params)).rejects.toThrow(
          ExternalServiceError
        );
      });

      it("should throw ExternalServiceError when token fetch fails", async () => {
        const params = { franchiseId: 123, currentGameId: 1 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        await expect(service.getFranchiseGames(params)).rejects.toThrow(
          ExternalServiceError
        );
      });

      it("should throw ExternalServiceError when API returns undefined", async () => {
        const params = { franchiseId: 456, currentGameId: 1 };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          })
          .mockResolvedValue({
            ok: true,
            json: async () => undefined,
          });

        await expect(service.getFranchiseGames(params)).rejects.toThrow(
          ExternalServiceError
        );
      });

      it("should throw IgdbRateLimitError when IGDB API returns 429", async () => {
        const params = { franchiseId: 123, currentGameId: 1 };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          })
          .mockResolvedValue({
            ok: false,
            status: 429,
            statusText: "Too Many Requests",
            headers: { get: () => null },
          });

        await expect(service.getFranchiseGames(params)).rejects.toThrow(
          IgdbRateLimitError
        );
      });
    });
  });

  describe("getCollectionGamesById", () => {
    describe("when service returns", () => {
      it("should return collection with games successfully", async () => {
        const params = { collectionId: 123 };
        const mockResponse = [
          {
            id: 123,
            name: "The Witcher Collection",
            games: [
              {
                id: 1,
                name: "The Witcher",
                slug: "the-witcher",
                cover: { image_id: "abc123" },
                game_type: 0,
              },
              {
                id: 2,
                name: "The Witcher 2",
                slug: "the-witcher-2",
                cover: { image_id: "def456" },
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

        const result = await service.getCollectionGamesById(params);

        expect(result.id).toBe(123);
        expect(result.name).toBe("The Witcher Collection");
        expect(result.games).toHaveLength(2);
        expect(result.games[0].name).toBe("The Witcher");
        expect(result.games[1].name).toBe("The Witcher 2");
      });

      it("should throw NotFoundError when collection does not exist", async () => {
        const params = { collectionId: 999999 };

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

        await expect(service.getCollectionGamesById(params)).rejects.toThrow(
          NotFoundError
        );
      });

      it("should throw ZodError for invalid collection ID", async () => {
        const params = { collectionId: -1 };

        await expect(service.getCollectionGamesById(params)).rejects.toThrow();
      });
    });

    describe("when service throws", () => {
      it("should throw ExternalServiceError when IGDB API fails", async () => {
        const params = { collectionId: 123 };

        mockFetch
          .mockResolvedValueOnce({
            ok: true,
            json: async () => ({
              access_token: "test_token",
              expires_in: 3600,
            }),
          })
          .mockResolvedValue({
            ok: false,
            status: 500,
            statusText: "Internal Server Error",
            headers: { get: () => null },
          });

        await expect(service.getCollectionGamesById(params)).rejects.toThrow(
          ExternalServiceError
        );
      });
    });
  });
});
