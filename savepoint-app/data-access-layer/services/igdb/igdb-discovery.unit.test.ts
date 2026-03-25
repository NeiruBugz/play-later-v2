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

  describe("getSimilarGames", () => {
    describe("when service returns", () => {
      it("should return similar games when valid game ID is provided", async () => {
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

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.similarGames).toBeDefined();
          expect(Array.isArray(result.data.similarGames)).toBe(true);
          expect(result.data.similarGames).toEqual([5000, 5001, 5002, 5003]);
          expect(result.data.similarGames).toHaveLength(4);
        }
      });

      it("should handle empty response gracefully (game has no similar games)", async () => {
        const params = { gameId: 9999 };
        const mockResponse = [
          {
            id: 9999,
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

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.similarGames).toEqual([]);
        }
      });

      it("should handle game not found in response", async () => {
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

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.similarGames).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as unknown as number };

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        const params = { gameId: undefined as unknown as number };

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getSimilarGames(params);

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

        const result = await service.getSimilarGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch similar games");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getSimilarGames(params);

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

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toHaveLength(2);
          expect(result.data.expansions[0].id).toBe(5000);
          expect(result.data.expansions[0].name).toBe(
            "The Witcher 3: Blood and Wine"
          );
          expect(result.data.expansions[0].cover?.image_id).toBe("co1abc");
          expect(result.data.expansions[1].id).toBe(5001);
          expect(result.data.expansions[1].name).toBe(
            "The Witcher 3: Hearts of Stone"
          );
        }
      });

      it("should handle empty response (game has no expansions) gracefully", async () => {
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

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toEqual([]);
        }
      });

      it("should handle response without expansions field", async () => {
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

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toEqual([]);
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

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.expansions).toEqual([]);
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when game ID is null", async () => {
        const params = { gameId: null as unknown as number };

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is undefined", async () => {
        const params = { gameId: undefined as unknown as number };

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is 0", async () => {
        const params = { gameId: 0 };

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when game ID is negative", async () => {
        const params = { gameId: -100 };

        const result = await service.getGameExpansions(params);

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

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch game expansions");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { gameId: 1234 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getGameExpansions(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });
    });
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

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(2);
          expect(result.data.games[0].id).toBe(1);
          expect(result.data.games[0].name).toBe(
            "The Legend of Zelda: Breath of the Wild"
          );
          expect(result.data.games[0].slug).toBe(
            "the-legend-of-zelda-breath-of-the-wild"
          );
          expect(result.data.games[1].id).toBe(2);
          expect(result.data.games[1].name).toBe(
            "The Legend of Zelda: Tears of the Kingdom"
          );
          expect(result.data.pagination).toEqual({
            total: 2,
            offset: 0,
            limit: 20,
            hasMore: false,
          });
        }
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

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
          expect(result.data.pagination).toEqual({
            total: 0,
            offset: 0,
            limit: 20,
            hasMore: false,
          });
        }
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

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(1);
          expect(result.data.games[0].cover).toBeUndefined();
          expect(result.data.pagination).toEqual({
            total: 1,
            offset: 0,
            limit: 20,
            hasMore: false,
          });
        }
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

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toEqual([]);
          expect(result.data.pagination).toEqual({
            total: 0,
            offset: 0,
            limit: 20,
            hasMore: false,
          });
        }
      });
    });

    describe("when service throws", () => {
      it("should return VALIDATION_ERROR when franchise ID is null", async () => {
        const params = { franchiseId: null as any, currentGameId: 1 };

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when franchise ID is undefined", async () => {
        const params = { franchiseId: undefined as any, currentGameId: 1 };

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when franchise ID is zero", async () => {
        const params = { franchiseId: 0, currentGameId: 1 };

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when franchise ID is negative", async () => {
        const params = { franchiseId: -100, currentGameId: 1 };

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid franchise ID is required");
        }
      });

      it("should return VALIDATION_ERROR when current game ID is null", async () => {
        const params = { franchiseId: 123, currentGameId: null as any };

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid current game ID is required");
        }
      });

      it("should return VALIDATION_ERROR when current game ID is zero", async () => {
        const params = { franchiseId: 123, currentGameId: 0 };

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
          expect(result.error).toContain("Valid current game ID is required");
        }
      });

      it("should return INTERNAL_ERROR when IGDB API returns 500", async () => {
        const params = { franchiseId: 123, currentGameId: 1 };

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

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch franchise games");
        }
      });

      it("should return INTERNAL_ERROR when token fetch fails", async () => {
        const params = { franchiseId: 123, currentGameId: 1 };

        mockFetch.mockRejectedValueOnce(new Error("Network error"));

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
        }
      });

      it("should return INTERNAL_ERROR when API returns undefined", async () => {
        const params = { franchiseId: 456, currentGameId: 1 };

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

        const result = await service.getFranchiseGames(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch franchise games");
        }
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

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.id).toBe(123);
          expect(result.data.name).toBe("The Witcher Collection");
          expect(result.data.games).toHaveLength(2);
          expect(result.data.games[0].name).toBe("The Witcher");
          expect(result.data.games[1].name).toBe("The Witcher 2");
        }
      });

      it("should return NOT_FOUND when collection does not exist", async () => {
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

        const result = await service.getCollectionGamesById(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
          expect(result.error).toBe("Collection not found");
        }
      });

      it("should return VALIDATION_ERROR for invalid collection ID", async () => {
        const params = { collectionId: -1 };

        const result = await service.getCollectionGamesById(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        }
      });
    });

    describe("when service throws", () => {
      it("should return INTERNAL_ERROR when IGDB API fails", async () => {
        const params = { collectionId: 123 };

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

        const result = await service.getCollectionGamesById(params);

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
          expect(result.error).toContain("Failed to fetch collection games");
        }
      });
    });
  });
});
