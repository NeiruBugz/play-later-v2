import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLibraryStatusCounts } from "@/entities/library-item/api/get-library-status-counts.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-library-status-counts");
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
    id: `counts-user-${suffix}`,
    email: `counts-${suffix}@example.com`,
    name: `Counts User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string, igdbId: number) {
  return {
    id: `counts-game-${suffix}`,
    igdbId,
    title: `Counts Game ${suffix}`,
    slug: `counts-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(
  id: number,
  userId: string,
  gameId: string,
  status: "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED"
) {
  return {
    id,
    userId,
    gameId,
    status,
    acquisitionType: "DIGITAL" as const,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getLibraryStatusCounts", () => {
  describe("given a user has no library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("001") });
    });

    it("returns every status key zeroed (a stable, complete rail)", async () => {
      const counts = await getLibraryStatusCounts("counts-user-001");

      expect(counts).toEqual({
        WISHLIST: 0,
        SHELF: 0,
        UP_NEXT: 0,
        PLAYING: 0,
        PLAYED: 0,
      });
    });
  });

  describe("given a user has items across several statuses", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("002") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("a", 20001) }),
        db.prisma.game.create({ data: makeGame("b", 20002) }),
        db.prisma.game.create({ data: makeGame("c", 20003) }),
        db.prisma.game.create({ data: makeGame("d", 20004) }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem(2001, "counts-user-002", "counts-game-a", "PLAYING"),
          makeLibraryItem(2002, "counts-user-002", "counts-game-b", "PLAYED"),
          makeLibraryItem(2003, "counts-user-002", "counts-game-c", "PLAYED"),
          makeLibraryItem(2004, "counts-user-002", "counts-game-d", "SHELF"),
        ],
      });
    });

    it("counts the whole library, independent of any filter selection", async () => {
      const counts = await getLibraryStatusCounts("counts-user-002");

      expect(counts.PLAYING).toBe(1);
      expect(counts.PLAYED).toBe(2);
      expect(counts.SHELF).toBe(1);
      // Statuses with no items are still present and zeroed.
      expect(counts.WISHLIST).toBe(0);
      expect(counts.UP_NEXT).toBe(0);
    });
  });

  describe("given another user has items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("003") });
      await db.prisma.user.create({ data: makeUser("004") });
      await db.prisma.game.create({ data: makeGame("e", 20005) });
      await db.prisma.libraryItem.create({
        data: makeLibraryItem(
          2005,
          "counts-user-004",
          "counts-game-e",
          "PLAYED"
        ),
      });
    });

    it("does not leak another user's counts", async () => {
      const counts = await getLibraryStatusCounts("counts-user-003");
      expect(counts.PLAYED).toBe(0);
    });
  });
});
