/**
 * Integration tests for getDashboardPageDataWorker.
 *
 * Home payload: { playing, upNextQueue, upNextTotal, counts }.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getDashboardPageDataWorker } from "@/features/dashboard/api/get-dashboard-page-data.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-dashboard-page-data");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let _igdbCounter = 70_000;

function makeUser(
  suffix: string,
  opts: { name?: string | null; username?: string } = {}
) {
  return {
    id: `ddpd-user-${suffix}`,
    email: `ddpd-${suffix}@example.com`,
    name: opts.name !== undefined ? opts.name : `Dashboard User ${suffix}`,
    username: opts.username ?? `ddpd-${suffix}`,
    emailVerified: true,
    isPublicProfile: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `ddpd-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `Dashboard Game ${suffix}`,
    slug: `dashboard-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(
  userId: string,
  gameId: string,
  opts: {
    status?: "WANT" | "PLAYING" | "DONE";
    upNextPosition?: number | null;
    statusChangedAt?: Date | null;
    createdAt?: Date;
    updatedAt?: Date;
  } = {}
) {
  const ts = opts.createdAt ?? new Date("2024-06-01T00:00:00.000Z");
  return {
    userId,
    gameId,
    status: opts.status ?? ("WANT" as const),
    upNextPosition: opts.upNextPosition ?? null,
    statusChangedAt: opts.statusChangedAt ?? null,
    acquisitionType: "DIGITAL" as const,
    createdAt: ts,
    updatedAt: opts.updatedAt ?? ts,
  };
}

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Auth gate
// ---------------------------------------------------------------------------

describe("getDashboardPageDataWorker", () => {
  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(getDashboardPageDataWorker(undefined)).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  describe("given a user with an empty library", () => {
    it("returns the payload shape with nothing in it", async () => {
      await db.prisma.user.create({ data: makeUser("empty") });

      const data = await getDashboardPageDataWorker("ddpd-user-empty");

      expect(Object.keys(data).sort()).toEqual([
        "counts",
        "playing",
        "upNextQueue",
        "upNextTotal",
      ]);
      expect(data.counts).toEqual({ WANT: 0, PLAYING: 0, DONE: 0 });
      expect(data.playing).toEqual([]);
      expect(data.upNextQueue).toEqual([]);
      expect(data.upNextTotal).toBe(0);
    });
  });

  describe("given a mixed library", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("mixed") });
      await db.prisma.game.createMany({
        data: ["a", "b", "c", "d", "e", "f", "g", "h"].map((x) =>
          makeGame(`mx-${x}`)
        ),
      });
      const row = (
        x: string,
        status: "WANT" | "PLAYING" | "DONE",
        upNextPosition?: number
      ) =>
        makeLibraryItem("ddpd-user-mixed", `ddpd-game-mx-${x}`, {
          status,
          upNextPosition,
        });
      await db.prisma.libraryItem.createMany({
        data: [
          row("a", "PLAYING"),
          row("b", "PLAYING"),
          row("c", "WANT", 4),
          row("d", "DONE", 1),
          row("e", "WANT", 3),
          row("f", "WANT", 2),
          row("g", "WANT"),
          row("h", "WANT", 5),
        ],
      });
    });

    it("lists every playing game exactly once, all PLAYING", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(data.playing.map((i) => i.game.id).sort()).toEqual([
        "ddpd-game-mx-a",
        "ddpd-game-mx-b",
      ]);
      expect(data.playing.every((i) => i.status === "PLAYING")).toBe(true);
    });

    it("returns the whole queue (5) in queue order, queued Done included", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(
        data.upNextQueue.map((i) => [i.game.id, i.status, i.upNextPosition])
      ).toEqual([
        ["ddpd-game-mx-d", "DONE", 1],
        ["ddpd-game-mx-f", "WANT", 2],
        ["ddpd-game-mx-e", "WANT", 3],
        ["ddpd-game-mx-c", "WANT", 4],
        ["ddpd-game-mx-h", "WANT", 5],
      ]);
      expect(data.upNextTotal).toBe(5);
    });

    it("returns status counts across the whole library", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(data.counts).toEqual({ WANT: 5, PLAYING: 2, DONE: 1 });
    });

    it("has no recentlyPlayed or stats-card data", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(data).not.toHaveProperty("recentlyPlayed");
      expect(data).not.toHaveProperty("recentlyAdded");
      expect(data).not.toHaveProperty("showStats");
      expect(data).not.toHaveProperty("quickLogGames");
    });
  });
  describe("given Playing games with and without logged sessions", () => {
    const at = (iso: string) => new Date(`${iso}T12:00:00.000Z`);
    let pLogged: string;
    let pUnkeyed: string;
    let pBare: string;
    let pNotesOnly: string;

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("order") });
      const names = ["logged", "unkeyed", "bare", "notes"];
      await db.prisma.game.createMany({
        data: names.map((x) => makeGame(`ord-${x}`)),
      });
      [pLogged, pUnkeyed, pBare, pNotesOnly] = names.map(
        (x) => `ddpd-game-ord-${x}`
      );

      const loggedItem = await db.prisma.libraryItem.create({
        data: makeLibraryItem("ddpd-user-order", pLogged, {
          status: "PLAYING",
          statusChangedAt: at("2026-01-01"),
          updatedAt: at("2026-06-01"),
        }),
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("ddpd-user-order", pUnkeyed, {
            status: "PLAYING",
            statusChangedAt: at("2026-02-01"),
            updatedAt: at("2026-05-01"),
          }),
          makeLibraryItem("ddpd-user-order", pBare, {
            status: "PLAYING",
            statusChangedAt: at("2026-03-05"),
            updatedAt: at("2026-04-01"),
          }),
          makeLibraryItem("ddpd-user-order", pNotesOnly, {
            status: "PLAYING",
            statusChangedAt: at("2026-02-20"),
            updatedAt: at("2026-03-01"),
          }),
        ],
      });

      const entry = (
        gameId: string,
        createdAt: Date,
        playedMinutes: number | null,
        libraryItemId: number | null = null
      ) => ({
        userId: "ddpd-user-order",
        gameId,
        libraryItemId,
        content: "entry",
        playedMinutes,
        createdAt,
      });
      await db.prisma.journalEntry.createMany({
        data: [
          entry(pLogged, at("2026-02-15"), 45, loggedItem.id),
          entry(pLogged, at("2026-03-01"), 60, loggedItem.id),
          entry(pLogged, at("2026-04-01"), null, loggedItem.id),
          entry(pUnkeyed, at("2026-03-10"), 30, null),
          entry(pBare, at("2026-05-01"), 0),
          entry(pNotesOnly, at("2026-05-02"), null),
        ],
      });
    });

    it("lists them most recently played first, falling back to when they became Playing", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-order");

      expect(data.playing.map((i) => i.game.id)).toEqual([
        pUnkeyed,
        pBare,
        pLogged,
        pNotesOnly,
      ]);
    });

    it("counts a session logged without a library item link", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-order");

      expect(
        data.playing.find((i) => i.game.id === pUnkeyed)?.lastSessionAt
      ).toEqual(at("2026-03-10"));
    });

    it("dates the last session by the latest entry that has time", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-order");

      expect(
        data.playing.find((i) => i.game.id === pLogged)?.lastSessionAt
      ).toEqual(at("2026-03-01"));
    });

    it("does not count notes without time or with zero minutes as sessions", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-order");

      const bare = data.playing.find((i) => i.game.id === pBare);
      const notesOnly = data.playing.find((i) => i.game.id === pNotesOnly);
      expect(bare?.lastSessionAt).toBeNull();
      expect(notesOnly?.lastSessionAt).toBeNull();
    });

    it("tells when each game became Playing", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-order");

      expect(
        Object.fromEntries(
          data.playing.map((i) => [i.game.id, i.becamePlayingAt])
        )
      ).toEqual({
        [pLogged]: at("2026-01-01"),
        [pUnkeyed]: at("2026-02-01"),
        [pBare]: at("2026-03-05"),
        [pNotesOnly]: at("2026-02-20"),
      });
    });
  });
});
