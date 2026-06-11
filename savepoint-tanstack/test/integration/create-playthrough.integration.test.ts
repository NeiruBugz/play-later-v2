/**
 * Integration tests for the createPlaythrough worker (Slice 3 / spec 016).
 *
 * Imports the WORKER directly — not the createServerFn wrapper. See
 * savepoint-tanstack/FOOT-GUNS.md foot-gun #8: the wrapper requires the
 * TanStack Start server runtime which vitest doesn't load.
 *
 * Covers:
 * - Happy path: PLAYING run → ordinal 1, kind FIRST, playtimeMinutes
 *   converted from hours (×60), LibraryItem.status flipped to PLAYING,
 *   hasBeenPlayed remains false.
 * - Unauthorized path: userId undefined → rejects UnauthorizedError.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { createPlaythroughWorker } from "@/features/manage-playthrough/api/create-playthrough-fn.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("create-playthrough");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

const USER_ID = "create-pt-user-001";

beforeEach(async () => {
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({
    data: {
      id: USER_ID,
      email: "create-pt@example.com",
      name: "Create PT User",
      emailVerified: true,
      username: "createptuser",
      usernameNormalized: "createptuser",
      isPublicProfile: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });

  await db.prisma.game.create({
    data: {
      id: "game-create-pt-001",
      igdbId: 99001,
      title: "Test Game",
      slug: "test-game-create-pt",
      coverImage: null,
      releaseDate: null,
    },
  });

  await db.prisma.libraryItem.create({
    data: {
      userId: USER_ID,
      gameId: "game-create-pt-001",
      status: "SHELF",
      statusIsManual: false,
      hasBeenPlayed: false,
      acquisitionType: "DIGITAL",
    },
  });
});

describe("createPlaythroughWorker", () => {
  describe("given an authenticated user creating their first PLAYING run (2 hours)", () => {
    let libraryItemId: number;

    beforeEach(async () => {
      const item = await db.prisma.libraryItem.findFirstOrThrow({
        where: { userId: USER_ID, gameId: "game-create-pt-001" },
      });
      libraryItemId = item.id;

      await createPlaythroughWorker(USER_ID, {
        libraryItemId,
        status: "PLAYING",
        playtimeHours: 2,
      });
    });

    it("creates a Playthrough row with ordinal 1", async () => {
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId },
      });

      expect(run.ordinal).toBe(1);
    });

    it("assigns kind FIRST to the first run", async () => {
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId },
      });

      expect(run.kind).toBe("FIRST");
    });

    it("converts playtimeHours to playtimeMinutes (2 hours = 120 minutes)", async () => {
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId },
      });

      expect(run.playtimeMinutes).toBe(120);
    });

    it("flips the library item status to PLAYING", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });

      expect(item.status).toBe("PLAYING");
    });

    it("leaves hasBeenPlayed false (PLAYING run does not count as having played)", async () => {
      const item = await db.prisma.libraryItem.findUniqueOrThrow({
        where: { id: libraryItemId },
      });

      expect(item.hasBeenPlayed).toBe(false);
    });
  });

  describe("given an unauthenticated request (userId undefined)", () => {
    it("rejects with UnauthorizedError", async () => {
      const item = await db.prisma.libraryItem.findFirstOrThrow({
        where: { userId: USER_ID, gameId: "game-create-pt-001" },
      });

      await expect(
        createPlaythroughWorker(undefined, {
          libraryItemId: item.id,
          status: "PLAYING",
          playtimeHours: 0,
        })
      ).rejects.toBeInstanceOf(UnauthorizedError);
    });
  });
});
