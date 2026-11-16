/**
 * RED unit test for spec 030 tech 2.5.
 *
 * Contract: `match-steam-games.ts` exports
 *   matchSteamGamesByAppIds(appIds: string[]): Promise<Map<string, SearchResponseItem>>
 * keyed by Steam app id. One `/external_games` request per call. Unfound ids
 * are absent from the map. The `fields` list uses the EXPANDED form
 * (`game.release_dates.date,game.release_dates.date_format,...`), not braces.
 */
import { beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError } from "@/shared/lib/errors";

import { igdbFetch } from "./fetch";
import { matchSteamGamesByAppIds } from "./match-steam-games";

vi.mock("./fetch", () => ({
  igdbFetch: vi.fn(),
}));

vi.mock("@env", () => ({ env: {} }));

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
  stub.child = vi.fn(() => stub);
  return { ...actual, createLogger: vi.fn(() => stub) };
});

const igdbFetchMock = igdbFetch as ReturnType<typeof vi.fn>;

const MAIN_GAME = 0;
const EXPANSION = 2;
const DLC = 1;

const gameRow = (uid: string, id: number, gameType = MAIN_GAME) => ({
  uid,
  game: { id, name: `Game ${id}`, slug: `game-${id}`, game_type: gameType },
});

const normalizedQuery = () =>
  String(igdbFetchMock.mock.calls[0]?.[1]).replace(/\s+/g, " ");

const requestedFields = () =>
  (/fields([^;]+);/.exec(normalizedQuery())?.[1] ?? "")
    .split(",")
    .map((field) => field.trim());

describe(matchSteamGamesByAppIds, () => {
  beforeEach(() => {
    igdbFetchMock.mockReset();
    igdbFetchMock.mockResolvedValue([]);
  });

  describe("given two Steam app ids", () => {
    beforeEach(async () => {
      igdbFetchMock.mockResolvedValue([gameRow("220", 1234)]);
      await matchSteamGamesByAppIds(["220", "440"]);
    });

    it("makes a single request to the external_games endpoint", () => {
      expect(igdbFetchMock).toHaveBeenCalledTimes(1);
      expect(igdbFetchMock.mock.calls[0]?.[0]).toBe("/external_games");
    });

    it("restricts the request to the Steam source and the quoted uids", () => {
      expect(normalizedQuery()).toContain(
        'where external_game_source = 1 & uid = ("220","440");'
      );
    });

    it("allows up to 500 rows", () => {
      expect(normalizedQuery()).toContain("limit 500;");
    });

    it("asks for the game's identity, cover, type and release date", () => {
      expect(requestedFields()).toEqual(
        expect.arrayContaining([
          "uid",
          "game.id",
          "game.name",
          "game.slug",
          "game.first_release_date",
          "game.cover.image_id",
          "game.game_type",
        ])
      );
    });

    it("asks for how precisely the release date is known", () => {
      expect(requestedFields()).toEqual(
        expect.arrayContaining([
          "game.release_dates.date",
          "game.release_dates.date_format",
          "game.release_dates.y",
          "game.release_dates.m",
          "game.release_dates.human",
        ])
      );
    });
  });

  describe("given IGDB knows one of two ids", () => {
    let matches: Awaited<ReturnType<typeof matchSteamGamesByAppIds>>;

    beforeEach(async () => {
      igdbFetchMock.mockResolvedValue([gameRow("220", 1234)]);
      matches = await matchSteamGamesByAppIds(["220", "440"]);
    });

    it("returns the game keyed by its Steam app id", () => {
      expect(matches.get("220")).toMatchObject({
        id: 1234,
        name: "Game 1234",
        slug: "game-1234",
      });
    });

    it("leaves the unknown id out of the map", () => {
      expect([...matches.keys()]).toEqual(["220"]);
    });
  });

  describe("given IGDB returns a row for an id but without a game", () => {
    let matches: Awaited<ReturnType<typeof matchSteamGamesByAppIds>>;

    beforeEach(async () => {
      igdbFetchMock.mockResolvedValue([{ uid: "220" }, gameRow("440", 7)]);
      matches = await matchSteamGamesByAppIds(["220", "440"]);
    });

    it("treats that id as unfound", () => {
      expect([...matches.keys()]).toEqual(["440"]);
    });
  });

  describe("given IGDB returns several games for the same Steam app id", () => {
    it("prefers the main game over an expansion or DLC", async () => {
      igdbFetchMock.mockResolvedValue([
        gameRow("220", 1, EXPANSION),
        gameRow("220", 9, MAIN_GAME),
        gameRow("220", 2, DLC),
      ]);

      const matches = await matchSteamGamesByAppIds(["220"]);

      expect(matches.get("220")?.id).toBe(9);
    });

    it("takes the lowest id among several main games", async () => {
      igdbFetchMock.mockResolvedValue([
        gameRow("220", 30, MAIN_GAME),
        gameRow("220", 12, MAIN_GAME),
        gameRow("220", 21, MAIN_GAME),
      ]);

      const matches = await matchSteamGamesByAppIds(["220"]);

      expect(matches.get("220")?.id).toBe(12);
    });

    it("takes the lowest id when none of them is a main game", async () => {
      igdbFetchMock.mockResolvedValue([
        gameRow("220", 8, EXPANSION),
        gameRow("220", 4, DLC),
      ]);

      const matches = await matchSteamGamesByAppIds(["220"]);

      expect(matches.get("220")?.id).toBe(4);
    });
  });

  describe("given no ids", () => {
    it("asks IGDB for nothing and returns an empty map", async () => {
      const matches = await matchSteamGamesByAppIds([]);

      expect(igdbFetchMock).not.toHaveBeenCalled();
      expect(matches.size).toBe(0);
    });
  });

  describe("given an id that is not a Steam app number", () => {
    it("throws before hitting IGDB", async () => {
      await expect(matchSteamGamesByAppIds(["220", 'x")'])).rejects.toThrow(
        "invalid steamAppId"
      );
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });
  });

  describe("given IGDB transport throws", () => {
    it("wraps the failure in UpstreamError", async () => {
      igdbFetchMock.mockRejectedValue(new Error("network down"));

      await expect(matchSteamGamesByAppIds(["220"])).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });

  describe("given IGDB returns something that is not a list of external games", () => {
    it("throws UpstreamError", async () => {
      igdbFetchMock.mockResolvedValue({ message: "nope" });

      await expect(matchSteamGamesByAppIds(["220"])).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });
});
