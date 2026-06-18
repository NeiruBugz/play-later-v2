/**
 * Integration tests for getLoggableGamesWorker (Spec 025 Slice 3b).
 *
 * Imports the WORKER directly — not the createServerFn wrapper. See
 * savepoint-tanstack/FOOT-GUNS.md foot-gun #8: the wrapper requires the
 * TanStack Start server runtime which vitest doesn't load.
 *
 * ============================================================
 * CONTRACT (locked here; changes require updating this block)
 * ============================================================
 *
 * Worker: getLoggableGamesWorker(userId: string | undefined): Promise<GetLibraryResult>
 * File:   features/compose-journal-entry/api/get-loggable-games.worker.ts
 *
 * Return shape (GetLibraryResult — delegated to getLibrary(userId, {})):
 *   {
 *     items: LibraryItemWithGame[];
 *     total: number;
 *   }
 *
 * Contract:
 *   - userId undefined → throws UnauthorizedError
 *   - userId provided, library is empty → returns { items: [], total: 0 }
 *   - userId provided, library has items → returns all items with game data
 *   - only the requesting user's items are returned (ownership isolation)
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLoggableGamesWorker } from "@/features/compose-journal-entry/api/get-loggable-games.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-loggable-games");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "glg-user-001";
const OTHER_USER_ID = "glg-user-002";

let _igdbCounter = 86_001;
let _itemCounter = 55_001;

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

function makeUser(id: string, suffix: string) {
  return {
    id,
    email: `glg-${suffix}@example.com`,
    name: `GLG User ${suffix}`,
    emailVerified: true,
    username: `glguser${suffix}`,
    usernameNormalized: `glguser${suffix}`,
    isPublicProfile: false,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `glg-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `GLG Game ${suffix}`,
    slug: `glg-game-${suffix}`,
    coverImage: `/covers/glg-${suffix}.jpg`,
    releaseDate: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(userId: string, gameId: string) {
  return {
    id: _itemCounter++,
    userId,
    gameId,
    status: "SHELF" as const,
    statusIsManual: false,
    hasBeenPlayed: false,
    acquisitionType: "DIGITAL" as const,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

describe("getLoggableGamesWorker", () => {
  describe("given userId is undefined (unauthenticated)", () => {
    it("throws UnauthorizedError", async () => {
      await expect(getLoggableGamesWorker(undefined)).rejects.toBeInstanceOf(
        UnauthorizedError
      );
    });
  });

  describe("given the user has an empty library", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser(USER_ID, "empty") });
    });

    it("returns an empty items array", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.items).toEqual([]);
    });

    it("returns total of 0", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.total).toBe(0);
    });
  });

  describe("given the user has library items", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser(USER_ID, "owner") });
      await db.prisma.game.createMany({
        data: [makeGame("a"), makeGame("b"), makeGame("c")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem(USER_ID, "glg-game-a"),
          makeLibraryItem(USER_ID, "glg-game-b"),
          makeLibraryItem(USER_ID, "glg-game-c"),
        ],
      });
    });

    it("returns all library items", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.items).toHaveLength(3);
      expect(result.total).toBe(3);
    });

    it("includes game data (id, slug, title, coverImage) on each item", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      for (const item of result.items) {
        expect(item.game.id).toBeDefined();
        expect(item.game.slug).toBeDefined();
        expect(item.game.title).toBeDefined();
        expect("coverImage" in item.game).toBe(true);
      }
    });

    it("all returned items belong to the requesting user", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.items.every((item) => item.userId === USER_ID)).toBe(true);
    });
  });

  describe("given another user also has library items", () => {
    beforeEach(async () => {
      await db.prisma.user.createMany({
        data: [makeUser(USER_ID, "iso1"), makeUser(OTHER_USER_ID, "iso2")],
      });
      await db.prisma.game.createMany({
        data: [makeGame("iso1"), makeGame("iso2")],
      });
      await db.prisma.libraryItem.createMany({
        data: [
          makeLibraryItem(USER_ID, "glg-game-iso1"),
          makeLibraryItem(OTHER_USER_ID, "glg-game-iso2"),
        ],
      });
    });

    it("returns only the requesting user's items", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]!.userId).toBe(USER_ID);
    });

    it("does not include the other user's items", async () => {
      const result = await getLoggableGamesWorker(USER_ID);

      expect(result.items.some((item) => item.userId === OTHER_USER_ID)).toBe(
        false
      );
    });
  });
});
