import { ServiceErrorCode } from "../types";
import { matchSteamGameToIgdb } from "./igdb-matcher";

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

describe("matchSteamGameToIgdb", () => {
  beforeEach(async () => {
    vi.clearAllMocks();
    mockFetch.mockReset();
  });

  describe("validation", () => {
    it("should return VALIDATION_ERROR for empty Steam App ID", async () => {
      const result = await matchSteamGameToIgdb({ steamAppId: "" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Steam App ID is required");
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
      }
    });
  });

  describe("successful match", () => {
    it("should construct correct Steam Store URL and return matched game", async () => {
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
          json: async () => [
            {
              id: 1234,
              name: "Dota 2",
              slug: "dota-2",
              cover: {
                image_id: "co1234",
              },
              game_type: 0,
            },
          ],
        });

      const result = await matchSteamGameToIgdb({ steamAppId: "570" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toBeDefined();
        expect(result.data.game?.id).toBe(1234);
        expect(result.data.game?.name).toBe("Dota 2");
        expect(result.data.game?.slug).toBe("dota-2");
      }

      // Verify correct Steam Store URL construction
      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1];
      expect(secondCall?.[0]).toContain("/games");
      expect(secondCall?.[1]?.body).toContain(
        'where external_games.url = "https://store.steampowered.com/app/570"'
      );
    });

    it("should return null when no match found in IGDB", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => [],
      });

      const result = await matchSteamGameToIgdb({ steamAppId: "999999" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toBeNull();
      }
    });
  });

  describe("error handling", () => {
    it("should return EXTERNAL_SERVICE_ERROR when token fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({}),
      });

      const result = await matchSteamGameToIgdb({ steamAppId: "570" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }
    });

    it("should return EXTERNAL_SERVICE_ERROR when IGDB API fails", async () => {
      mockFetch
        .mockResolvedValueOnce({
          ok: true,
          json: async () => ({
            access_token: "test_token",
            expires_in: 3600,
          }),
        })
        .mockResolvedValueOnce({
          ok: false,
          status: 500,
          statusText: "Internal Server Error",
        });

      const result = await matchSteamGameToIgdb({ steamAppId: "570" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }
    });

    it("should return EXTERNAL_SERVICE_ERROR when response validation fails", async () => {
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
          json: async () => [
            {
              id: 1234,
            },
          ],
        });

      const result = await matchSteamGameToIgdb({ steamAppId: "570" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid response from IGDB");
        expect(result.code).toBe(ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }
    });

    it("should return EXTERNAL_SERVICE_ERROR when fetch throws an error", async () => {
      mockFetch.mockRejectedValueOnce(new Error("Network failure"));

      const result = await matchSteamGameToIgdb({ steamAppId: "570" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
        expect(result.error).toContain("Network failure");
      }
    });

    it("should return IGDB_RATE_LIMITED when API returns 429", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 429,
        statusText: "Too Many Requests",
      });

      const result = await matchSteamGameToIgdb({ steamAppId: "570" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.IGDB_RATE_LIMITED);
        expect(result.error).toBe(
          "IGDB API rate limit exceeded. Please try again in a moment."
        );
      }
    });
  });
});
