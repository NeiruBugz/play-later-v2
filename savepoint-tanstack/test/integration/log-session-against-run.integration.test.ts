/**
 * RED integration tests for logging a session against a run (Slice 5 / spec 016).
 *
 * Imports the WORKER directly — not the createServerFn wrapper. See
 * savepoint-tanstack/FOOT-GUNS.md foot-gun #8: the wrapper requires the
 * TanStack Start server runtime which vitest doesn't load.
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Worker: createJournalEntryWorker(userId | undefined, data)
 * File:   features/compose-journal-entry/api/create-journal-entry-fn.worker.ts
 *
 * When `playthroughId` is set:
 *   - Creates a JournalEntry row with that playthroughId.
 *   - Increments the run's playtimeMinutes by the entry's playedMinutes
 *     inside a single transaction.
 *   - The run must belong to the same user; if not → NotFoundError.
 *
 * When `playthroughId` is absent:
 *   - Creates the entry normally; no Playthrough row is touched.
 *
 * Input schema (CREATE_JOURNAL_ENTRY_INPUT):
 *   {
 *     content:        string (may be empty — entity trusts caller)
 *     kind?:          "QUICK" | "REFLECTION"
 *     gameId?:        string | null
 *     playedMinutes?: number (positive int)
 *     playthroughId?: string (min 1)
 *   }
 *
 * ============================================================
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — the worker exists; the integration path for playthroughId
// is not yet tested. The worker file must be present for this import to resolve.
import { createJournalEntryWorker } from "@/features/compose-journal-entry/api/create-journal-entry-fn.worker";
import { NotFoundError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("log-session-against-run");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture IDs
// ---------------------------------------------------------------------------

const OWNER_ID = "lsar-user-owner-001";
const OTHER_USER_ID = "lsar-user-other-001";
const GAME_ID = "lsar-game-001";
const OTHER_GAME_ID = "lsar-other-game-001";

// ---------------------------------------------------------------------------
// Seed helpers
// ---------------------------------------------------------------------------

async function seedOwnerUser() {
  return db.prisma.user.create({
    data: {
      id: OWNER_ID,
      email: "lsar-owner@example.com",
      name: "LSAR Owner",
      emailVerified: true,
      username: "lsarowner",
      usernameNormalized: "lsarowner",
      isPublicProfile: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

async function seedOtherUser() {
  return db.prisma.user.create({
    data: {
      id: OTHER_USER_ID,
      email: "lsar-other@example.com",
      name: "LSAR Other",
      emailVerified: true,
      username: "lsarother",
      usernameNormalized: "lsarother",
      isPublicProfile: false,
      createdAt: new Date("2024-01-01T00:00:00.000Z"),
      updatedAt: new Date("2024-01-01T00:00:00.000Z"),
    },
  });
}

async function seedGame(id: string, slug: string, igdbId: number) {
  return db.prisma.game.create({
    data: {
      id,
      igdbId,
      title: `LSAR Game ${slug}`,
      slug,
      coverImage: null,
      releaseDate: null,
    },
  });
}

async function seedLibraryItemWithRun(
  userId: string,
  gameId: string,
  playtimeMinutes: number
): Promise<{ libraryItemId: number; playthroughId: string }> {
  const item = await db.prisma.libraryItem.create({
    data: {
      userId,
      gameId,
      status: "PLAYING",
      statusIsManual: false,
      hasBeenPlayed: false,
      acquisitionType: "DIGITAL",
    },
  });

  const run = await db.prisma.playthrough.create({
    data: {
      libraryItemId: item.id,
      ordinal: 1,
      kind: "FIRST",
      status: "PLAYING",
      playtimeMinutes,
    },
  });

  return { libraryItemId: item.id, playthroughId: run.id };
}

// ---------------------------------------------------------------------------
// DB reset between tests
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.playthrough.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();
});

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("createJournalEntryWorker — log session against a run", () => {
  // -------------------------------------------------------------------------
  // Case 1: happy path — entry created and run playtime incremented
  // -------------------------------------------------------------------------

  describe("given a valid run belonging to the owner (playtimeMinutes: 60)", () => {
    let playthroughId: string;

    beforeEach(async () => {
      await seedOwnerUser();
      await seedGame(GAME_ID, "lsar-game-001", 50_001);
      ({ playthroughId } = await seedLibraryItemWithRun(OWNER_ID, GAME_ID, 60));
    });

    it("creates a journal entry with the correct playthroughId", async () => {
      const entry = await createJournalEntryWorker(OWNER_ID, {
        content: "",
        playedMinutes: 90,
        playthroughId,
        gameId: GAME_ID,
      });

      expect(entry.playthroughId).toBe(playthroughId);
    });

    it("increments the run's playtimeMinutes by playedMinutes (60 + 90 = 150)", async () => {
      await createJournalEntryWorker(OWNER_ID, {
        content: "",
        playedMinutes: 90,
        playthroughId,
        gameId: GAME_ID,
      });

      const run = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: playthroughId },
      });

      expect(run.playtimeMinutes).toBe(150);
    });

    it("persists the entry row in the database", async () => {
      const entry = await createJournalEntryWorker(OWNER_ID, {
        content: "Quick session note",
        playedMinutes: 30,
        playthroughId,
        gameId: GAME_ID,
      });

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: entry.id },
      });

      expect(row).not.toBeNull();
      expect(row?.playthroughId).toBe(playthroughId);
    });

    it("saves a playtime-only entry when content is empty string", async () => {
      const entry = await createJournalEntryWorker(OWNER_ID, {
        content: "",
        playedMinutes: 45,
        playthroughId,
        gameId: GAME_ID,
      });

      expect(entry.playthroughId).toBe(playthroughId);

      const run = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: playthroughId },
      });
      expect(run.playtimeMinutes).toBe(105); // 60 + 45
    });
  });

  // -------------------------------------------------------------------------
  // Case 2: run belongs to another user → NotFoundError
  // -------------------------------------------------------------------------

  describe("given a run belonging to a DIFFERENT user", () => {
    let otherUserPlaythroughId: string;

    beforeEach(async () => {
      await seedOwnerUser();
      await seedOtherUser();
      await seedGame(GAME_ID, "lsar-game-001", 50_001);
      await seedGame(OTHER_GAME_ID, "lsar-other-game-001", 50_002);

      ({ playthroughId: otherUserPlaythroughId } = await seedLibraryItemWithRun(
        OTHER_USER_ID,
        OTHER_GAME_ID,
        120
      ));
    });

    it("throws NotFoundError when the run is owned by a different user", async () => {
      await expect(
        createJournalEntryWorker(OWNER_ID, {
          content: "",
          playedMinutes: 30,
          playthroughId: otherUserPlaythroughId,
          gameId: OTHER_GAME_ID,
        })
      ).rejects.toBeInstanceOf(NotFoundError);
    });

    it("does not create a journal entry row when ownership fails", async () => {
      const before = await db.prisma.journalEntry.count();

      await expect(
        createJournalEntryWorker(OWNER_ID, {
          content: "",
          playedMinutes: 30,
          playthroughId: otherUserPlaythroughId,
          gameId: OTHER_GAME_ID,
        })
      ).rejects.toBeInstanceOf(NotFoundError);

      const after = await db.prisma.journalEntry.count();
      expect(after).toBe(before);
    });

    it("does not change the other user's run playtimeMinutes when ownership fails", async () => {
      const runBefore = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: otherUserPlaythroughId },
      });

      await expect(
        createJournalEntryWorker(OWNER_ID, {
          content: "",
          playedMinutes: 30,
          playthroughId: otherUserPlaythroughId,
          gameId: OTHER_GAME_ID,
        })
      ).rejects.toBeInstanceOf(NotFoundError);

      const runAfter = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: otherUserPlaythroughId },
      });
      expect(runAfter.playtimeMinutes).toBe(runBefore.playtimeMinutes);
    });
  });

  // -------------------------------------------------------------------------
  // Case 3: no playthroughId → normal entry, no run touched
  // -------------------------------------------------------------------------

  describe("given no playthroughId in the input", () => {
    let playthroughId: string;

    beforeEach(async () => {
      await seedOwnerUser();
      await seedGame(GAME_ID, "lsar-game-001", 50_001);
      ({ playthroughId } = await seedLibraryItemWithRun(OWNER_ID, GAME_ID, 60));
    });

    it("creates an entry without a playthroughId when none is supplied", async () => {
      const entry = await createJournalEntryWorker(OWNER_ID, {
        content: "No run association",
        playedMinutes: 20,
        gameId: GAME_ID,
      });

      expect(entry.playthroughId).toBeNull();
    });

    it("does not change the run's playtimeMinutes when no playthroughId is supplied", async () => {
      const runBefore = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: playthroughId },
      });

      await createJournalEntryWorker(OWNER_ID, {
        content: "Stand-alone note",
        playedMinutes: 20,
        gameId: GAME_ID,
      });

      const runAfter = await db.prisma.playthrough.findUniqueOrThrow({
        where: { id: playthroughId },
      });
      expect(runAfter.playtimeMinutes).toBe(runBefore.playtimeMinutes);
    });
  });
});
