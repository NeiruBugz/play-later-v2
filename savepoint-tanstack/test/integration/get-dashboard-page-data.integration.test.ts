/**
 * Integration tests for getDashboardPageDataWorker.
 *
 * Home payload: { playing, upNextTop3, upNextTotal, counts }.
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
        "upNextTop3",
        "upNextTotal",
      ]);
      expect(data.counts).toEqual({ WANT: 0, PLAYING: 0, DONE: 0 });
      expect(data.playing).toEqual([]);
      expect(data.upNextTop3).toEqual([]);
      expect(data.upNextTotal).toBe(0);
    });
  });

  describe("given a mixed library", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("mixed") });
      await db.prisma.game.createMany({
        data: ["a", "b", "c", "d", "e", "f", "g"].map((x) =>
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

    it("returns the top 3 queued games in queue order (queued Done included) with the full total", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(
        data.upNextTop3.map((i) => [i.game.id, i.status, i.upNextPosition])
      ).toEqual([
        ["ddpd-game-mx-d", "DONE", 1],
        ["ddpd-game-mx-f", "WANT", 2],
        ["ddpd-game-mx-e", "WANT", 3],
      ]);
      expect(data.upNextTotal).toBe(4);
    });

    it("returns status counts across the whole library", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(data.counts).toEqual({ WANT: 4, PLAYING: 2, DONE: 1 });
    });

    it("has no recentlyPlayed or stats-card data", async () => {
      const data = await getDashboardPageDataWorker("ddpd-user-mixed");

      expect(data).not.toHaveProperty("recentlyPlayed");
      expect(data).not.toHaveProperty("recentlyAdded");
      expect(data).not.toHaveProperty("showStats");
      expect(data).not.toHaveProperty("quickLogGames");
    });
  });
});
