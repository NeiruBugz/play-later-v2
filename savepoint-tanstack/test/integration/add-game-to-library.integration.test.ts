/**
 * RED integration test for addGameToLibrary (Slice 10 — game + library write layer).
 *
 * This test is intentionally failing: `@/entities/library-item/api/add-game-to-library.server`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * IGDB HTTP transport is fully mocked via vi.stubGlobal("fetch", ...) for
 * the cache-miss path (upsertGameFromIgdb is composed internally). Real Prisma
 * against the isolated test DB for all assertions.
 *
 * Idempotency decision (locked here):
 *   Calling addGameToLibrary twice with the same (userId, igdbId) returns the
 *   **existing** LibraryItem rather than throwing. This matches the canonical
 *   quick-add behavior and is appropriate because the LibraryItem schema has no
 *   @@unique([userId, gameId]) constraint — idempotency is enforced at the
 *   application layer. ConflictError is NOT thrown on duplicate.
 */

import { afterAll, afterEach, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { addGameToLibrary } from "@/entities/library-item/api/add-game-to-library.server";

import { __resetTokenCacheForTests } from "@/shared/api/igdb/token";

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
const IGDB_ID_NEW = 119171; // game not seeded — triggers cache-miss path

const FAKE_TOKEN_RESPONSE = {
  access_token: "tok",
  expires_in: 3600,
  token_type: "bearer",
};

const MOCK_IGDB_GAME = {
  id: IGDB_ID_NEW,
  name: "Hollow Knight: Silksong",
  slug: "hollow-knight-silksong",
  cover: {
    id: 300001,
    image_id: "silksong_cover",
    url: "//images.igdb.com/igdb/image/upload/t_cover_big/silksong_cover.jpg",
  },
  first_release_date: null,
  platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
};

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
// IGDB fetch mock (mirrors search-games.integration.test.ts pattern)
// ---------------------------------------------------------------------------

function makeFetchMock(
  igdbBody: unknown = [MOCK_IGDB_GAME]
) {
  return vi.fn().mockImplementation((url: string) => {
    if (url.includes("id.twitch.tv")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => FAKE_TOKEN_RESPONSE,
      } as Response);
    }
    if (url.includes("api.igdb.com")) {
      return Promise.resolve({
        ok: true,
        status: 200,
        statusText: "OK",
        json: async () => igdbBody,
      } as Response);
    }
    return Promise.reject(new Error(`Unexpected fetch URL in test: ${url}`));
  });
}

beforeEach(() => {
  __resetTokenCacheForTests();
  vi.stubGlobal("fetch", makeFetchMock());
});

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("addGameToLibrary", () => {
  // -------------------------------------------------------------------------
  // Happy path — creates LibraryItem
  // -------------------------------------------------------------------------

  describe("given a user and a game already in the DB", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("alice") });
      await db.prisma.game.create({ data: makeGame(IGDB_ID_EXISTING, "existing") });
    });

    it("creates and returns a LibraryItem owned by the user", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        igdbId: IGDB_ID_EXISTING,
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
        igdbId: IGDB_ID_EXISTING,
      });

      const game = await db.prisma.game.findUnique({
        where: { igdbId: IGDB_ID_EXISTING },
      });
      expect(item.gameId).toBe(game?.id);
    });

    it("defaults acquisitionType to DIGITAL when not supplied", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        igdbId: IGDB_ID_EXISTING,
      });

      expect(item.acquisitionType).toBe("DIGITAL");
    });

    it("stores a null platform when none is provided", async () => {
      const item = await addGameToLibrary("atl-user-alice", {
        igdbId: IGDB_ID_EXISTING,
      });

      expect(item.platform).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Cache-miss path — upserts Game from IGDB then creates LibraryItem
  // -------------------------------------------------------------------------

  describe("given a user and a game NOT yet in the DB", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("bob") });
    });

    it("fetches game from IGDB, inserts it, then creates LibraryItem", async () => {
      const before = await db.prisma.game.findUnique({
        where: { igdbId: IGDB_ID_NEW },
      });
      expect(before).toBeNull();

      const item = await addGameToLibrary("atl-user-bob", {
        igdbId: IGDB_ID_NEW,
        status: "UP_NEXT",
      });

      const game = await db.prisma.game.findUnique({
        where: { igdbId: IGDB_ID_NEW },
      });
      expect(game).not.toBeNull();
      expect(item.userId).toBe("atl-user-bob");
      expect(item.gameId).toBe(game?.id);
      expect(item.status).toBe("UP_NEXT");
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency — calling twice returns existing, no duplicate row created
  // -------------------------------------------------------------------------

  describe("idempotency on duplicate (userId + igdbId)", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("carol") });
      await db.prisma.game.create({ data: makeGame(IGDB_ID_EXISTING, "dup") });
    });

    it("does not create a duplicate LibraryItem on second call with same userId + igdbId", async () => {
      await addGameToLibrary("atl-user-carol", { igdbId: IGDB_ID_EXISTING });
      await addGameToLibrary("atl-user-carol", { igdbId: IGDB_ID_EXISTING });

      const count = await db.prisma.libraryItem.count({
        where: { userId: "atl-user-carol" },
      });
      expect(count).toBe(1);
    });

    it("returns the existing LibraryItem (not a new one) on second call", async () => {
      const first = await addGameToLibrary("atl-user-carol", {
        igdbId: IGDB_ID_EXISTING,
      });
      const second = await addGameToLibrary("atl-user-carol", {
        igdbId: IGDB_ID_EXISTING,
      });

      expect(second.id).toBe(first.id);
    });
  });

  // -------------------------------------------------------------------------
  // Ownership isolation — each user gets their own LibraryItem
  // -------------------------------------------------------------------------

  describe("ownership isolation", () => {
    beforeEach(async () => {
      await db.prisma.user.create({ data: makeUser("owner1") });
      await db.prisma.user.create({ data: makeUser("owner2") });
      await db.prisma.game.create({ data: makeGame(IGDB_ID_EXISTING, "shared") });
    });

    it("stamps LibraryItem with the caller's userId, not another user's", async () => {
      const item1 = await addGameToLibrary("atl-user-owner1", {
        igdbId: IGDB_ID_EXISTING,
      });
      const item2 = await addGameToLibrary("atl-user-owner2", {
        igdbId: IGDB_ID_EXISTING,
      });

      expect(item1.userId).toBe("atl-user-owner1");
      expect(item2.userId).toBe("atl-user-owner2");
      expect(item1.id).not.toBe(item2.id);
    });

    it("creates separate LibraryItems for each user (same game, different owners)", async () => {
      await addGameToLibrary("atl-user-owner1", { igdbId: IGDB_ID_EXISTING });
      await addGameToLibrary("atl-user-owner2", { igdbId: IGDB_ID_EXISTING });

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
      await db.prisma.game.create({ data: makeGame(IGDB_ID_EXISTING, "statusgame") });
    });

    const statuses = ["WISHLIST", "SHELF", "UP_NEXT", "PLAYING", "PLAYED"] as const;

    for (const status of statuses) {
      it(`creates LibraryItem with status ${status}`, async () => {
        // Use unique igdbId per status to avoid triggering idempotency.
        const igdbId = IGDB_ID_EXISTING + statuses.indexOf(status) + 1;

        // Seed a game row for each unique igdbId.
        await db.prisma.game.create({
          data: makeGame(igdbId, `status-${status.toLowerCase()}`),
        });

        const item = await addGameToLibrary("atl-user-statustest", {
          igdbId,
          status,
        });

        expect(item.status).toBe(status);
        expect(item.userId).toBe("atl-user-statustest");
      });
    }
  });
});
