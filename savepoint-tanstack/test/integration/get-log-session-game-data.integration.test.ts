/**
 * Integration tests for getLogSessionGameDataWorker (Spec 025 Slice 3b).
 *
 * Imports the WORKER directly — not the createServerFn wrapper. See
 * savepoint-tanstack/FOOT-GUNS.md foot-gun #8: the wrapper requires the
 * TanStack Start server runtime which vitest doesn't load.
 *
 * ============================================================
 * CONTRACT (locked here; changes require updating this block)
 * ============================================================
 *
 * Worker: getLogSessionGameDataWorker(userId: string | undefined, data: unknown)
 * File:   features/compose-journal-entry/api/get-log-session-game-data.worker.ts
 *
 * Return shape (GetLogSessionGameDataResult):
 *   {
 *     gameId: string;
 *     playthroughs: PlaythroughWithEntries[];
 *     preselectedPlaythroughId: string;  // "" when empty
 *   }
 *
 * Contract:
 *   - userId undefined → throws UnauthorizedError
 *   - invalid input (missing slug, empty slug) → throws ZodError
 *   - slug not found in DB → throws NotFoundError
 *   - game found, user has no library item → gameId set, playthroughs: [], preselectedPlaythroughId: ""
 *   - game found, user has playthroughs → returns them with a sensible preselectedPlaythroughId
 *   - preselectedPlaythroughId prefers PLAYING run over most-recent (ordinal desc fallback)
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getLogSessionGameDataWorker } from "@/features/compose-journal-entry/api/get-log-session-game-data.worker";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-log-session-game-data");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "glsgd-user-001";
const GAME_ID = "glsgd-game-001";
const GAME_SLUG = "glsgd-game-slug-001";
const IGDB_ID = 87_001;

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

async function seedUser() {
  return db.prisma.user.create({
    data: {
      id: USER_ID,
      email: "glsgd@example.com",
      name: "GLSGD User",
      emailVerified: true,
      username: "glsgduser",
      usernameNormalized: "glsgduser",
      isPublicProfile: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

async function seedGame() {
  return db.prisma.game.create({
    data: {
      id: GAME_ID,
      igdbId: IGDB_ID,
      title: "GLSGD Test Game",
      slug: GAME_SLUG,
      coverImage: "/covers/glsgd.jpg",
      releaseDate: null,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

async function seedLibraryItem(): Promise<number> {
  const item = await db.prisma.libraryItem.create({
    data: {
      userId: USER_ID,
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
  status: "PLAYING" | "FINISHED" | "ABANDONED" = "PLAYING"
): Promise<string> {
  const run = await db.prisma.playthrough.create({
    data: {
      libraryItemId,
      ordinal,
      kind: ordinal === 1 ? "FIRST" : "REPLAY",
      status,
      playtimeMinutes: 0,
      createdAt: new Date(`2024-0${ordinal}-01T00:00:00.000Z`),
      updatedAt: new Date(`2024-0${ordinal}-01T00:00:00.000Z`),
    },
  });
  return run.id;
}

describe("getLogSessionGameDataWorker", () => {
  describe("given userId is undefined (unauthenticated)", () => {
    it("throws UnauthorizedError", async () => {
      await expect(
        getLogSessionGameDataWorker(undefined, { slug: GAME_SLUG })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });

  describe("given invalid input (missing slug)", () => {
    beforeEach(async () => {
      await seedUser();
    });

    it("throws when slug is missing", async () => {
      await expect(getLogSessionGameDataWorker(USER_ID, {})).rejects.toThrow();
    });

    it("throws when slug is an empty string", async () => {
      await expect(
        getLogSessionGameDataWorker(USER_ID, { slug: "" })
      ).rejects.toThrow();
    });
  });

  describe("given the slug does not exist in the database", () => {
    beforeEach(async () => {
      await seedUser();
    });

    it("throws NotFoundError", async () => {
      await expect(
        getLogSessionGameDataWorker(USER_ID, { slug: "nonexistent-slug" })
      ).rejects.toBeInstanceOf(NotFoundError);
    });
  });

  describe("given the game exists but the user has no library item", () => {
    beforeEach(async () => {
      await seedUser();
      await seedGame();
    });

    it("returns the gameId with an empty playthroughs array", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.gameId).toBe(GAME_ID);
      expect(result.playthroughs).toEqual([]);
    });

    it("returns an empty string for preselectedPlaythroughId when no playthroughs exist", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.preselectedPlaythroughId).toBe("");
    });
  });

  describe("given the user has a single FINISHED playthrough", () => {
    let playthroughId: string;

    beforeEach(async () => {
      await seedUser();
      await seedGame();
      const itemId = await seedLibraryItem();
      playthroughId = await seedPlaythrough(itemId, 1, "FINISHED");
    });

    it("returns the game's id, playthroughs, and preselects the only run", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.gameId).toBe(GAME_ID);
      expect(result.playthroughs).toHaveLength(1);
      expect(result.preselectedPlaythroughId).toBe(playthroughId);
    });

    it("includes journalEntries on each returned playthrough", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(Array.isArray(result.playthroughs[0]!.journalEntries)).toBe(true);
    });
  });

  describe("given the user has two playthroughs (one FINISHED, one PLAYING)", () => {
    let finishedId: string;
    let playingId: string;

    beforeEach(async () => {
      await seedUser();
      await seedGame();
      const itemId = await seedLibraryItem();
      finishedId = await seedPlaythrough(itemId, 1, "FINISHED");
      playingId = await seedPlaythrough(itemId, 2, "PLAYING");
    });

    it("preselects the PLAYING run over the most-recent by ordinal", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.preselectedPlaythroughId).toBe(playingId);
    });

    it("returns all playthroughs ordered by ordinal descending", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.playthroughs).toHaveLength(2);
      expect(result.playthroughs[0]!.id).toBe(playingId);
      expect(result.playthroughs[1]!.id).toBe(finishedId);
    });
  });

  describe("given the user has two FINISHED playthroughs (no PLAYING run)", () => {
    let olderId: string;
    let newerId: string;

    beforeEach(async () => {
      await seedUser();
      await seedGame();
      const itemId = await seedLibraryItem();
      olderId = await seedPlaythrough(itemId, 1, "FINISHED");
      newerId = await seedPlaythrough(itemId, 2, "FINISHED");
    });

    it("falls back to preselecting the most-recent run (ordinal desc = index 0)", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.preselectedPlaythroughId).toBe(newerId);
    });

    it("does not preselect the older run", async () => {
      const result = await getLogSessionGameDataWorker(USER_ID, {
        slug: GAME_SLUG,
      });

      expect(result.preselectedPlaythroughId).not.toBe(olderId);
    });
  });
});
