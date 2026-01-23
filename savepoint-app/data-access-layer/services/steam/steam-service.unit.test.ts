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

import { ServiceErrorCode } from "../types";
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockSteamId64);
      }
    });

    it("should return NOT_FOUND error for non-existent vanity URL", async () => {
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

      const result = await service.resolveVanityURL({
        vanityUrl: "nonexistent",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        expect(result.error).toBe("Steam profile not found");
      }
    });

    it("should return STEAM_API_UNAVAILABLE when Steam API returns 5xx error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(
            { error: "Internal Server Error" },
            { status: 500 }
          );
        })
      );

      const result = await service.resolveVanityURL({
        vanityUrl: mockVanityUrl,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.STEAM_API_UNAVAILABLE);
        expect(result.error).toBe(
          "Steam is temporarily unavailable. Please try again later."
        );
      }
    });

    it("should return STEAM_API_UNAVAILABLE when Steam API request fails (network error)", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.error();
        })
      );

      const result = await service.resolveVanityURL({
        vanityUrl: mockVanityUrl,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.STEAM_API_UNAVAILABLE);
        expect(result.error).toBe(
          "Steam is temporarily unavailable. Please try again later."
        );
      }
    });

    it("should return RATE_LIMITED when Steam API returns 429 error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/ResolveVanityURL/v1/`, () => {
          return HttpResponse.json(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        })
      );

      const result = await service.resolveVanityURL({
        vanityUrl: mockVanityUrl,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.RATE_LIMITED);
        expect(result.error).toBe(
          "Too many requests to Steam. Please wait a moment and try again."
        );
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual({
          steamId64: mockSteamId64,
          displayName: "Test User",
          avatarUrl: "https://avatars.steamstatic.com/test_full.jpg",
          profileUrl: `https://steamcommunity.com/id/${mockVanityUrl}/`,
          isPublic: true,
        });
      }
    });

    it("should return UNAUTHORIZED error for private profile", async () => {
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

      const result = await service.getPlayerSummary({
        steamId64: mockSteamId64,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.STEAM_PROFILE_PRIVATE);
        expect(result.error).toContain(
          "Steam profile game details are set to private"
        );
      }
    });

    it("should return NOT_FOUND error for non-existent Steam ID", async () => {
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

      const result = await service.getPlayerSummary({
        steamId64: "99999999999999999",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
        expect(result.error).toBe("Steam profile not found");
      }
    });

    it("should return STEAM_API_UNAVAILABLE when Steam API returns 5xx error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(
            { error: "Service Unavailable" },
            { status: 503 }
          );
        })
      );

      const result = await service.getPlayerSummary({
        steamId64: mockSteamId64,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.STEAM_API_UNAVAILABLE);
        expect(result.error).toBe(
          "Steam is temporarily unavailable. Please try again later."
        );
      }
    });

    it("should return STEAM_API_UNAVAILABLE when Steam API request fails (network error)", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.error();
        })
      );

      const result = await service.getPlayerSummary({
        steamId64: mockSteamId64,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.STEAM_API_UNAVAILABLE);
        expect(result.error).toBe(
          "Steam is temporarily unavailable. Please try again later."
        );
      }
    });

    it("should return RATE_LIMITED when Steam API returns 429 error", async () => {
      server.use(
        http.get(`${STEAM_API_BASE}/ISteamUser/GetPlayerSummaries/v2/`, () => {
          return HttpResponse.json(
            { error: "Too Many Requests" },
            { status: 429 }
          );
        })
      );

      const result = await service.getPlayerSummary({
        steamId64: mockSteamId64,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.RATE_LIMITED);
        expect(result.error).toBe(
          "Too many requests to Steam. Please wait a moment and try again."
        );
      }
    });
  });

  describe("validateSteamId", () => {
    it("should return Steam ID64 directly if input is 17-digit number", async () => {
      const result = await service.validateSteamId({ input: mockSteamId64 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockSteamId64);
      }
    });

    it("should return Steam ID64 directly if input is 17-digit number with whitespace", async () => {
      const result = await service.validateSteamId({
        input: `  ${mockSteamId64}  `,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockSteamId64);
      }
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

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBe(mockSteamId64);
      }
    });

    it("should return VALIDATION_ERROR for invalid vanity URL", async () => {
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

      const result = await service.validateSteamId({
        input: "invalidvanityurl",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
        expect(result.error).toContain("Invalid Steam ID");
      }
    });

    it("should return VALIDATION_ERROR for input that is not 17 digits", async () => {
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

      const result = await service.validateSteamId({ input: "12345" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
      }
    });

    it("should return VALIDATION_ERROR for empty input after trim", async () => {
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

      const result = await service.validateSteamId({ input: "   " });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.code).toBe(ServiceErrorCode.VALIDATION_ERROR);
      }
    });
  });
});
