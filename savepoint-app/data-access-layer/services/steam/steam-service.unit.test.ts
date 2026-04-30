import { http, HttpResponse } from "msw";
import { setupServer } from "msw/node";
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { NotFoundError } from "@/shared/lib/errors";

import { SteamApiUnavailableError, SteamProfilePrivateError } from "./errors";
import { SteamService } from "./steam-service";
import type {
  SteamPlayerSummariesResponse,
  SteamResolveVanityResponse,
} from "./types";

vi.mock("@/env.mjs", () => ({
  env: {
    STEAM_API_KEY: "test-steam-api-key",
  },
}));

vi.mock("@/shared/lib", () => {
  const mockLogger = {
    info: vi.fn(),
    warn: vi.fn(),
    error: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
  };

  return {
    createLogger: vi.fn(() => mockLogger),
    logger: mockLogger,
    LOGGER_CONTEXT: {
      SERVICE: "service",
    },
  };
});

const STEAM_API_BASE = "https://api.steampowered.com";
const MOCK_API_KEY = "test-steam-api-key";

const mockSteamId64 = "76561198012345678";
const mockVanityUrl = "testuser";

const server = setupServer();

describe("SteamService", () => {
  let service: SteamService;

  beforeAll(() => {
    server.listen({ onUnhandledRequest: "error" });
  });

  afterEach(() => {
    server.resetHandlers();
    vi.resetAllMocks();
  });

  afterAll(() => {
    server.close();
  });

  beforeEach(() => {
    service = new SteamService();
  });

  describe("resolveVanityURL", () => {
    it("should resolve a valid vanity URL to Steam ID64", async () => {
      const mockResponse: SteamResolveVanityResponse = {
        response: {
          success: 1,
          steamid: mockSteamId64,
        },
      };

      server.use(
        http.get(
          `${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`,
          ({ request }) => {
            const url = new URL(request.url);
            const vanityurl = url.searchParams.get("vanityurl");
            const key = url.searchParams.get("key");

            expect(vanityurl).toBe(mockVanityUrl);
            expect(key).toBe(MOCK_API_KEY);

            return HttpResponse.json(mockResponse);
          }
        )
      );

      const result = await service.resolveVanityURL({
        vanityUrl: mockVanityUrl,
      });

      expect(result).toBe(mockSteamId64);
    });

    it("should throw NotFoundError for non-existent vanity URL", async () => {
      const mockResponse: SteamResolveVanityResponse = {
        response: {
          success: 42,
          message: "No match",
        },
      };

      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      await expect(
        service.resolveVanityURL({ vanityUrl: "nonexistent" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw SteamApiUnavailableError when Steam API returns 5xx error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(
        service.resolveVanityURL({ vanityUrl: mockVanityUrl })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should throw SteamApiUnavailableError on network error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        service.resolveVanityURL({ vanityUrl: mockVanityUrl })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should throw SteamApiUnavailableError when Steam API returns 429", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        })
      );

      await expect(
        service.resolveVanityURL({ vanityUrl: mockVanityUrl })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should include rate-limit message when 429", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        })
      );

      await expect(
        service.resolveVanityURL({ vanityUrl: mockVanityUrl })
      ).rejects.toThrow("Too many requests to Steam");
    });
  });

  describe("getPlayerSummary", () => {
    it("should return profile data for public Steam account", async () => {
      const mockResponse: SteamPlayerSummariesResponse = {
        response: {
          players: [
            {
              steamid: mockSteamId64,
              personaname: "Test User",
              profileurl: `https://steamcommunity.com/id/${mockVanityUrl}/`,
              avatarfull: "https://avatars.steamstatic.com/test_full.jpg",
              communityvisibilitystate: 3,
            },
          ],
        },
      };

      server.use(
        http.get(
          `${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`,
          ({ request }) => {
            const url = new URL(request.url);
            const steamids = url.searchParams.get("steamids");
            const key = url.searchParams.get("key");

            expect(steamids).toBe(mockSteamId64);
            expect(key).toBe(MOCK_API_KEY);

            return HttpResponse.json(mockResponse);
          }
        )
      );

      const result = await service.getPlayerSummary({
        steamId64: mockSteamId64,
      });

      expect(result).toEqual({
        steamId64: mockSteamId64,
        displayName: "Test User",
        avatarUrl: "https://avatars.steamstatic.com/test_full.jpg",
        profileUrl: `https://steamcommunity.com/id/${mockVanityUrl}/`,
        isPublic: true,
      });
    });

    it("should throw SteamProfilePrivateError for private profile", async () => {
      const mockResponse: SteamPlayerSummariesResponse = {
        response: {
          players: [
            {
              steamid: mockSteamId64,
              personaname: "Private User",
              profileurl: `https://steamcommunity.com/id/${mockVanityUrl}/`,
              avatarfull: "https://avatars.steamstatic.com/test_full.jpg",
              communityvisibilitystate: 1,
            },
          ],
        },
      };

      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      await expect(
        service.getPlayerSummary({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamProfilePrivateError);
    });

    it("should throw SteamProfilePrivateError with descriptive message for private profile", async () => {
      const mockResponse: SteamPlayerSummariesResponse = {
        response: {
          players: [
            {
              steamid: mockSteamId64,
              personaname: "Private User",
              profileurl: `https://steamcommunity.com/id/${mockVanityUrl}/`,
              avatarfull: "https://avatars.steamstatic.com/test_full.jpg",
              communityvisibilitystate: 1,
            },
          ],
        },
      };

      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      await expect(
        service.getPlayerSummary({ steamId64: mockSteamId64 })
      ).rejects.toThrow("Steam profile game details are set to private");
    });

    it("should throw NotFoundError for non-existent Steam ID", async () => {
      const mockResponse: SteamPlayerSummariesResponse = {
        response: {
          players: [],
        },
      };

      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      await expect(
        service.getPlayerSummary({ steamId64: "99999999999999999" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw SteamApiUnavailableError when Steam API returns 5xx error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(
            { error: "Service Unavailable" },
            { status: 503 }
          );
        })
      );

      await expect(
        service.getPlayerSummary({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should throw SteamApiUnavailableError on network error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        service.getPlayerSummary({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should throw SteamApiUnavailableError when Steam API returns 429", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        })
      );

      await expect(
        service.getPlayerSummary({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamApiUnavailableError);
    });
  });

  describe("validateSteamId", () => {
    it("should return Steam ID64 directly if input is 17-digit number", async () => {
      const result = await service.validateSteamId({ input: mockSteamId64 });

      expect(result).toBe(mockSteamId64);
    });

    it("should return Steam ID64 directly if input is 17-digit number with whitespace", async () => {
      const result = await service.validateSteamId({
        input: `  ${mockSteamId64}  `,
      });

      expect(result).toBe(mockSteamId64);
    });

    it("should resolve vanity URL if input is not Steam ID64", async () => {
      const mockResponse: SteamResolveVanityResponse = {
        response: {
          success: 1,
          steamid: mockSteamId64,
        },
      };

      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      const result = await service.validateSteamId({ input: mockVanityUrl });

      expect(result).toBe(mockSteamId64);
    });

    it("should throw NotFoundError when vanity URL is not found", async () => {
      const mockResponse: SteamResolveVanityResponse = {
        response: {
          success: 42,
          message: "No match",
        },
      };

      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(mockResponse);
        })
      );

      await expect(
        service.validateSteamId({ input: "invalidvanityurl" })
      ).rejects.toThrow(NotFoundError);
    });

    it("should throw SteamApiUnavailableError when Steam API is unavailable", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      await expect(
        service.validateSteamId({ input: mockVanityUrl })
      ).rejects.toThrow(SteamApiUnavailableError);
    });
  });

  describe("getOwnedGames", () => {
    it("should return owned games list", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return HttpResponse.json({
            response: {
              game_count: 1,
              games: [
                {
                  appid: 440,
                  name: "Team Fortress 2",
                  playtime_forever: 120,
                  playtime_windows_forever: 100,
                  playtime_mac_forever: 20,
                  playtime_linux_forever: 0,
                  img_icon_url: "icon.jpg",
                  img_logo_url: "logo.jpg",
                  rtime_last_played: 1704067200,
                },
              ],
            },
          });
        })
      );

      const result = await service.getOwnedGames({ steamId64: mockSteamId64 });

      expect(result).toHaveLength(1);
      expect(result[0]).toMatchObject({
        appId: 440,
        name: "Team Fortress 2",
        playtimeForever: 120,
        playtimeWindows: 100,
        playtimeMac: 20,
        playtimeLinux: 0,
        imgIconUrl: "icon.jpg",
        imgLogoUrl: "logo.jpg",
        rtimeLastPlayed: 1704067200,
      });
    });

    it("should return empty array when user has no games", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return HttpResponse.json({
            response: {
              game_count: 0,
              games: [],
            },
          });
        })
      );

      const result = await service.getOwnedGames({ steamId64: mockSteamId64 });

      expect(result).toHaveLength(0);
    });

    it("should throw SteamProfilePrivateError when game_count > 0 but no games returned", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return HttpResponse.json({
            response: {
              game_count: 5,
            },
          });
        })
      );

      await expect(
        service.getOwnedGames({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamProfilePrivateError);
    });

    it("should throw SteamApiUnavailableError when Steam API returns 5xx", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return new HttpResponse(null, { status: 500 });
        })
      );

      await expect(
        service.getOwnedGames({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should throw SteamApiUnavailableError when Steam API returns 429", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return HttpResponse.json(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        })
      );

      await expect(
        service.getOwnedGames({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamApiUnavailableError);
    });

    it("should throw SteamApiUnavailableError on network error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/IPlayerService/GetOwnedGames/v1/`, () => {
          return HttpResponse.error();
        })
      );

      await expect(
        service.getOwnedGames({ steamId64: mockSteamId64 })
      ).rejects.toThrow(SteamApiUnavailableError);
    });
  });
});
