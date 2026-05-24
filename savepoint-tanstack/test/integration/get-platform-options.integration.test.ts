import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getPlatformOptionsWorker } from "@/features/manage-library-entry/api/get-platform-options.worker";
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

    it("groups the game's IGDB platforms separately from the user's other logged platforms", async () => {
      const result = await getPlatformOptionsWorker("plat-user-union", {
        gameId: "plat-game-subject",
      });

      expect(result).toEqual([
        { label: "This game", platforms: ["Nintendo Switch", "PC"] },
        { label: "Your platforms", platforms: ["PlayStation 5"] },
      ]);
    });
  });

  describe("given a game with no stored IGDB platforms but the user has logged platforms", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("fallback") });
      const subject = await makeGame("fallback");
      await logPlatform("plat-user-fallback", subject.id, "Steam Deck");
    });

    it("returns only the user's logged platforms (no Common platforms group)", async () => {
      const result = await getPlatformOptionsWorker("plat-user-fallback", {
        gameId: "plat-game-fallback",
      });

      expect(result).toEqual([
        { label: "Your platforms", platforms: ["Steam Deck"] },
      ]);
    });
  });

  describe("given a game with no IGDB platforms and the user has logged none", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("empty") });
      await makeGame("empty");
    });

    it("returns an empty array", async () => {
      const result = await getPlatformOptionsWorker("plat-user-empty", {
        gameId: "plat-game-empty",
      });

      expect(result).toEqual([]);
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
