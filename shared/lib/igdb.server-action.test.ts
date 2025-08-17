import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  type Artwork,
  type DLCAndExpansionListResponse,
  type FranchiseGamesResponse,
  type FullGameInfoResponse,
  type GenresResponse,
  type IgdbGameResponseItem,
  type RatedGameResponse,
  type SearchResponse,
  type TimeToBeatsResponse,
  type TwitchTokenResponse,
  type UpcomingEventsResponse,
  type UpcomingReleaseResponse,
} from "@/shared/types";

import igdbApi from "./igdb";

// Mock the env module before any imports
vi.mock("@/env.mjs", () => ({
  env: {
    IGDB_CLIENT_ID: "test-client-id",
    IGDB_CLIENT_SECRET: "test-client-secret",
  },
}));

// Mock fetch since it's not mocked in global setup
const mockFetch = vi.fn();
Object.defineProperty(global, "fetch", {
  value: mockFetch,
  writable: true,
});

describe("igdbApi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset token state
    igdbApi.token = null;
    igdbApi.tokenExpiry = 0;
  });

  describe("fetchToken", () => {
    it("should fetch and store token successfully", async () => {
      const mockToken: TwitchTokenResponse = {
        access_token: "test-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockToken),
      });

      const result = await igdbApi.fetchToken();

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("https://id.twitch.tv/oauth2/token"),
        { cache: "no-store", method: "POST" }
      );
      expect(result).toEqual(mockToken);
      expect(igdbApi.token).toEqual(mockToken);
    });

    it("should handle fetch token error", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Unauthorized",
      });

      const result = await igdbApi.fetchToken();

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getToken", () => {
    it("should return existing valid token", async () => {
      const mockToken: TwitchTokenResponse = {
        access_token: "existing-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      igdbApi.token = mockToken;
      igdbApi.tokenExpiry = Math.floor(Date.now() / 1000) + 3600;

      const result = await igdbApi.getToken();

      expect(result).toBe("existing-token");
      expect(mockFetch).not.toHaveBeenCalled();
    });

    it("should fetch new token when expired", async () => {
      const newToken: TwitchTokenResponse = {
        access_token: "new-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      igdbApi.tokenExpiry = Math.floor(Date.now() / 1000) - 100; // Expired

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(newToken),
      });

      const result = await igdbApi.getToken();

      expect(result).toBe("new-token");
      expect(mockFetch).toHaveBeenCalled();
    });
  });

  describe("request", () => {
    it("should make successful API request", async () => {
      const mockData = [{ id: 1, name: "Test Game" }];
      const mockToken: TwitchTokenResponse = {
        access_token: "test-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      igdbApi.token = mockToken;
      igdbApi.tokenExpiry = Math.floor(Date.now() / 1000) + 3600;

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockData),
      });

      const result = await igdbApi.request({
        resource: "/games",
        body: "fields name;",
      });

      expect(mockFetch).toHaveBeenCalledWith(
        "https://api.igdb.com/v4/games",

        expect.objectContaining({
          method: "POST",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          headers: expect.objectContaining({
            Accept: "application/json",
            Authorization: "Bearer test-token",
            // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
            "Client-ID": expect.any(String),
          }),
          body: "fields name;",
        })
      );
      expect(result).toEqual(mockData);
    });

    it("should handle request error", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});
      const mockToken: TwitchTokenResponse = {
        access_token: "test-token",
        expires_in: 3600,
        token_type: "Bearer",
      };

      igdbApi.token = mockToken;
      igdbApi.tokenExpiry = Math.floor(Date.now() / 1000) + 3600;

      mockFetch.mockResolvedValueOnce({
        ok: false,
        statusText: "Bad Request",
      });

      const result = await igdbApi.request({
        resource: "/games",
        body: "invalid query",
      });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it("should handle missing token", async () => {
      const consoleSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      igdbApi.token = null;

      const result = await igdbApi.request({
        resource: "/games",
        body: "fields name;",
      });

      expect(result).toBeUndefined();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });
  });

  describe("getEventLogo", () => {
    it("should fetch event logo successfully", async () => {
      const mockResponse = [
        { id: 1, image_id: "logo123", width: 100, height: 50 },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getEventLogo(123);

      expect(result).toEqual(mockResponse);
      expectRequestCall("/event_logos", expect.stringContaining("id = (123)"));
    });
  });

  describe("getGamesByRating", () => {
    it("should fetch highly rated games", async () => {
      const mockGames: RatedGameResponse[] = [
        {
          id: 1,
          name: "Great Game",
          cover: { id: 1, image_id: "cover123" },
        },
      ];
      setupMockRequest(mockGames);

      const result = await igdbApi.getGamesByRating();

      expect(result).toEqual(mockGames);
      expectRequestCall("/games", expect.stringContaining("aggregated_rating"));
    });
  });

  describe("getEvents", () => {
    it("should fetch upcoming events", async () => {
      const mockEvents: UpcomingEventsResponse = [
        {
          id: 1,
          name: "Game Event",
          checksum: "abc123",
          created_at: 1234567890,
          start_time: 1234567890,
          end_time: 1234567891,
          event_logo: 1,
          event_networks: [1, 2],
          slug: "game-event",
          time_zone: "UTC",
          updated_at: 1234567890,
        },
      ];
      setupMockRequest(mockEvents);

      const result = await igdbApi.getEvents();

      expect(result).toEqual(mockEvents);
      expectRequestCall("/events", expect.stringContaining("start_time"));
    });
  });

  describe("getGameById", () => {
    it("should fetch game by ID", async () => {
      const mockGame: FullGameInfoResponse = {
        id: 123,
        name: "Test Game",
        summary: "A test game",
        aggregated_rating: 85,
        cover: { id: 1, image_id: "cover123" },
        genres: [{ id: 1, name: "Action" }],
        screenshots: [{ id: 1, image_id: "screen123" }],
        release_dates: [],
        involved_companies: [],
        game_engines: [],
        game_modes: [],
        player_perspectives: [],
        similar_games: [],
        themes: [],
        websites: [],
        external_games: [],
        franchises: [],
      };
      setupMockRequest([mockGame]);

      const result = await igdbApi.getGameById(123);

      expect(result).toEqual(mockGame);
      expectRequestCall("/games", expect.stringContaining("id = (123)"));
    });

    it("should return undefined for null gameId", async () => {
      const result = await igdbApi.getGameById(null);
      expect(result).toBeUndefined();
    });

    it("should return undefined for empty response", async () => {
      setupMockRequest([]);

      const result = await igdbApi.getGameById(123);

      expect(result).toBeUndefined();
    });
  });

  describe("getGameScreenshots", () => {
    it("should fetch game screenshots", async () => {
      const mockResponse = [
        {
          id: 123,
          screenshots: [{ id: 1, image_id: "screen123" }],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameScreenshots(123);

      expect(result).toEqual(mockResponse[0]);
      expectRequestCall("/games", expect.stringContaining("screenshots"));
    });

    it("should return empty for null gameId", async () => {
      const result = await igdbApi.getGameScreenshots(null);
      expect(result).toEqual({ id: 0, screenshots: [] });
    });

    it("should return empty for undefined gameId", async () => {
      const result = await igdbApi.getGameScreenshots(undefined);
      expect(result).toEqual({ id: 0, screenshots: [] });
    });
  });

  describe("getGameRating", () => {
    it("should fetch game rating", async () => {
      const mockResponse = [{ id: 123, aggregated_rating: 85 }];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameRating(123);

      expect(result).toEqual(mockResponse[0]);
    });

    it("should return null values for null gameId", async () => {
      const result = await igdbApi.getGameRating(null);
      expect(result).toEqual({ id: null, aggregated_rating: null });
    });
  });

  describe("getSimilarGames", () => {
    it("should fetch similar games", async () => {
      const mockResponse = [
        {
          id: 123,
          similar_games: [
            {
              id: 456,
              name: "Similar Game",
              cover: { id: 1, image_id: "cover456" },
              release_dates: [],
              first_release_date: 1234567890,
            },
          ],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getSimilarGames(123);

      expect(result).toEqual(mockResponse[0]);
    });

    it("should return empty for null gameId", async () => {
      const result = await igdbApi.getSimilarGames(null);
      expect(result).toEqual({ id: null, similar_games: [] });
    });
  });

  describe("getGameGenres", () => {
    it("should fetch game genres", async () => {
      const mockResponse: GenresResponse[] = [
        { id: 123, genres: [{ id: 1, name: "Action" }] },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameGenres(123);

      expect(result).toEqual(mockResponse);
    });

    it("should return empty array for null gameId", async () => {
      const result = await igdbApi.getGameGenres(null);
      expect(result).toEqual([]);
    });
  });

  describe("getNextMonthReleases", () => {
    it("should fetch upcoming releases", async () => {
      const mockResponse: UpcomingReleaseResponse[] = [
        {
          id: 123,
          name: "Upcoming Game",
          cover: { id: 1, image_id: "cover123" },
          first_release_date: 1234567890,
          release_dates: [],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getNextMonthReleases([123, 456]);

      expect(result).toEqual(mockResponse);
      expectRequestCall("/games", expect.stringContaining("123,456"));
    });

    it("should return empty array for empty ids", async () => {
      const result = await igdbApi.getNextMonthReleases([]);
      expect(result).toEqual([]);
    });
  });

  describe("getPlatforms", () => {
    it("should fetch platforms", async () => {
      const mockResponse = [
        { id: 1, name: "PC" },
        { id: 2, name: "PlayStation 5" },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getPlatforms();

      expect(result).toEqual(mockResponse);
      expectRequestCall("/platforms", expect.stringContaining("fields name"));
    });
  });

  describe("search", () => {
    it("should search games successfully", async () => {
      const mockResponse: SearchResponse[] = [
        {
          id: 123,
          name: "Search Result",
          cover: { id: 1, image_id: "cover123" },
          first_release_date: 1234567890,
          platforms: [{ id: 1, name: "PC" }],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.search({ name: "Test Game" });

      expect(result).toEqual(mockResponse);
      expectRequestCall("/games", expect.stringContaining("test game"));
    });

    it("should return undefined for empty name", async () => {
      const result = await igdbApi.search({ name: null });
      expect(result).toBeUndefined();
    });

    it("should handle search with filters", async () => {
      const mockResponse: SearchResponse[] = [];
      setupMockRequest(mockResponse);

      await igdbApi.search({
        name: "Test",
        fields: { platform: "6" },
      });

      expectRequestCall("/games", expect.stringContaining("platforms = (6)"));
    });
  });

  describe("getArtworks", () => {
    it("should fetch game artworks", async () => {
      const mockResponse: Artwork[] = [
        {
          id: 1,
          alpha_channel: false,
          animated: false,
          game: 123,
          height: 1080,
          image_id: "art123",
          url: "https://example.com/art.jpg",
          width: 1920,
          checksum: "abc123",
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getArtworks(123);

      expect(result).toEqual(mockResponse);
      expectRequestCall("/artworks", expect.stringContaining("game = 123"));
    });
  });

  describe("getPlatformId", () => {
    it("should search platform by name", async () => {
      const mockResponse = {
        platformId: [{ id: 6, name: "PC (Microsoft Windows)" }],
      };
      setupMockRequest(mockResponse);

      const result = await igdbApi.getPlatformId("PC");

      expect(result).toEqual(mockResponse);
      expectRequestCall("/platforms", expect.stringContaining("PC"));
    });
  });

  describe("getGameByName", () => {
    it("should search game by name", async () => {
      const mockResponse: IgdbGameResponseItem[] = [
        {
          id: 123,
          name: "Test Game",
          version_title: "Standard Edition",
          cover: {
            id: 1,
            image_id: "cover123",
            url: "https://example.com/cover.jpg",
          },
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameByName("Test Game");

      expect(result).toEqual(mockResponse);
      expectRequestCall("/games", expect.stringContaining("Test Game"));
    });
  });

  describe("getGameTimeToBeats", () => {
    it("should fetch game completion times", async () => {
      const mockResponse: TimeToBeatsResponse[] = [
        {
          id: 1,
          hastily: 8,
          normally: 12,
          completely: 20,
          count: 100,
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameTimeToBeats(123);

      expect(result).toEqual(mockResponse);
      expectRequestCall(
        "/game_time_to_beats",
        expect.stringContaining("game_id = 123")
      );
    });
  });

  describe("getGameDLCsAndExpansions", () => {
    it("should fetch game DLCs and expansions", async () => {
      const mockResponse: DLCAndExpansionListResponse[] = [
        {
          id: 123,
          expansions: [
            {
              id: 456,
              name: "Test Expansion",
              cover: {
                id: 1,
                image_id: "expansion123",
                url: "https://example.com/expansion.jpg",
              },
              release_dates: [],
            },
          ],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameDLCsAndExpansions(123);

      expect(result).toEqual(mockResponse);
      expectRequestCall("/games", expect.stringContaining("expansions"));
    });
  });

  describe("getGameFranchiseGames", () => {
    it("should fetch franchise games", async () => {
      const mockResponse: FranchiseGamesResponse[] = [
        {
          id: 123,
          name: "Test Franchise",
          games: [
            {
              id: 456,
              name: "Franchise Game",
              cover: {
                id: 1,
                image_id: "franchise123",
                url: "https://example.com/franchise.jpg",
              },
              game_type: 0,
            },
          ],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameFranchiseGames(123);

      expect(result).toEqual(mockResponse);
      expectRequestCall("/franchises", expect.stringContaining("id = 123"));
    });
  });

  describe("getGameBySteamAppId", () => {
    it("should fetch game by Steam App ID", async () => {
      const mockResponse: FullGameInfoResponse[] = [
        {
          id: 123,
          name: "Steam Game",
          summary: "",
          aggregated_rating: 0,
          cover: { id: 1, image_id: "steam123" },
          genres: [],
          screenshots: [],
          release_dates: [],
          involved_companies: [],
          game_engines: [],
          game_modes: [],
          player_perspectives: [],
          similar_games: [],
          themes: [],
          websites: [],
          external_games: [],
          franchises: [],
        },
      ];
      setupMockRequest(mockResponse);

      const result = await igdbApi.getGameBySteamAppId(12345);

      expect(result).toEqual(mockResponse[0]);
      expectRequestCall(
        "/games",
        expect.stringContaining("https://store.steampowered.com/app/12345")
      );
    });

    it("should return undefined for null steamAppId", async () => {
      const result = await igdbApi.getGameBySteamAppId(0);
      expect(result).toBeUndefined();
    });
  });

  // Helper functions
  function setupMockRequest(responseData: unknown) {
    const mockToken: TwitchTokenResponse = {
      access_token: "test-token",
      expires_in: 3600,
      token_type: "Bearer",
    };

    igdbApi.token = mockToken;
    igdbApi.tokenExpiry = Math.floor(Date.now() / 1000) + 3600;

    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve(responseData),
    });
  }

  function expectRequestCall(resource: string, bodyMatcher: unknown) {
    expect(mockFetch).toHaveBeenCalledWith(
      `https://api.igdb.com/v4${resource}`,

      expect.objectContaining({
        method: "POST",
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        headers: expect.objectContaining({
          Accept: "application/json",
          Authorization: "Bearer test-token",
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          "Client-ID": expect.any(String),
        }),
        body: bodyMatcher,
      })
    );
  }
});
