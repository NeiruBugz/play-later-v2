import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLibraryStats } from "@/entities/library-item/api/get-library-stats.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-library-stats");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

function makeUser(suffix: string) {
  return {
    id: `stats-user-${suffix}`,
    email: `stats-${suffix}@example.com`,
    name: `Stats User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string, igdbId: number) {
  return {
    id: `stats-game-${suffix}`,
    igdbId,
    title: `Stats Game ${suffix}`,
    slug: `stats-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(
  suffix: string,
  userId: string,
  gameId: string,
  status: "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED",
  updatedAt?: Date
) {
  return {
    id: parseInt(suffix, 10),
    userId,
    gameId,
    status,
    acquisitionType: "DIGITAL" as const,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: updatedAt ?? new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getLibraryStats", () => {
  describe("given a user has no library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("001") });
    });

    it("returns zeroed stats", async () => {
      const stats = await getLibraryStats("stats-user-001");

      expect(stats.statusCounts).toEqual({});
      expect(stats.recentGames).toEqual([]);
      expect(stats.journalCount).toBe(0);
    });
  });

  describe("given a user has library items across multiple statuses", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("002") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("a", 10001) }),
        db.prisma.game.create({ data: makeGame("b", 10002) }),
        db.prisma.game.create({ data: makeGame("c", 10003) }),
        db.prisma.game.create({ data: makeGame("d", 10004) }),
        db.prisma.game.create({ data: makeGame("e", 10005) }),
        db.prisma.game.create({ data: makeGame("f", 10006) }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("1001", "stats-user-002", "stats-game-a", "PLAYING"),
          makeLibraryItem("1002", "stats-user-002", "stats-game-b", "PLAYING"),
          makeLibraryItem("1003", "stats-user-002", "stats-game-c", "PLAYED"),
          makeLibraryItem("1004", "stats-user-002", "stats-game-d", "SHELF"),
          makeLibraryItem("1005", "stats-user-002", "stats-game-e", "WISHLIST"),
          makeLibraryItem("1006", "stats-user-002", "stats-game-f", "UP_NEXT"),
        ],
      });
    });

    it("counts each status correctly and totals match", async () => {
      const stats = await getLibraryStats("stats-user-002");

      expect(stats.statusCounts["PLAYING"]).toBe(2);
      expect(stats.statusCounts["PLAYED"]).toBe(1);
      expect(stats.statusCounts["SHELF"]).toBe(1);
      expect(stats.statusCounts["WISHLIST"]).toBe(1);
      expect(stats.statusCounts["UP_NEXT"]).toBe(1);

      const counts = stats.statusCounts as Record<string, number>;
      const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
      expect(total).toBe(6);
    });
  });

  describe("given another user has library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("003") });
      await db.prisma.user.create({ data: makeUser("004") });
      await db.prisma.game.create({ data: makeGame("g", 10007) });
      await db.prisma.libraryItem.create({
        data: makeLibraryItem(
          "1007",
          "stats-user-004",
          "stats-game-g",
          "PLAYING"
        ),
      });
    });

    it("excludes other users items from the count", async () => {
      const stats = await getLibraryStats("stats-user-003");

      expect(stats.statusCounts).toEqual({});
      expect(stats.recentGames).toEqual([]);
    });
  });
});
