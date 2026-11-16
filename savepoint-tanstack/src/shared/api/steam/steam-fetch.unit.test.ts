import { afterEach, describe, expect, it, vi } from "vitest";

import { UpstreamError } from "@/shared/lib/errors";

import { SteamProfilePrivateError } from "./errors";
import { fetchOwnedGames } from "./steam-fetch";

vi.mock("@env", () => ({
  env: { STEAM_API_KEY: "test-steam-key" },
}));

const STEAM_ID_64 = "76561198000000000";

const actions = {
  steamReturns(body: unknown) {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        json: async () => body,
      } as unknown as Response)
    );
  },
  fetchOwnedGames: () => fetchOwnedGames(STEAM_ID_64),
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("fetchOwnedGames", () => {
  describe("given Steam returns games without any time played", () => {
    it("returns them with zero playtime", async () => {
      actions.steamReturns({
        response: {
          game_count: 1,
          games: [{ appid: 61, name: "Playtime Hidden" }],
        },
      });

      expect(await actions.fetchOwnedGames()).toEqual([
        {
          appId: 61,
          name: "Playtime Hidden",
          playtimeForever: 0,
          playtimeWindows: 0,
          playtimeMac: 0,
          playtimeLinux: 0,
          imgIconUrl: null,
          imgLogoUrl: null,
          rtimeLastPlayed: null,
        },
      ]);
    });
  });

  describe("given Steam returns games with time played", () => {
    it("keeps the reported playtime", async () => {
      actions.steamReturns({
        response: {
          game_count: 1,
          games: [
            {
              appid: 7,
              name: "Played",
              playtime_forever: 120,
              playtime_windows_forever: 100,
              playtime_mac_forever: 0,
              playtime_linux_forever: 20,
              rtime_last_played: 1_700_000_000,
            },
          ],
        },
      });

      expect(await actions.fetchOwnedGames()).toMatchObject([
        {
          playtimeForever: 120,
          playtimeWindows: 100,
          playtimeLinux: 20,
          rtimeLastPlayed: 1_700_000_000,
        },
      ]);
    });
  });

  describe("given Steam returns a game without a name", () => {
    it("fails as a schema mismatch", async () => {
      actions.steamReturns({
        response: { game_count: 1, games: [{ appid: 1 }] },
      });

      await expect(actions.fetchOwnedGames()).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });

  describe("given a private profile", () => {
    it("reports the profile as private", async () => {
      actions.steamReturns({ response: { game_count: 3 } });

      await expect(actions.fetchOwnedGames()).rejects.toBeInstanceOf(
        SteamProfilePrivateError
      );
    });
  });
});
