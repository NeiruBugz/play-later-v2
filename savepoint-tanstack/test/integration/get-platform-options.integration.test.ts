import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  DEFAULT_PLATFORMS,
  getPlatformOptionsWorker,
} from "@/features/manage-library-entry/api/get-platform-options.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-platform-options");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.gamePlatform.deleteMany();
  await db.prisma.platform.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _gameCounter = 70_100;
let _platformCounter = 80_100;
let _itemCounter = 9_001;

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

async function makeGame(suffix: string) {
  return db.prisma.game.create({
    data: {
      id: `plat-game-${suffix}`,
      igdbId: _gameCounter++,
      title: `Platform Game ${suffix}`,
      slug: `platform-game-${suffix}`,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

async function attachPlatform(gameId: string, name: string) {
  const id = `plat-${_platformCounter++}`;
  const platform = await db.prisma.platform.create({
    data: {
      id,
      igdbId: _platformCounter++,
      name,
      slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
  await db.prisma.gamePlatform.create({
    data: { gameId, platformId: platform.id },
  });
}

async function logPlatform(userId: string, gameId: string, platform: string) {
  await db.prisma.libraryItem.create({
    data: {
      id: _itemCounter++,
      userId,
      gameId,
      status: "PLAYING",
      acquisitionType: "DIGITAL",
      hasBeenPlayed: false,
      platform,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("getPlatformOptionsWorker", () => {
  describe("given a game with stored IGDB platforms and a user with logged platforms", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("union") });
      const subject = await makeGame("subject");
      await attachPlatform(subject.id, "Nintendo Switch");
      await attachPlatform(subject.id, "PC");

      // A second game gives the user a distinct logged platform not in the
      // subject game's IGDB list.
      const other = await makeGame("other");
      await logPlatform("plat-user-union", subject.id, "PC");
      await logPlatform("plat-user-union", other.id, "PlayStation 5");
    });

    it("returns the union of IGDB platforms and the user's logged platforms, deduped and sorted", async () => {
      const result = await getPlatformOptionsWorker("plat-user-union", {
        gameId: "plat-game-subject",
      });

      expect(result).toEqual(["Nintendo Switch", "PC", "PlayStation 5"]);
    });
  });

  describe("given a game with no stored IGDB platforms", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("fallback") });
      const subject = await makeGame("fallback");
      await logPlatform("plat-user-fallback", subject.id, "Steam Deck");
    });

    it("returns DEFAULT_PLATFORMS unioned with the user's logged platforms", async () => {
      const result = await getPlatformOptionsWorker("plat-user-fallback", {
        gameId: "plat-game-fallback",
      });

      const expected = Array.from(
        new Set([...DEFAULT_PLATFORMS, "Steam Deck"])
      ).sort((a, b) => a.localeCompare(b));

      expect(result).toEqual(expected);
      expect(result).toContain("Steam Deck");
      for (const platform of DEFAULT_PLATFORMS) {
        expect(result).toContain(platform);
      }
    });
  });

  describe("given no signed-in user", () => {
    it("throws UnauthorizedError", async () => {
      await expect(
        getPlatformOptionsWorker(undefined, { gameId: "plat-game-any" })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
