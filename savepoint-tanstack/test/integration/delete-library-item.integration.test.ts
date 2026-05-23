/**
 * RED integration test for deleteLibraryItem (Slice 11 — library mutations).
 *
 * This test is intentionally failing: `@/entities/library-item/api/delete-library-item.server`
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
 *   deleteLibraryItem(userId: string, itemId: number): Promise<void>
 *
 * Return type decision (locked):
 *   Returns Promise<void>. The deleted row is NOT returned. Callers that
 *   need the pre-delete state must read it before calling deleteLibraryItem.
 *   Rationale: simpler contract, matches the common "fire and forget after
 *   optimistic UI update" pattern. Diverges from canonical savepoint-app which
 *   returns { id: number } — the tanstack layer has no callers that need the id
 *   back (it was already known by the caller).
 *
 * Error ordering (deliberate divergence from canonical savepoint-app):
 *   Same two-step check as updateLibraryItem (see update-library-item.integration.test.ts).
 *   1. findUnique({ where: { id: itemId } }) → if null → NotFoundError
 *   2. if item.userId !== userId             → UnauthorizedError
 *   3. proceed with delete
 *   Canonical: a single findFirst({ where: { id, userId } }) collapses both
 *   into NotFoundError. This entity deliberately separates them.
 *
 * Prisma P2025 handling:
 *   If the existence check passes but the row is deleted by a concurrent
 *   request before our DELETE executes, Prisma raises P2025. The entity
 *   translates P2025 → NotFoundError (standard Prisma-error-translation rule
 *   from the DAL conventions). This is a TOCTOU edge; we do not test it with
 *   concurrent transactions — we document the mapping only.
 *
 * Cascade behavior (locked via schema inspection):
 *   JournalEntry.libraryItemId has `onDelete: SetNull`. Deleting a LibraryItem
 *   therefore sets JournalEntry.libraryItemId = null but does NOT delete the
 *   JournalEntry row. The cascade safety test below seeds a JournalEntry linked
 *   to the LibraryItem and asserts:
 *     - The JournalEntry row still exists after delete.
 *     - JournalEntry.libraryItemId is null.
 *   This is DB-enforced (Prisma schema) — no application logic needed.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { deleteLibraryItem } from "@/entities/library-item/api/delete-library-item.server";
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
  db = await setupIsolatedDatabase("delete-library-item");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _gameCounter = 30_000;

function makeUser(suffix: string) {
  return {
    id: `dli-user-${suffix}`,
    email: `dli-${suffix}@example.com`,
    name: `DLI User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `dli-game-${suffix}`,
    igdbId: _gameCounter++,
    title: `DLI Game ${suffix}`,
    slug: `dli-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

const ITEM_ID = 20_001;

function makeLibraryItem(userId: string, gameId: string, id: number = ITEM_ID) {
  return {
    id,
    userId,
    gameId,
    status: "SHELF" as const,
    acquisitionType: "DIGITAL" as const,
    platform: null,
    rating: null,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Common setup
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order: JournalEntry first (references LibraryItem),
  // then LibraryItem, Game, User.
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("owner") });
  await db.prisma.user.create({ data: makeUser("other") });
  await db.prisma.game.create({ data: makeGame("b") });
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("dli-user-owner", "dli-game-b"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("deleteLibraryItem", () => {
  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("happy path", () => {
    it("deletes the row so findUnique returns null afterwards", async () => {
      await deleteLibraryItem("dli-user-owner", ITEM_ID);

      const row = await db.prisma.libraryItem.findUnique({
        where: { id: ITEM_ID },
      });
      expect(row).toBeNull();
    });

    it("returns void (undefined)", async () => {
      const result = await deleteLibraryItem("dli-user-owner", ITEM_ID);

      // Locked: return type is Promise<void>. Any non-undefined value would
      // mean the GREEN implementation diverged from this contract.
      expect(result).toBeUndefined();
    });

    it("reduces the total LibraryItem count for the user to zero", async () => {
      const before = await db.prisma.libraryItem.count({
        where: { userId: "dli-user-owner" },
      });
      expect(before).toBe(1);

      await deleteLibraryItem("dli-user-owner", ITEM_ID);

      const after = await db.prisma.libraryItem.count({
        where: { userId: "dli-user-owner" },
      });
      expect(after).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Ownership enforcement
  // -------------------------------------------------------------------------

  describe("ownership enforcement", () => {
    it("throws UnauthorizedError when the caller does not own the item", async () => {
      await expect(
        deleteLibraryItem("dli-user-other", ITEM_ID)
      ).rejects.toThrow(UnauthorizedError);
    });

    it("leaves the row in the DB after UnauthorizedError", async () => {
      await expect(
        deleteLibraryItem("dli-user-other", ITEM_ID)
      ).rejects.toThrow(UnauthorizedError);

      const row = await db.prisma.libraryItem.findUnique({
        where: { id: ITEM_ID },
      });
      expect(row).not.toBeNull();
      expect(row?.userId).toBe("dli-user-owner");
    });
  });

  // -------------------------------------------------------------------------
  // Not-found
  // -------------------------------------------------------------------------

  describe("not-found", () => {
    it("throws NotFoundError when the itemId does not exist", async () => {
      const nonExistentId = 99_997;

      await expect(
        deleteLibraryItem("dli-user-owner", nonExistentId)
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError (not UnauthorizedError) when item is completely absent", async () => {
      // Existence is checked before ownership: a non-existent item always
      // throws NotFoundError regardless of which userId is supplied.
      const nonExistentId = 99_996;

      const error = await deleteLibraryItem(
        "dli-user-other",
        nonExistentId
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).not.toBeInstanceOf(UnauthorizedError);
    });
  });

  // -------------------------------------------------------------------------
  // Cascade safety (JournalEntry.onDelete: SetNull)
  // -------------------------------------------------------------------------

  describe("cascade safety — JournalEntry linked via SetNull", () => {
    it("sets JournalEntry.libraryItemId to null (does NOT delete the entry)", async () => {
      // Seed a JournalEntry that references the LibraryItem.
      const journalEntry = await db.prisma.journalEntry.create({
        data: {
          id: "dli-journal-1",
          content: "Progress log",
          userId: "dli-user-owner",
          gameId: "dli-game-b",
          libraryItemId: ITEM_ID,
        },
      });

      // Delete the LibraryItem.
      await deleteLibraryItem("dli-user-owner", ITEM_ID);

      // The JournalEntry row must still exist.
      const entry = await db.prisma.journalEntry.findUnique({
        where: { id: journalEntry.id },
      });
      expect(entry).not.toBeNull();

      // But its libraryItemId is now null (SetNull cascade).
      expect(entry?.libraryItemId).toBeNull();
    });

    it("does not affect JournalEntry count after LibraryItem deletion", async () => {
      await db.prisma.journalEntry.create({
        data: {
          id: "dli-journal-2",
          content: "Another entry",
          userId: "dli-user-owner",
          gameId: "dli-game-b",
          libraryItemId: ITEM_ID,
        },
      });

      await deleteLibraryItem("dli-user-owner", ITEM_ID);

      // The journal entry count is unchanged — no cascade delete occurred.
      const count = await db.prisma.journalEntry.count({
        where: { userId: "dli-user-owner" },
      });
      expect(count).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Isolation — only the targeted item is removed
  // -------------------------------------------------------------------------

  describe("isolation — only the targeted item is deleted", () => {
    it("does not delete other LibraryItems owned by the same user", async () => {
      // Seed a second game + item for the same user.
      await db.prisma.game.create({ data: makeGame("c") });
      const secondItemId = ITEM_ID + 1;
      await db.prisma.libraryItem.create({
        data: makeLibraryItem("dli-user-owner", "dli-game-c", secondItemId),
      });

      // Delete only the first item.
      await deleteLibraryItem("dli-user-owner", ITEM_ID);

      // The second item must still exist.
      const remaining = await db.prisma.libraryItem.findUnique({
        where: { id: secondItemId },
      });
      expect(remaining).not.toBeNull();
    });

    it("does not affect another user's LibraryItems", async () => {
      // Seed a game + item owned by the other user.
      await db.prisma.game.create({ data: makeGame("d") });
      const otherItemId = ITEM_ID + 2;
      await db.prisma.libraryItem.create({
        data: makeLibraryItem("dli-user-other", "dli-game-d", otherItemId),
      });

      await deleteLibraryItem("dli-user-owner", ITEM_ID);

      const otherItem = await db.prisma.libraryItem.findUnique({
        where: { id: otherItemId },
      });
      expect(otherItem).not.toBeNull();
      expect(otherItem?.userId).toBe("dli-user-other");
    });
  });
});
