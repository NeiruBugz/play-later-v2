/**
 * Integration tests for addGameToLibrary (Slice 10 — game + library write layer).
 *
 * Real Prisma against the isolated test DB for all assertions.
 *
 * Idempotency decision (locked here):
 *   Calling addGameToLibrary twice with the same (userId, gameId) returns the
 *   **existing** LibraryItem rather than throwing. This matches the canonical
 *   quick-add behavior and is appropriate because the LibraryItem schema has no
 *   @@unique([userId, gameId]) constraint — idempotency is enforced at the
 *   application layer. ConflictError is NOT thrown on duplicate.
 */

import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
} from "vitest";

import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("add-game-to-library");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

const IGDB_ID_EXISTING = 76340;

function makeUser(suffix: string) {
  return {
    id: `atl-user-${suffix}`,
    email: `atl-${suffix}@example.com`,
    name: `ATL User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(igdbId: number, suffix: string) {
  return {
    id: `atl-game-${suffix}`,
    igdbId,
    title: `ATL Game ${suffix}`,
    slug: `atl-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("addGameToLibrary", () => {
  // -------------------------------------------------------------------------
  // Happy path — creates LibraryItem
  // -------------------------------------------------------------------------

  describe("given a user and a game already in the DB", () => {
    let seededGame: { id: string };

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("alice") });
      seededGame = await db.prisma.game.create({
        data: makeGame(IGDB_ID_EXISTING, "existing"),
      });
    });

    it("creates and returns a LibraryItem owned by the user", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        gameId: seededGame.id,
        status: "WISHLIST",
        platform: "PC",
      });

      expect(item.userId).toBe("atl-user-alice");
      expect(item.status).toBe("WISHLIST");
      expect(item.platform).toBe("PC");

      const dbRow = await db.prisma.libraryItem.findFirst({
        where: { userId: "atl-user-alice" },
      });
      expect(dbRow).not.toBeNull();
      expect(dbRow?.userId).toBe("atl-user-alice");
    });

    it("stamps the LibraryItem with the correct gameId linked to the Game row", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        gameId: seededGame.id,
      });

      expect(item.gameId).toBe(seededGame.id);
    });

    it("defaults acquisitionType to DIGITAL when not supplied", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        gameId: seededGame.id,
      });

      expect(item.acquisitionType).toBe("DIGITAL");
    });

    it("stores a null platform when none is provided", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        gameId: seededGame.id,
      });

      expect(item.platform).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency — calling twice returns existing, no duplicate row created
  // -------------------------------------------------------------------------

  describe("idempotency on duplicate (userId + gameId)", () => {
    let seededGame: { id: string };

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("carol") });
      seededGame = await db.prisma.game.create({
        data: makeGame(IGDB_ID_EXISTING, "dup"),
      });
    });

    it("does not create a duplicate LibraryItem on second call with same userId + gameId", async () => {
      await addGameToLibrary("atl-user-carol", { gameId: seededGame.id });
      await addGameToLibrary("atl-user-carol", { gameId: seededGame.id });

      const count = await db.prisma.libraryItem.count({
        where: { userId: "atl-user-carol" },
      });
      expect(count).toBe(1);
    });

    it("returns the existing LibraryItem (not a new one) on second call", async () => {
      const first = await addGameToLibrary("atl-user-carol", {
        gameId: seededGame.id,
      });
      const second = await addGameToLibrary("atl-user-carol", {
        gameId: seededGame.id,
      });

      expect(second.id).toBe(first.id);
    });
  });

  // -------------------------------------------------------------------------
  // Ownership isolation — each user gets their own LibraryItem
  // -------------------------------------------------------------------------

  describe("ownership isolation", () => {
    let seededGame: { id: string };

    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("owner1") });
      await db.prisma.user.create({ data: makeUser("owner2") });
      seededGame = await db.prisma.game.create({
        data: makeGame(IGDB_ID_EXISTING, "shared"),
      });
    });

    it("stamps LibraryItem with the caller's userId, not another user's", async () => {
      const item1 = await addGameToLibrary("atl-user-owner1", {
        gameId: seededGame.id,
      });
      const item2 = await addGameToLibrary("atl-user-owner2", {
        gameId: seededGame.id,
      });

      expect(item1.userId).toBe("atl-user-owner1");
      expect(item2.userId).toBe("atl-user-owner2");
      expect(item1.id).not.toBe(item2.id);
    });

    it("creates separate LibraryItems for each user (same game, different owners)", async () => {
      await addGameToLibrary("atl-user-owner1", { gameId: seededGame.id });
      await addGameToLibrary("atl-user-owner2", { gameId: seededGame.id });

      const count = await db.prisma.libraryItem.count();
      expect(count).toBe(2);

      const owner1Items = await db.prisma.libraryItem.findMany({
        where: { userId: "atl-user-owner1" },
      });
      const owner2Items = await db.prisma.libraryItem.findMany({
        where: { userId: "atl-user-owner2" },
      });
      expect(owner1Items).toHaveLength(1);
      expect(owner2Items).toHaveLength(1);
    });
  });

  // -------------------------------------------------------------------------
  // Status options
  // -------------------------------------------------------------------------

  describe("status variants", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("statustest") });
    });

    const statuses = [
      "WISHLIST",
      "SHELF",
      "UP_NEXT",
      "PLAYING",
      "PLAYED",
    ] as const;

    for (const status of statuses) {
      it(`creates LibraryItem with status ${status}`, async () => {
        const igdbId = IGDB_ID_EXISTING + statuses.indexOf(status) + 1;

        const seededGame = await db.prisma.game.create({
          data: makeGame(igdbId, `status-${status.toLowerCase()}`),
        });

        const item = await addGameToLibrary("atl-user-statustest", {
          gameId: seededGame.id,
          status,
        });

        expect(item.status).toBe(status);
        expect(item.userId).toBe("atl-user-statustest");
      });
    }
  });
});
