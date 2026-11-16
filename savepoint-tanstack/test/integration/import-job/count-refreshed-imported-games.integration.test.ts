import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { countRefreshedImportedGames } from "@/entities/imported-game/api/count-refreshed-imported-games.server";

import {
  createGame,
  createLibraryItem,
  createUser,
} from "../../factories/index.ts";
import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("count-refreshed-imported-games");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const LONG_AGO = new Date("2024-01-01T00:00:00.000Z");
const JOB_STARTED_AT = new Date("2025-06-01T12:00:00.000Z");
const AFTER_THE_JOB_STARTED = new Date("2025-06-01T12:05:00.000Z");

let userId: string;
let otherUserId: string;
let nextStorefrontGameId = 1;

const actions = {
  seedImportedGame: (overrides: Record<string, unknown> = {}, owner = userId) =>
    db.prisma.importedGame.create({
      data: {
        userId: owner,
        storefront: "STEAM",
        storefrontGameId: String(nextStorefrontGameId++),
        name: "Seeded game",
        createdAt: LONG_AGO,
        ...overrides,
      },
    }),
};

const elements = {
  refreshedCount: () =>
    countRefreshedImportedGames(userId, "STEAM", JOB_STARTED_AT),
};

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.importedGame.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
  userId = (await createUser(db.prisma)).id;
  otherUserId = (await createUser(db.prisma)).id;
});

describe("countRefreshedImportedGames", () => {
  describe("given rows that the import page showed before the job", () => {
    it("counts found rows and needs-a-match rows created before the job", async () => {
      const found = await createGame(db.prisma, {});
      await actions.seedImportedGame({ gameId: found.id });
      await actions.seedImportedGame({ gameId: null, lookedUpAt: LONG_AGO });
      await actions.seedImportedGame({ gameId: null });

      expect(await elements.refreshedCount()).toBe(3);
    });
  });

  describe("given rows the import page did not show before the job", () => {
    it("skips rows created after the job started", async () => {
      await actions.seedImportedGame({ createdAt: AFTER_THE_JOB_STARTED });

      expect(await elements.refreshedCount()).toBe(0);
    });

    it("skips removed, added, deleted and in-library rows", async () => {
      const inLibrary = await createGame(db.prisma, {});
      await createLibraryItem(db.prisma, {
        userId,
        gameId: inLibrary.id,
        status: "DONE",
      });
      await actions.seedImportedGame({ igdbMatchStatus: "IGNORED" });
      await actions.seedImportedGame({ igdbMatchStatus: "MATCHED" });
      await actions.seedImportedGame({ deletedAt: LONG_AGO });
      await actions.seedImportedGame({ gameId: inLibrary.id });

      expect(await elements.refreshedCount()).toBe(0);
    });

    it("skips another user's rows and another storefront's rows", async () => {
      await actions.seedImportedGame({}, otherUserId);
      await actions.seedImportedGame({ storefront: "XBOX" });

      expect(await elements.refreshedCount()).toBe(0);
    });

    it("counts a row whose game only another user has in the library", async () => {
      const game = await createGame(db.prisma, {});
      await createLibraryItem(db.prisma, {
        userId: otherUserId,
        gameId: game.id,
        status: "DONE",
      });
      await actions.seedImportedGame({ gameId: game.id });

      expect(await elements.refreshedCount()).toBe(1);
    });
  });
});
