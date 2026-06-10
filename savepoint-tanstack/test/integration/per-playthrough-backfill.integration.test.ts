/**
 * Integration test for the Slice 1 data backfill (spec 016 — Per-Playthrough Logs).
 *
 * Approach: replay-SQL
 *   The backfill is idempotent SQL embedded in an already-applied migration
 *   (20260610162903_per_playthrough_logs/migration.sql). Rather than re-running
 *   the entire migration — which `prisma migrate deploy` already executes on the
 *   isolated DB — we:
 *   1. Seed fixtures AFTER `setupIsolatedDatabase` (which applies all migrations,
 *      leaving the backfill tables empty).
 *   2. Re-run the two verbatim backfill SQL blocks via `prisma.$executeRawUnsafe`.
 *   3. Assert invariants.
 *
 * This lets the test exercise the real production SQL against known fixtures and
 * verify idempotency cheaply (run it twice, assert no duplicates).
 *
 * Invariants under test (spec 016 tech §4, Slice 1 task line):
 *   - Exactly one Playthrough (ordinal=1, kind=FIRST) per PLAYED/PLAYING item.
 *   - Zero Playthroughs for WISHLIST items.
 *   - Run status: PLAYED → FINISHED, PLAYING → PLAYING.
 *   - playtimeMinutes == Σ JournalEntry.playedMinutes for that item (0 when none).
 *   - rating / startedAt / finishedAt(←completedAt) / platform copied from LibraryItem.
 *   - JournalEntry.playthroughId re-pointed to the new run for played items.
 *   - Wishlist item's JournalEntry.playthroughId stays null.
 *   - statusIsManual = false for every LibraryItem.
 *   - Idempotency: a second run creates no extra Playthroughs and changes nothing.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Backfill SQL — copied verbatim from the migration so the test exercises the
// real production statements, not a paraphrase of them.
// ---------------------------------------------------------------------------

const BACKFILL_INSERT_SQL = `
INSERT INTO "Playthrough" (
  "id",
  "libraryItemId",
  "ordinal",
  "kind",
  "status",
  "platform",
  "startedAt",
  "finishedAt",
  "playtimeMinutes",
  "rating",
  "createdAt",
  "updatedAt"
)
SELECT
  'backfill-' || li.id::text || '-' || md5(random()::text),
  li.id,
  1,
  'FIRST'::"PlaythroughKind",
  CASE li.status
    WHEN 'PLAYED'   THEN 'FINISHED'::"PlaythroughStatus"
    WHEN 'PLAYING'  THEN 'PLAYING'::"PlaythroughStatus"
  END,
  li.platform,
  li."startedAt",
  li."completedAt",
  COALESCE((
    SELECT SUM(je."playedMinutes")
    FROM "JournalEntry" je
    WHERE je."libraryItemId" = li.id
  ), 0),
  li.rating,
  NOW(),
  NOW()
FROM "LibraryItem" li
WHERE li.status IN ('PLAYING', 'PLAYED')
  AND NOT EXISTS (
    SELECT 1 FROM "Playthrough" p WHERE p."libraryItemId" = li.id
  );
`;

const BACKFILL_UPDATE_SQL = `
UPDATE "JournalEntry" je
SET "playthroughId" = p.id
FROM "Playthrough" p
WHERE p."libraryItemId" = je."libraryItemId"
  AND je."playthroughId" IS NULL
  AND je."libraryItemId" IS NOT NULL;
`;

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("per-playthrough-backfill");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture IDs  (prefix "ppb" = per-playthrough-backfill)
// ---------------------------------------------------------------------------

const USER_ID = "ppb-user-1";
const GAME_ID_A = "ppb-game-a";
const GAME_ID_B = "ppb-game-b";
const GAME_ID_C = "ppb-game-c";
const GAME_ID_D = "ppb-game-d";

const STARTED_AT = new Date("2024-01-01T00:00:00.000Z");
const COMPLETED_AT = new Date("2024-03-15T00:00:00.000Z");

function makeUser() {
  return {
    id: USER_ID,
    email: "ppb@example.com",
    name: "PPB User",
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(id: string, igdbId: number) {
  return {
    id,
    igdbId,
    title: `PPB Game ${id}`,
    slug: id,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// beforeEach: clean slate, then seed fixtures
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Delete in FK-safe order (children before parents).
  await db.prisma.playthrough.deleteMany();
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  // Seed user + games.
  await db.prisma.user.create({ data: makeUser() });
  await db.prisma.game.createMany({
    data: [
      makeGame(GAME_ID_A, 50_001),
      makeGame(GAME_ID_B, 50_002),
      makeGame(GAME_ID_C, 50_003),
      makeGame(GAME_ID_D, 50_004),
    ],
  });

  // Case 1: PLAYED with 2 journal entries (120 + 60 = 180 minutes).
  const itemA = await db.prisma.libraryItem.create({
    data: {
      userId: USER_ID,
      gameId: GAME_ID_A,
      status: "PLAYED",
      platform: "PC",
      rating: 8,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
    },
  });
  await db.prisma.journalEntry.createMany({
    data: [
      {
        userId: USER_ID,
        libraryItemId: itemA.id,
        content: "Session one",
        playedMinutes: 120,
      },
      {
        userId: USER_ID,
        libraryItemId: itemA.id,
        content: "Session two",
        playedMinutes: 60,
      },
    ],
  });

  // Case 2: PLAYED with no journal entries (playtime = 0).
  await db.prisma.libraryItem.create({
    data: {
      userId: USER_ID,
      gameId: GAME_ID_B,
      status: "PLAYED",
      platform: "PS5",
      rating: 6,
      startedAt: STARTED_AT,
      completedAt: COMPLETED_AT,
    },
  });

  // Case 3: PLAYING with one journal entry.
  const itemC = await db.prisma.libraryItem.create({
    data: {
      userId: USER_ID,
      gameId: GAME_ID_C,
      status: "PLAYING",
      platform: "Switch",
      startedAt: STARTED_AT,
    },
  });
  await db.prisma.journalEntry.create({
    data: {
      userId: USER_ID,
      libraryItemId: itemC.id,
      content: "Just started",
      playedMinutes: 45,
    },
  });

  // Case 4: WISHLIST — must stay untouched (zero runs, entries stay unlinked).
  const itemD = await db.prisma.libraryItem.create({
    data: {
      userId: USER_ID,
      gameId: GAME_ID_D,
      status: "WISHLIST",
    },
  });
  // Add an entry for the wishlist item to verify it stays null.
  await db.prisma.journalEntry.create({
    data: {
      userId: USER_ID,
      libraryItemId: itemD.id,
      content: "Wishlist note",
    },
  });
});

// ---------------------------------------------------------------------------
// Helper: run the verbatim backfill SQL.
// ---------------------------------------------------------------------------

async function runBackfill() {
  await db.prisma.$executeRawUnsafe(BACKFILL_INSERT_SQL);
  await db.prisma.$executeRawUnsafe(BACKFILL_UPDATE_SQL);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("per-playthrough migration backfill", () => {
  describe("given PLAYED/PLAYING/WISHLIST library items after running the backfill SQL", () => {
    beforeEach(async () => {
      await runBackfill();
    });

    it("creates exactly one Playthrough for the PLAYED item with sessions (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemA.id },
      });
      expect(runs).toHaveLength(1);
    });

    it("creates exactly one Playthrough for the PLAYED item without sessions (case 2)", async () => {
      const itemB = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_B },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemB.id },
      });
      expect(runs).toHaveLength(1);
    });

    it("creates exactly one Playthrough for the PLAYING item (case 3)", async () => {
      const itemC = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_C },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemC.id },
      });
      expect(runs).toHaveLength(1);
    });

    it("creates zero Playthroughs for the WISHLIST item (case 4)", async () => {
      const itemD = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_D },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemD.id },
      });
      expect(runs).toHaveLength(0);
    });

    it("sets ordinal=1 and kind=FIRST on every backfilled run", async () => {
      const allRuns = await db.prisma.playthrough.findMany();
      for (const run of allRuns) {
        expect(run.ordinal).toBe(1);
        expect(run.kind).toBe("FIRST");
      }
    });

    it("maps PLAYED → FINISHED run status (cases 1 and 2)", async () => {
      const [itemA, itemB] = await Promise.all([
        db.prisma.libraryItem.findFirstOrThrow({
          where: { gameId: GAME_ID_A },
        }),
        db.prisma.libraryItem.findFirstOrThrow({
          where: { gameId: GAME_ID_B },
        }),
      ]);
      const [runA, runB] = await Promise.all([
        db.prisma.playthrough.findFirstOrThrow({
          where: { libraryItemId: itemA.id },
        }),
        db.prisma.playthrough.findFirstOrThrow({
          where: { libraryItemId: itemB.id },
        }),
      ]);
      expect(runA.status).toBe("FINISHED");
      expect(runB.status).toBe("FINISHED");
    });

    it("maps PLAYING → PLAYING run status (case 3)", async () => {
      const itemC = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_C },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemC.id },
      });
      expect(run.status).toBe("PLAYING");
    });

    it("sets playtimeMinutes to the sum of journal entries for the item with sessions (case 1 → 180)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      expect(run.playtimeMinutes).toBe(180);
    });

    it("sets playtimeMinutes to 0 for the item with no sessions (case 2)", async () => {
      const itemB = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_B },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemB.id },
      });
      expect(run.playtimeMinutes).toBe(0);
    });

    it("copies rating from LibraryItem onto the run (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      expect(run.rating).toBe(8);
    });

    it("copies startedAt from LibraryItem onto the run (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      expect(run.startedAt?.toISOString()).toBe(STARTED_AT.toISOString());
    });

    it("copies completedAt → finishedAt from LibraryItem onto the run (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      expect(run.finishedAt?.toISOString()).toBe(COMPLETED_AT.toISOString());
    });

    it("copies platform from LibraryItem onto the run (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      expect(run.platform).toBe("PC");
    });

    it("re-points JournalEntry.playthroughId to the new run for the PLAYED item with sessions (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      const entries = await db.prisma.journalEntry.findMany({
        where: { libraryItemId: itemA.id },
      });
      expect(entries).toHaveLength(2);
      for (const entry of entries) {
        expect(entry.playthroughId).toBe(run.id);
      }
    });

    it("re-points JournalEntry.playthroughId to the new run for the PLAYING item (case 3)", async () => {
      const itemC = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_C },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemC.id },
      });
      const entries = await db.prisma.journalEntry.findMany({
        where: { libraryItemId: itemC.id },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]!.playthroughId).toBe(run.id);
    });

    it("leaves JournalEntry.playthroughId null for the WISHLIST item's entry (case 4)", async () => {
      const itemD = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_D },
      });
      const entries = await db.prisma.journalEntry.findMany({
        where: { libraryItemId: itemD.id },
      });
      expect(entries).toHaveLength(1);
      expect(entries[0]!.playthroughId).toBeNull();
    });

    it("leaves statusIsManual = false on every LibraryItem", async () => {
      const allItems = await db.prisma.libraryItem.findMany();
      for (const item of allItems) {
        expect(item.statusIsManual).toBe(false);
      }
    });
  });

  describe("idempotency: running the backfill SQL a second time", () => {
    beforeEach(async () => {
      await runBackfill();
      await runBackfill();
    });

    it("does not create duplicate Playthroughs for the PLAYED item with sessions (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemA.id },
      });
      expect(runs).toHaveLength(1);
    });

    it("does not create duplicate Playthroughs for the PLAYED item without sessions (case 2)", async () => {
      const itemB = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_B },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemB.id },
      });
      expect(runs).toHaveLength(1);
    });

    it("does not create duplicate Playthroughs for the PLAYING item (case 3)", async () => {
      const itemC = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_C },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemC.id },
      });
      expect(runs).toHaveLength(1);
    });

    it("still creates zero Playthroughs for the WISHLIST item after two runs (case 4)", async () => {
      const itemD = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_D },
      });
      const runs = await db.prisma.playthrough.findMany({
        where: { libraryItemId: itemD.id },
      });
      expect(runs).toHaveLength(0);
    });

    it("preserves playtimeMinutes after the second run (case 1 → still 180)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      expect(run.playtimeMinutes).toBe(180);
    });

    it("keeps JournalEntry.playthroughId pointing to the correct run after the second run (case 1)", async () => {
      const itemA = await db.prisma.libraryItem.findFirstOrThrow({
        where: { gameId: GAME_ID_A },
      });
      const run = await db.prisma.playthrough.findFirstOrThrow({
        where: { libraryItemId: itemA.id },
      });
      const entries = await db.prisma.journalEntry.findMany({
        where: { libraryItemId: itemA.id },
      });
      for (const entry of entries) {
        expect(entry.playthroughId).toBe(run.id);
      }
    });
  });
});
