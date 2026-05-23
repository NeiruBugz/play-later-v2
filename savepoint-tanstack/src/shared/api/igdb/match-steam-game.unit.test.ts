import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError } from "@/shared/lib/errors";

import { igdbFetch } from "./fetch";
import { matchSteamGameByAppId } from "./match-steam-game";

vi.mock("./fetch", () => ({
  igdbFetch: vi.fn(),
}));

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const stub = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };
  // self-reference for child()
  stub.child = vi.fn(() => stub);
  return { ...actual, createLogger: vi.fn(() => stub) };
});

const igdbFetchMock = igdbFetch as ReturnType<typeof vi.fn>;

describe(matchSteamGameByAppId, () => {
  beforeEach(() => {
    igdbFetchMock.mockReset();
  });

  describe("given IGDB returns one match", () => {
    beforeEach(() => {
      igdbFetchMock.mockResolvedValue([
        {
          id: 1234,
          name: "Half-Life 2",
          slug: "half-life-2",
          first_release_date: 1099267200,
        },
      ]);
    });

    it("returns the parsed game", async () => {
      const result = await matchSteamGameByAppId("220");
      expect(result?.id).toBe(1234);
      expect(result?.slug).toBe("half-life-2");
    });

    it("queries the external_games endpoint with the Steam store URL", async () => {
      await matchSteamGameByAppId("220");
      const [resource, body] = igdbFetchMock.mock.calls[0] ?? [];
      expect(resource).toBe("/games");
      expect(body).toContain(
        'where external_games.url = "https://store.steampowered.com/app/220"'
      );
    });
  });

  describe("given IGDB returns an empty array", () => {
    beforeEach(() => {
      igdbFetchMock.mockResolvedValue([]);
    });

    it("returns null (not an error — no match is a valid outcome)", async () => {
      const result = await matchSteamGameByAppId("999999");
      expect(result).toBeNull();
    });
  });

  describe("given IGDB transport throws", () => {
    beforeEach(() => {
      igdbFetchMock.mockRejectedValue(new Error("network down"));
    });

    it("wraps the failure in UpstreamError", async () => {
      await expect(matchSteamGameByAppId("220")).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });

  describe("given a non-numeric steamAppId", () => {
    it("throws a programmer error before hitting IGDB", async () => {
      await expect(matchSteamGameByAppId("abc" as never)).rejects.toThrow(
        /invalid steamAppId/
      );
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });
});
