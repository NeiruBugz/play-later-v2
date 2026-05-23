/**
 * RED integration test for deleteJournalEntry (Slice 16 — journal entry CRUD).
 *
 * This test is intentionally failing: `@/entities/journal-entry/api/delete-journal-entry.server`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * Real Prisma against the isolated test DB for all assertions.
 * No mocks — pure DB mutation.
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Signature:
 *   deleteJournalEntry(userId: string, entryId: string): Promise<void>
 *
 * Return type (locked):
 *   Returns Promise<void>. The deleted row is NOT returned. Callers that need
 *   the pre-delete state must read it before calling deleteJournalEntry.
 *   Mirrors deleteLibraryItem — same rationale: optimistic-UI callers already
 *   hold the id and the stale state; returning the deleted row adds no value.
 *
 * Error ordering (deliberate divergence from canonical savepoint-app):
 *   Same two-step check as updateJournalEntry and updateLibraryItem:
 *     1. findUnique({ where: { id: entryId } }) → if null  → NotFoundError
 *     2. if row.userId !== userId               → UnauthorizedError
 *     3. proceed with delete
 *   This is NOT a combined findFirst({ where: { id, userId } }) — that
 *   collapses "not found" and "wrong owner" into a single NotFoundError and
 *   makes it impossible for callers to render correct copy.
 *
 * Idempotency (locked — NOT idempotent):
 *   Deleting a non-existent entryId throws NotFoundError. This mirrors
 *   deleteLibraryItem. The call is not silent on a second delete attempt.
 *
 * Prisma P2025 handling:
 *   If the existence check passes but the row is deleted by a concurrent
 *   request before our DELETE executes, Prisma raises P2025. The entity
 *   translates P2025 → NotFoundError (standard single-seam Prisma-error
 *   mapping rule). TOCTOU edge is documented only — not tested with
 *   concurrent transactions.
 *
 * Cascade note:
 *   JournalEntry has no child tables that cascade on delete. Deleting an
 *   entry is a clean leaf-node removal. (Compare deleteLibraryItem which
 *   triggers SetNull on JournalEntry.libraryItemId.) No cascade safety
 *   tests are required here.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { deleteJournalEntry } from "@/entities/journal-entry/api/delete-journal-entry.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("delete-journal-entry");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _igdbCounter = 60_000;

function makeUser(suffix: string) {
  return {
    id: `dje-user-${suffix}`,
    email: `dje-${suffix}@example.com`,
    name: `DJE User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `dje-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `DJE Game ${suffix}`,
    slug: `dje-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// Pinned entry id — deterministic across tests; truncated in beforeEach.
const ENTRY_ID = "dje-entry-main";

function makeJournalEntry(userId: string, id: string = ENTRY_ID) {
  return {
    id,
    userId,
    content: "Entry to be deleted",
    kind: "QUICK" as const,
    gameId: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Common setup: one owner + one other user + one game + one journal entry
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order.
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("owner") });
  await db.prisma.user.create({ data: makeUser("other") });
  await db.prisma.game.create({ data: makeGame("a") });
  await db.prisma.journalEntry.create({
    data: makeJournalEntry("dje-user-owner"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("deleteJournalEntry", () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("happy path", () => {
    it("deletes the row so findUnique returns null afterwards", async () => {
      await deleteJournalEntry("dje-user-owner", ENTRY_ID);

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: ENTRY_ID },
      });
      expect(row).toBeNull();
    });

    it("returns void (undefined)", async () => {
      const result = await deleteJournalEntry("dje-user-owner", ENTRY_ID);

      // Locked: return type is Promise<void>. Any non-undefined value would
      // mean the GREEN implementation diverged from this contract.
      expect(result).toBeUndefined();
    });

    it("reduces the total JournalEntry count for the user to zero", async () => {
      const before = await db.prisma.journalEntry.count({
        where: { userId: "dje-user-owner" },
      });
      expect(before).toBe(1);

      await deleteJournalEntry("dje-user-owner", ENTRY_ID);

      const after = await db.prisma.journalEntry.count({
        where: { userId: "dje-user-owner" },
      });
      expect(after).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Ownership enforcement
  // -------------------------------------------------------------------------

  describe("ownership enforcement", () => {
    it("throws UnauthorizedError when the caller does not own the entry", async () => {
      await expect(
        deleteJournalEntry("dje-user-other", ENTRY_ID)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("leaves the row in the DB after UnauthorizedError", async () => {
      await expect(
        deleteJournalEntry("dje-user-other", ENTRY_ID)
      ).rejects.toThrow(UnauthorizedError);

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: ENTRY_ID },
      });
      expect(row).not.toBeNull();
      expect(row?.userId).toBe("dje-user-owner");
    });
  });

  // -------------------------------------------------------------------------
  // Not-found
  // -------------------------------------------------------------------------

  describe("not-found", () => {
    it("throws NotFoundError when the entryId does not exist", async () => {
      await expect(
        deleteJournalEntry("dje-user-owner", "dje-entry-nonexistent")
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError (not UnauthorizedError) when entry is completely absent", async () => {
      // Existence is checked before ownership: a non-existent entry always
      // throws NotFoundError regardless of which userId is supplied.
      const error = await deleteJournalEntry(
        "dje-user-other",
        "dje-entry-nonexistent"
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).not.toBeInstanceOf(UnauthorizedError);
    });

    it("throws NotFoundError on a second delete (not idempotent)", async () => {
      // First delete succeeds.
      await deleteJournalEntry("dje-user-owner", ENTRY_ID);

      // Second delete throws because the row is gone.
      await expect(
        deleteJournalEntry("dje-user-owner", ENTRY_ID)
      ).rejects.toThrow(NotFoundError);
    });
  });

  // -------------------------------------------------------------------------
  // Isolation — only the targeted entry is removed
  // -------------------------------------------------------------------------

  describe("isolation — only the targeted entry is deleted", () => {
    it("does not delete other JournalEntries owned by the same user", async () => {
      // Seed a second entry for the same user.
      const secondId = "dje-entry-second";
      await db.prisma.journalEntry.create({
        data: makeJournalEntry("dje-user-owner", secondId),
      });

      // Delete only the first entry.
      await deleteJournalEntry("dje-user-owner", ENTRY_ID);

      // The second entry must still exist.
      const remaining = await db.prisma.journalEntry.findUnique({
        where: { id: secondId },
      });
      expect(remaining).not.toBeNull();
    });

    it("does not affect another user's JournalEntries", async () => {
      // Seed an entry owned by the other user.
      const otherId = "dje-entry-other-user";
      await db.prisma.journalEntry.create({
        data: makeJournalEntry("dje-user-other", otherId),
      });

      // Delete the owner's entry.
      await deleteJournalEntry("dje-user-owner", ENTRY_ID);

      // The other user's entry must still exist.
      const otherEntry = await db.prisma.journalEntry.findUnique({
        where: { id: otherId },
      });
      expect(otherEntry).not.toBeNull();
      expect(otherEntry?.userId).toBe("dje-user-other");
    });
  });

  // -------------------------------------------------------------------------
  // Linked game is unaffected — deleting an entry does not remove its game
  // -------------------------------------------------------------------------

  describe("linked game is unaffected", () => {
    it("does not delete the linked Game row after entry deletion", async () => {
      // Seed an entry linked to a game.
      const linkedId = "dje-entry-linked";
      await db.prisma.journalEntry.create({
        data: {
          ...makeJournalEntry("dje-user-owner", linkedId),
          gameId: "dje-game-a",
        },
      });

      await deleteJournalEntry("dje-user-owner", linkedId);

      // The Game row must still exist.
      const game = await db.prisma.game.findUnique({
        where: { id: "dje-game-a" },
      });
      expect(game).not.toBeNull();
    });
  });
});
