import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { UpstreamError } from "@/shared/lib/errors";

import { IgdbHttpError } from "./errors";
import { igdbFetch } from "./fetch";
import { getGamesReleaseInfoByIgdbIds } from "./get-games-release-info";

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
  stub.child = vi.fn(() => stub);
  return { ...actual, createLogger: vi.fn(() => stub) };
});

const igdbFetchMock = igdbFetch as ReturnType<typeof vi.fn>;

const PAUSE_BETWEEN_CHUNKS_MS = 300;

const idsFrom = (firstId: number, count: number) =>
  Array.from({ length: count }, (_unused, index) => firstId + index);

function requestedFields(query: string): string[] {
  const fieldList = /fields([^;]+);/.exec(query)?.[1] ?? "";
  return fieldList.split(",").map((field) => field.trim());
}

function requestedIds(query: string): number[] {
  const idList = /where id = \(([^)]*)\)/.exec(query)?.[1] ?? "";
  return idList
    .split(",")
    .map((id) => id.trim())
    .filter((id) => id.length > 0)
    .map(Number);
}

const requestedIdsOfCall = (callIndex: number) =>
  requestedIds(igdbFetchMock.mock.calls[callIndex]?.[1] ?? "");

const releaseInfoOf = (id: number) => ({
  id,
  first_release_date: 1794528000,
  release_dates: [{ date: 1794528000, date_format: 0, y: 2026, m: 11 }],
});

const rateLimited = () =>
  new IgdbHttpError("IGDB 429 Too Many Requests", {
    status: 429,
    statusText: "Too Many Requests",
    resource: "/games",
    query: "fields first_release_date; where id = (1); limit 100;",
    requestId: "request-1",
  });

