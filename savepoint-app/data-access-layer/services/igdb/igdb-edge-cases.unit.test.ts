import { __resetTokenCacheForTests } from "@/shared/lib/igdb";

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

  describe("Sparse Data Handling", () => {
    describe("getGameDetailsBySlug", () => {
      it("should handle game with minimal required fields only", async () => {
        const mockResponse = [
          {
            id: 99999,
            name: "Minimal Data Game",
            slug: "minimal-data-game",
            cover: {
              image_id: "co_minimal",
            },
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
          json: async () => mockResponse,
        });

        const result = await service.getGameDetailsBySlug({
          slug: "minimal-data-game",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.game.id).toBe(99999);
          expect(result.data.game.name).toBe("Minimal Data Game");
          expect(result.data.game.slug).toBe("minimal-data-game");
          expect(result.data.game.aggregated_rating).toBeUndefined();
          expect(result.data.game.genres).toBeUndefined();
          expect(result.data.game.screenshots).toBeUndefined();
          expect(result.data.game.game_modes).toBeUndefined();
          expect(result.data.game.websites).toBeUndefined();
        }
      });

      it("should handle game with sparse data (some optional fields)", async () => {
        const mockResponse = [
          {
            id: 88888,
            name: "Sparse Data Game",
            slug: "sparse-data-game",
            summary: "A game with some missing optional fields",
            cover: {
              image_id: "co_sparse",
            },
            game_type: 0,
            genres: [{ id: 12, name: "Action" }],
            platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
            release_dates: [
              {
                id: 1001,
                human: "2023",
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

        const result = await service.getGameDetailsBySlug({
          slug: "sparse-data-game",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.game.id).toBe(88888);
          expect(result.data.game.genres).toHaveLength(1);
          expect(result.data.game.platforms).toHaveLength(1);
          expect(result.data.game.release_dates).toHaveLength(1);
          expect(result.data.game.release_dates?.[0].platform).toBeUndefined();
          expect(result.data.game.aggregated_rating).toBeUndefined();
          expect(result.data.game.screenshots).toBeUndefined();
          expect(result.data.game.themes).toBeUndefined();
          expect(result.data.game.involved_companies).toBeUndefined();
        }
      });

      it("should handle release dates with missing platform field", async () => {
        const mockResponse = [
          {
            id: 77777,
            name: "Game With Incomplete Release Dates",
            slug: "incomplete-release-dates",
            cover: {
              image_id: "co_test",
            },
            game_type: 0,
            release_dates: [
              {
                id: 1,
                human: "2024",
              },
              {
                id: 2,
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

        const result = await service.getGameDetailsBySlug({
          slug: "incomplete-release-dates",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.game.release_dates).toHaveLength(2);
          expect(result.data.game.release_dates?.[0].human).toBe("2024");
          expect(result.data.game.release_dates?.[0].platform).toBeUndefined();
          expect(result.data.game.release_dates?.[1].human).toBeUndefined();
          expect(result.data.game.release_dates?.[1].platform).toBeUndefined();
        }
      });

      it("should handle similar games without cover images", async () => {
        const mockResponse = [
          {
            id: 1234,
            name: "Test Game",
            slug: "test-game",
            cover: {
              image_id: "co_test",
            },
            game_type: 0,
            similar_games: [
              {
                id: 6000,
                name: "Similar Game Without Cover",
              },
              {
                id: 6001,
                name: "Similar Game Without Release Date",
                cover: {
                  image_id: "co_sim_6001",
                },
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

        const result = await service.getGameDetailsBySlug({
          slug: "test-game",
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.game.similar_games).toHaveLength(2);
          expect(result.data.game.similar_games?.[0].cover).toBeUndefined();
          expect(
            result.data.game.similar_games?.[0].release_dates
          ).toBeUndefined();
          expect(result.data.game.similar_games?.[1].cover).toBeDefined();
          expect(
            result.data.game.similar_games?.[1].release_dates
          ).toBeUndefined();
          expect(
            result.data.game.similar_games?.[1].first_release_date
          ).toBeUndefined();
        }
      });
    });

    describe("searchGamesByName", () => {
      it("should handle search results with missing first_release_date", async () => {
        const mockGames = [
          {
            id: 1,
            name: "Game Without Release Date",
            slug: "no-release-date",
            cover: { image_id: "cover1" },
            game_type: 0,
          },
          {
            id: 2,
            name: "Game With Release Date",
            slug: "with-release-date",
            cover: { image_id: "cover2" },
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

        const result = await service.searchGamesByName({ name: "game" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(2);
          expect(result.data.games[0].first_release_date).toBeUndefined();
          expect(result.data.games[1].first_release_date).toBe(1704067200);
        }
      });

      it("should handle search results with missing platforms", async () => {
        const mockGames = [
          {
            id: 1,
            name: "Game Without Platforms",
            slug: "no-platforms",
            cover: { image_id: "cover1" },
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

        const result = await service.searchGamesByName({ name: "game" });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.games).toHaveLength(1);
          expect(result.data.games[0].platforms).toBeUndefined();
          expect(result.data.games[0].release_dates).toBeUndefined();
        }
      });
    });
  });
});
