/**
 * Integration tests for shared/api/steam/steam-fetch.ts.
 *
 * Mirrors the IGDB low-level client pattern: `vi.stubGlobal("fetch", ...)`,
 * no real network. The integration project is chosen (over unit) because
 * the env-bootstrapped `STEAM_API_KEY` lives in `test/setup/integration.ts`
 * and we want a real env read through `@env` (no `vi.mock("@env", ...)`).
 *
 * Contract:
 *   - fetchOwnedGames(steamId) — calls GetOwnedGames/v1, returns array of
 *     OwnedGame rows. Maps 401/403→UpstreamError, 429→SteamRateLimitError,
 *     5xx→SteamApiUnavailableError; game_count>0 && no games →
 *     SteamProfilePrivateError. Empty (game_count===0) → []. Schema failure
 *     → UpstreamError.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import {
  fetchOwnedGames,
  SteamApiUnavailableError,
  SteamProfilePrivateError,
  SteamRateLimitError,
} from "@/shared/api/steam";
import { UpstreamError } from "@/shared/lib/errors";

const STEAM_ID_64 = "76561198012345678";

function makeFetchResponse(init: {
  ok: boolean;
  status: number;
  statusText?: string;
  json?: unknown;
}): Response {
  return {
    ok: init.ok,
    status: init.status,
    statusText: init.statusText ?? "",
    headers: new Headers(),
    json: async () => init.json,
    text: async () => JSON.stringify(init.json ?? {}),
  } as unknown as Response;
}

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("fetchOwnedGames", () => {
  describe("given the Steam profile has owned games", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            status: 200,
            json: {
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
            },
          })
        )
      );
    });

    it("returns the owned-games list with normalized field names", async () => {
      const games = await fetchOwnedGames(STEAM_ID_64);
      expect(games).toHaveLength(1);
      expect(games[0]).toMatchObject({
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
  });

  describe("given the Steam profile owns zero games", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            status: 200,
            json: { response: { game_count: 0 } },
          })
        )
      );
    });

    it("returns an empty array", async () => {
      const games = await fetchOwnedGames(STEAM_ID_64);
      expect(games).toEqual([]);
    });
  });

  describe("given the Steam profile is private (game_count>0 but no games array)", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            status: 200,
            json: { response: { game_count: 42 } },
          })
        )
      );
    });

    it("throws SteamProfilePrivateError", async () => {
      await expect(fetchOwnedGames(STEAM_ID_64)).rejects.toBeInstanceOf(
        SteamProfilePrivateError
      );
    });
  });

  describe("given Steam returns 429", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: false,
            status: 429,
            statusText: "Too Many",
          })
        )
      );
    });

    it("throws SteamRateLimitError", async () => {
      await expect(fetchOwnedGames(STEAM_ID_64)).rejects.toBeInstanceOf(
        SteamRateLimitError
      );
    });
  });

  describe("given Steam returns 500", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi
          .fn()
          .mockResolvedValue(
            makeFetchResponse({ ok: false, status: 500, statusText: "ISE" })
          )
      );
    });

    it("throws SteamApiUnavailableError", async () => {
      await expect(fetchOwnedGames(STEAM_ID_64)).rejects.toBeInstanceOf(
        SteamApiUnavailableError
      );
    });
  });

  describe("given Steam returns 401", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: false,
            status: 401,
            statusText: "Unauthorized",
          })
        )
      );
    });

    it("throws UpstreamError (key/auth failure)", async () => {
      await expect(fetchOwnedGames(STEAM_ID_64)).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });

  describe("given Steam returns 503", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: false,
            status: 503,
            statusText: "Unavailable",
          })
        )
      );
    });

    it("throws SteamApiUnavailableError", async () => {
      await expect(fetchOwnedGames(STEAM_ID_64)).rejects.toBeInstanceOf(
        SteamApiUnavailableError
      );
    });
  });

  describe("given the response shape is invalid", () => {
    beforeEach(() => {
      vi.stubGlobal(
        "fetch",
        vi.fn().mockResolvedValue(
          makeFetchResponse({
            ok: true,
            status: 200,
            json: { not: "what-we-expect" },
          })
        )
      );
    });

    it("throws UpstreamError (schema validation)", async () => {
      await expect(fetchOwnedGames(STEAM_ID_64)).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });
});
