import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getUniqueLibraryPlatforms } from "@/entities/library-item/api/get-unique-platforms.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-unique-platforms");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

let _gameCounter = 30_100;
let _itemCounter = 5_001;

function makeUser(suffix: string) {
  return {
    id: `plat-user-${suffix}`,
    email: `plat-${suffix}@example.com`,
    name: `Platform User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `plat-game-${suffix}`,
    igdbId: _gameCounter++,
    title: `Platform Game ${suffix}`,
    slug: `platform-game-${suffix}`,
    releaseDate: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(
  userId: string,
  gameId: string,
  platform: string | null
) {
  return {
    id: _itemCounter++,
    userId,
    gameId,
    status: "SHELF" as const,
    acquisitionType: "DIGITAL" as const,
    platform,
    rating: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getUniqueLibraryPlatforms", () => {
  describe("given a user has no library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("empty") });
    });

    it("returns an empty list", async () => {
      const platforms = await getUniqueLibraryPlatforms("plat-user-empty");

      expect(platforms).toEqual([]);
    });
  });

  describe("given a user owns games on several platforms", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("multi") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("m1") }),
        db.prisma.game.create({ data: makeGame("m2") }),
        db.prisma.game.create({ data: makeGame("m3") }),
        db.prisma.game.create({ data: makeGame("m4") }),
        db.prisma.game.create({ data: makeGame("m5") }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("plat-user-multi", "plat-game-m1", "PC"),
          // Duplicate platform — must collapse to a single entry.
          makeLibraryItem("plat-user-multi", "plat-game-m2", "PC"),
          makeLibraryItem("plat-user-multi", "plat-game-m3", "Nintendo Switch"),
          // Null platform — must be dropped.
          makeLibraryItem("plat-user-multi", "plat-game-m4", null),
          // Blank platform — must be dropped.
          makeLibraryItem("plat-user-multi", "plat-game-m5", "  "),
        ],
      });
    });

    it("returns each owned platform exactly once, sorted, excluding null/blank", async () => {
      const platforms = await getUniqueLibraryPlatforms("plat-user-multi");

      expect(platforms).toEqual(["Nintendo Switch", "PC"]);
    });
  });

  describe("given another user owns different platforms", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("mine") });
      await db.prisma.user.create({ data: makeUser("theirs") });
      await Promise.all([
        db.prisma.game.create({ data: makeGame("mine1") }),
        db.prisma.game.create({ data: makeGame("theirs1") }),
      ]);
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem("plat-user-mine", "plat-game-mine1", "PC"),
          makeLibraryItem(
            "plat-user-theirs",
            "plat-game-theirs1",
            "PlayStation 5"
          ),
        ],
      });
    });

    it("returns only the requesting user's platforms", async () => {
      const platforms = await getUniqueLibraryPlatforms("plat-user-mine");

      expect(platforms).toEqual(["PC"]);
    });
  });
});