describe(getGamesReleaseInfoByIgdbIds, () => {
  beforeEach(() => {
    vi.useFakeTimers();
    igdbFetchMock.mockReset();
    igdbFetchMock.mockImplementation((_resource: string, query: string) =>
      Promise.resolve(requestedIds(query).map(releaseInfoOf))
    );
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given no ids", () => {
    let releaseInfo: Map<number, unknown>;

    beforeEach(async () => {
      releaseInfo = await getGamesReleaseInfoByIgdbIds([]);
    });

    it("asks IGDB for nothing", () => {
      expect(igdbFetchMock).not.toHaveBeenCalled();
    });

    it("returns an empty map", () => {
      expect(releaseInfo.size).toBe(0);
    });
  });

  describe("given a handful of ids", () => {
    let releaseInfo: Map<number, { id: number }>;

    beforeEach(async () => {
      releaseInfo = await getGamesReleaseInfoByIgdbIds([
        349703, 322514, 245937,
      ]);
    });

    it("makes a single request to the games endpoint", () => {
      expect(igdbFetchMock).toHaveBeenCalledTimes(1);
      expect(igdbFetchMock.mock.calls[0]?.[0]).toBe("/games");
    });

    it("asks for exactly those games, up to a limit of 100", () => {
      const query: string = igdbFetchMock.mock.calls[0]?.[1];

      expect(requestedIdsOfCall(0)).toEqual([349703, 322514, 245937]);
      expect(query).toContain("limit 100");
    });

    it("asks IGDB for the release date and how precisely it is known", () => {
      const query: string = igdbFetchMock.mock.calls[0]?.[1];

      expect(requestedFields(query)).toEqual(
        expect.arrayContaining([
          "first_release_date",
          "release_dates.date",
          "release_dates.date_format",
          "release_dates.y",
          "release_dates.m",
        ])
      );
    });

    it("returns the release info of each game keyed by its IGDB id", () => {
      expect([...releaseInfo.keys()].sort()).toEqual([245937, 322514, 349703]);
      expect(releaseInfo.get(349703)).toMatchObject({
        id: 349703,
        first_release_date: 1794528000,
        release_dates: [{ date: 1794528000, date_format: 0, y: 2026, m: 11 }],
      });
    });
  });

  describe("given IGDB knows only some of the ids", () => {
    let releaseInfo: Map<number, unknown>;

    beforeEach(async () => {
      igdbFetchMock.mockResolvedValue([releaseInfoOf(11)]);
      releaseInfo = await getGamesReleaseInfoByIgdbIds([11, 22]);
    });

    it("leaves the unknown id out of the map", () => {
      expect([...releaseInfo.keys()]).toEqual([11]);
    });
  });

  describe("given exactly 100 ids", () => {
    beforeEach(async () => {
      await getGamesReleaseInfoByIgdbIds(idsFrom(1, 100));
    });

    it("asks for all of them in one request, without waiting for a pause", () => {
      expect(igdbFetchMock).toHaveBeenCalledTimes(1);
      expect(requestedIdsOfCall(0)).toEqual(idsFrom(1, 100));
    });
  });

  describe("given 250 ids", () => {
    let pending: Promise<Map<number, { id: number }>>;

    beforeEach(async () => {
      pending = getGamesReleaseInfoByIgdbIds(idsFrom(1, 250));
      await vi.advanceTimersByTimeAsync(0);
    });

    it("sends the first 100 ids straight away", () => {
      expect(igdbFetchMock).toHaveBeenCalledTimes(1);
      expect(requestedIdsOfCall(0)).toEqual(idsFrom(1, 100));
    });

    it("waits out the pause before sending the next chunk", async () => {
      await vi.advanceTimersByTimeAsync(PAUSE_BETWEEN_CHUNKS_MS - 1);

      expect(igdbFetchMock).toHaveBeenCalledTimes(1);
    });

    it("sends the second 100 ids after a 300 ms pause", async () => {
      await vi.advanceTimersByTimeAsync(PAUSE_BETWEEN_CHUNKS_MS);

      expect(igdbFetchMock).toHaveBeenCalledTimes(2);
      expect(requestedIdsOfCall(1)).toEqual(idsFrom(101, 100));
    });

    it("sends the last 50 ids after another 300 ms pause", async () => {
      await vi.advanceTimersByTimeAsync(PAUSE_BETWEEN_CHUNKS_MS * 2);

      expect(igdbFetchMock).toHaveBeenCalledTimes(3);
      expect(requestedIdsOfCall(2)).toEqual(idsFrom(201, 50));
    });

    it("returns every game once the last chunk is in, with no pause after it", async () => {
      await vi.advanceTimersByTimeAsync(PAUSE_BETWEEN_CHUNKS_MS * 2);
      const releaseInfo = await pending;

      expect(releaseInfo.size).toBe(250);
    });
  });

  describe("given IGDB rate-limits the request even after the client's own retry", () => {
    it("surfaces an upstream error", async () => {
      igdbFetchMock.mockRejectedValue(rateLimited());

      await expect(
        getGamesReleaseInfoByIgdbIds([1, 2, 3])
      ).rejects.toBeInstanceOf(UpstreamError);
    });

    it("surfaces an upstream error when a later chunk is the one that fails", async () => {
      igdbFetchMock
        .mockResolvedValueOnce(idsFrom(1, 100).map(releaseInfoOf))
        .mockRejectedValueOnce(rateLimited());

      const pending = getGamesReleaseInfoByIgdbIds(idsFrom(1, 150));
      const outcome = expect(pending).rejects.toBeInstanceOf(UpstreamError);
      await vi.advanceTimersByTimeAsync(PAUSE_BETWEEN_CHUNKS_MS);

      await outcome;
    });
  });

  describe("given IGDB fails with a plain network error", () => {
    it("surfaces an upstream error", async () => {
      igdbFetchMock.mockRejectedValue(new Error("socket hang up"));

      await expect(getGamesReleaseInfoByIgdbIds([1])).rejects.toBeInstanceOf(
        UpstreamError
      );
    });
  });
});
