import { ExternalServiceError } from "@/shared/lib/errors";
import { __resetLimiterForTests } from "@/shared/lib/igdb";

import { IgdbRateLimitError } from "./errors";
import { matchSteamGameToIgdb, resetTokenCache } from "./igdb-matcher";

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
    vi.resetAllMocks();
    mockFetch.mockReset();
    resetTokenCache();
    await __resetLimiterForTests();
  });

  describe("validation", () => {
    it("should throw ZodError for empty Steam App ID", async () => {
      await expect(matchSteamGameToIgdb({ steamAppId: "" })).rejects.toThrow();
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

      expect(result.game).toBeDefined();
      expect(result.game?.id).toBe(1234);
      expect(result.game?.name).toBe("Dota 2");
      expect(result.game?.slug).toBe("dota-2");

      expect(mockFetch).toHaveBeenCalledTimes(2);
      const secondCall = mockFetch.mock.calls[1];
      expect(secondCall?.[0]).toContain("/games");
      expect(secondCall?.[1]?.body).toContain(
        'where external_games.url = "https://store.steampowered.com/app/570"'
      );
    });

    it("should return null when no match found in IGDB", async () => {
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
          json: async () => [],
        });

      const result = await matchSteamGameToIgdb({ steamAppId: "999999" });

      expect(result.game).toBeNull();
    });
  });

  describe("error handling", () => {
    it("should throw ExternalServiceError when token fetch fails", async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        status: 401,
        statusText: "Unauthorized",
        json: async () => ({}),
      });

      await expect(matchSteamGameToIgdb({ steamAppId: "570" })).rejects.toThrow(
        ExternalServiceError
      );
    });

    it("should throw ExternalServiceError when IGDB API fails", async () => {
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

      await expect(matchSteamGameToIgdb({ steamAppId: "570" })).rejects.toThrow(
        ExternalServiceError
      );
    });

    it("should throw ExternalServiceError when response validation fails", async () => {
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

      await expect(matchSteamGameToIgdb({ steamAppId: "570" })).rejects.toThrow(
        ExternalServiceError
      );
    });

    it("should throw ExternalServiceError when fetch throws an error", async () => {
      mockFetch.mockRejectedValue(new Error("Network failure"));

      await expect(matchSteamGameToIgdb({ steamAppId: "570" })).rejects.toThrow(
        ExternalServiceError
      );
    });

    it("should throw IgdbRateLimitError when API returns 429", async () => {
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

      await expect(matchSteamGameToIgdb({ steamAppId: "570" })).rejects.toThrow(
        IgdbRateLimitError
      );
    });

    it("should include rate limit message when API returns 429", async () => {
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

      await expect(matchSteamGameToIgdb({ steamAppId: "570" })).rejects.toThrow(
        "IGDB rate limit exceeded. Please try again later."
      );
    });
  });
});
