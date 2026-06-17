/**
 * Integration tests for getPlaythroughsBySlug (Spec 025 Slice 3b).
 *
 * Real Prisma against the isolated test DB.
 *
 * ============================================================
 * CONTRACT (locked here; changes require updating this block)
 * ============================================================
 *
 * Function signature:
 *   getPlaythroughsBySlug(userId: string, slug: string): Promise<PlaythroughsBySlugResult>
 *
 * Return shape (PlaythroughsBySlugResult):
 *   {
 *     gameId: string;
 *     playthroughs: PlaythroughWithEntries[];  // includes journalEntries, ordinal desc
 *   }
 *
 * Contract:
 *   - slug not found → throws NotFoundError ("Game not found")
 *   - game found but NOT in user's library → returns { gameId, playthroughs: [] }
 *   - game in library with no playthroughs → returns { gameId, playthroughs: [] }
 *   - game in library with playthroughs → returns them (ordinal desc, with journalEntries)
 *   - another user's playthroughs are never returned (anti-enumeration: returns []
 *     when user has no library item, regardless of whether another user has one)
 *
 * Note: "not in library" and "another user's library" both yield playthroughs: []
 * (not a throw) — the function only throws NotFoundError for an unknown slug.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getPlaythroughsBySlug } from "@/entities/playthrough/api/get-playthroughs-by-slug.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-playthroughs-by-slug");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const OWNER_ID = "gpbs-user-owner-001";
const OTHER_USER_ID = "gpbs-user-other-001";
const GAME_ID = "gpbs-game-001";
const GAME_SLUG = "gpbs-game-slug-001";
const IGDB_ID = 88_001;

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

async function seedUsers() {
  await db.prisma.user.createMany({
    data: [
      {
        id: OWNER_ID,
        email: "gpbs-owner@example.com",
        name: "GPBS Owner",
        emailVerified: true,
        username: "gpbsowner",
        usernameNormalized: "gpbsowner",
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
      {
        id: OTHER_USER_ID,
        email: "gpbs-other@example.com",
        name: "GPBS Other",
        emailVerified: true,
        username: "gpbsother",
        usernameNormalized: "gpbsother",
        isPublicProfile: false,
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        updatedAt: new Date("2024-01-01T00:00:00.000Z"),
      },
    ],
  });
}

async function seedGame() {
  return db.prisma.game.create({
    data: {
      id: GAME_ID,
      igdbId: IGDB_ID,
      title: "GPBS Test Game",
      slug: GAME_SLUG,
      coverImage: "/covers/gpbs.jpg",
      releaseDate: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

async function seedLibraryItem(userId: string): Promise<number> {
  const item = await db.prisma.libraryItem.create({
    data: {
      userId,
      gameId: GAME_ID,
      status: "PLAYING",
      statusIsManual: false,
      hasBeenPlayed: false,
      acquisitionType: "DIGITAL",
    },
  });
  return item.id;
}

async function seedPlaythrough(
  libraryItemId: number,
  ordinal: number,
  overrides: {
    status?: "PLAYING" | "FINISHED" | "ABANDONED";
    platform?: string;
    startedAt?: Date;
    finishedAt?: Date;
    rating?: number;
    notes?: string;
  } = {}
): Promise<string> {
  const run = await db.prisma.playthrough.create({
    data: {
      libraryItemId,
      ordinal,
      kind: ordinal === 1 ? "FIRST" : "REPLAY",
      status: overrides.status ?? "PLAYING",
      platform: overrides.platform ?? null,
      startedAt: overrides.startedAt ?? new Date("2024-03-01T00:00:00.000Z"),
      finishedAt: overrides.finishedAt ?? null,
      rating: overrides.rating ?? null,
      notes: overrides.notes ?? null,
      playtimeMinutes: 0,
      createdAt: new Date(`2024-0${ordinal}-01T00:00:00.000Z`),
      updatedAt: new Date(`2024-0${ordinal}-01T00:00:00.000Z`),
    },
  });
  return run.id;
}

describe("getPlaythroughsBySlug", () => {
  describe("given the slug does not exist in the database", () => {
    beforeEach(async () => {
      await seedUsers();
    });

    it("throws NotFoundError", async () => {
      await expect(
        getPlaythroughsBySlug(OWNER_ID, "nonexistent-slug")
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given the game exists but is not in the user's library", () => {
    beforeEach(async () => {
      await seedUsers();
      await seedGame();
      // OTHER_USER_ID has a library item; OWNER_ID does not
      const itemId = await seedLibraryItem(OTHER_USER_ID);
      await seedPlaythrough(itemId, 1);
    });

    it("returns the correct gameId with an empty playthroughs array", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      expect(result.gameId).toBe(GAME_ID);
      expect(result.playthroughs).toEqual([]);
    });
  });

  describe("given the user has a library item for the game but no playthroughs", () => {
    beforeEach(async () => {
      await seedUsers();
      await seedGame();
      await seedLibraryItem(OWNER_ID);
    });

    it("returns the correct gameId with an empty playthroughs array", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      expect(result.gameId).toBe(GAME_ID);
      expect(result.playthroughs).toEqual([]);
    });
  });

  describe("given the user has two playthroughs for the game", () => {
    let firstRunId: string;
    let secondRunId: string;

    beforeEach(async () => {
      await seedUsers();
      await seedGame();
      const itemId = await seedLibraryItem(OWNER_ID);
      firstRunId = await seedPlaythrough(itemId, 1, {
        status: "FINISHED",
        platform: "PC",
        finishedAt: new Date("2024-02-01T00:00:00.000Z"),
        rating: 8,
        notes: "First time through",
      });
      secondRunId = await seedPlaythrough(itemId, 2, {
        status: "PLAYING",
        platform: "PS5",
      });
    });

    it("returns both playthroughs ordered by ordinal descending", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      expect(result.playthroughs).toHaveLength(2);
      expect(result.playthroughs[0]!.id).toBe(secondRunId);
      expect(result.playthroughs[1]!.id).toBe(firstRunId);
    });

    it("returns the correct gameId", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      expect(result.gameId).toBe(GAME_ID);
    });

    it("includes journalEntries on each playthrough", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      for (const pt of result.playthroughs) {
        expect(Array.isArray(pt.journalEntries)).toBe(true);
      }
    });

    it("includes the full playthrough fields (status, platform, rating, notes)", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);
      const finished = result.playthroughs[1]!;

      expect(finished.status).toBe("FINISHED");
      expect(finished.platform).toBe("PC");
      expect(finished.rating).toBe(8);
      expect(finished.notes).toBe("First time through");
    });
  });

  describe("given another user has playthroughs for the same game", () => {
    beforeEach(async () => {
      await seedUsers();
      await seedGame();
      const ownerItemId = await seedLibraryItem(OWNER_ID);
      await seedPlaythrough(ownerItemId, 1, { status: "PLAYING" });
      const otherItemId = await seedLibraryItem(OTHER_USER_ID);
      await seedPlaythrough(otherItemId, 1, { status: "FINISHED", rating: 10 });
    });

    it("returns only the requesting user's playthroughs", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      expect(result.playthroughs).toHaveLength(1);
      expect(result.playthroughs[0]!.status).toBe("PLAYING");
    });

    it("does not expose the other user's playthroughs when querying as owner", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);

      const otherUserRating = result.playthroughs.find(
        (pt) => pt.rating === 10
      );
      expect(otherUserRating).toBeUndefined();
    });
  });

  describe("given a playthrough has journal entries", () => {
    let playthroughId: string;

    beforeEach(async () => {
      await seedUsers();
      await seedGame();
      const itemId = await seedLibraryItem(OWNER_ID);
      playthroughId = await seedPlaythrough(itemId, 1, { status: "PLAYING" });
      await db.prisma.journalEntry.createMany({
        data: [
          {
            userId: OWNER_ID,
            gameId: GAME_ID,
            playthroughId,
            content: "First session",
            kind: "QUICK",
            playedMinutes: 60,
            createdAt: new Date("2024-03-10T00:00:00.000Z"),
            updatedAt: new Date("2024-03-10T00:00:00.000Z"),
          },
          {
            userId: OWNER_ID,
            gameId: GAME_ID,
            playthroughId,
            content: "Second session",
            kind: "QUICK",
            playedMinutes: 45,
            createdAt: new Date("2024-03-15T00:00:00.000Z"),
            updatedAt: new Date("2024-03-15T00:00:00.000Z"),
          },
        ],
      });
    });

    it("includes all journal entries for the playthrough", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);
      const pt = result.playthroughs[0]!;

      expect(pt.journalEntries).toHaveLength(2);
    });

    it("orders journal entries newest-first", async () => {
      const result = await getPlaythroughsBySlug(OWNER_ID, GAME_SLUG);
      const entries = result.playthroughs[0]!.journalEntries;

      expect(entries[0]!.content).toBe("Second session");
      expect(entries[1]!.content).toBe("First session");
    });
  });
});
