import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getRecentGames } from "@/entities/library-item/api/get-recent-games.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-recent-games");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

const RECENT_GAMES_LIMIT = 5;

function makeUser(suffix: string) {
  return {
    id: `recent-user-${suffix}`,
    email: `recent-${suffix}@example.com`,
    name: `Recent User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string, igdbId: number) {
  return {
    id: `recent-game-${suffix}`,
    igdbId,
    title: `Recent Game ${suffix}`,
    slug: `recent-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makePlayingItem(
  id: number,
  userId: string,
  gameId: string,
  updatedAt: Date
) {
  return {
    id,
    userId,
    gameId,
    status: "PLAYING" as const,
    acquisitionType: "DIGITAL" as const,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt,
  };
}

describe("getRecentGames", () => {
  describe("given a user has no library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("001") });
    });

    it("returns an empty array", async () => {
      const result = await getRecentGames("recent-user-001");

      expect(result).toEqual([]);
    });
  });

  describe("given a user has fewer items than the recent-games limit", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("002") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("a", 20001) }),
        db.prisma.game.create({ data: makeGame("b", 20002) }),
        db.prisma.game.create({ data: makeGame("c", 20003) }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makePlayingItem(
            2001,
            "recent-user-002",
            "recent-game-a",
            new Date("2024-03-01T00:00:00.000Z")
          ),
          makePlayingItem(
            2002,
            "recent-user-002",
            "recent-game-b",
            new Date("2024-02-01T00:00:00.000Z")
          ),
          makePlayingItem(
            2003,
            "recent-user-002",
            "recent-game-c",
            new Date("2024-01-01T00:00:00.000Z")
          ),
        ],
      });
    });

    it("returns all of them ordered by updatedAt DESC", async () => {
      const result = await getRecentGames("recent-user-002");

      expect(result).toHaveLength(3);
      expect(result[0].gameId).toBe("recent-game-a");
      expect(result[1].gameId).toBe("recent-game-b");
      expect(result[2].gameId).toBe("recent-game-c");
    });
  });

  describe("given a user has more items than the recent-games limit", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("003") });
      await Promise.all(
        Array.from({ length: RECENT_GAMES_LIMIT + 1 }, (_, i) =>
          db.prisma.game.create({ data: makeGame(`over-${i}`, 30000 + i) })
        )
      );
      await db.prisma.libraryItem.createMany({
        data: Array.from({ length: RECENT_GAMES_LIMIT + 1 }, (_, i) =>
          makePlayingItem(
            3000 + i,
            "recent-user-003",
            `recent-game-over-${i}`,
            new Date(2024, 0, i + 1)
          )
        ),
      });
    });

    it("returns only the most recent N items", async () => {
      const result = await getRecentGames("recent-user-003");

      expect(result).toHaveLength(RECENT_GAMES_LIMIT);

      const returnedUpdatedAts = result.map((item: { lastPlayed: Date }) =>
        item.lastPlayed.getTime()
      );
      for (let i = 0; i < returnedUpdatedAts.length - 1; i++) {
        expect(returnedUpdatedAts[i]).toBeGreaterThanOrEqual(
          returnedUpdatedAts[i + 1]
        );
      }
    });
  });

  describe("given another user has library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("004") });
      await db.prisma.user.create({ data: makeUser("005") });
      await db.prisma.game.create({ data: makeGame("z", 40001) });
      await db.prisma.libraryItem.create({
        data: makePlayingItem(
          4001,
          "recent-user-005",
          "recent-game-z",
          new Date("2024-06-01T00:00:00.000Z")
        ),
      });
    });

    it("excludes other users items", async () => {
      const result = await getRecentGames("recent-user-004");

      expect(result).toEqual([]);
    });
  });
});
