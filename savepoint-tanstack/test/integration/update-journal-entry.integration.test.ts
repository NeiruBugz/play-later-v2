/**
 * RED integration test for updateJournalEntry (Slice 16 — journal entry CRUD).
 *
 * This test is intentionally failing: `@/entities/journal-entry/api/update-journal-entry.server`
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
 *   updateJournalEntry(
 *     userId: string,
 *     entryId: string,
 *     input: UpdateJournalEntryInput,
 *   ): Promise<JournalTimelineEntry>
 *
 * Input shape (all fields optional):
 *   type UpdateJournalEntryInput = {
 *     content?: string;
 *     kind?: "QUICK" | "REFLECTION";
 *     gameId?: string | null; // explicit null clears the association;
 *                             // undefined leaves gameId untouched
 *   };
 *
 * Return type (locked):
 *   JournalTimelineEntry — the full JournalEntry row with the `game` relation
 *   projected via JOURNAL_ENTRY_GAME_SELECT (id, title, slug, coverImage).
 *   Same type as createJournalEntry and getJournalTimeline — the return
 *   value is directly usable in timeline rendering without a second fetch.
 *
 * Error ordering (deliberate divergence from canonical savepoint-app):
 *   Mirrors updateLibraryItem (see update-library-item.integration.test.ts).
 *   Two-step ownership check — NOT a combined findFirst({ where: { id, userId } }):
 *     1. findUnique({ where: { id: entryId } }) → if null  → NotFoundError
 *     2. if row.userId !== userId               → UnauthorizedError
 *     3. proceed with update
 *   Rationale: distinguishing "entry doesn't exist at all" from "you don't
 *   own this entry" gives the feature layer (and UI) correct copy. The
 *   entity is reachable only by authenticated callers (requireUserId() in
 *   the feature server fn), so revealing entry existence to the wrong
 *   authenticated user is an acceptable tradeoff.
 *
 * Empty-input behavior (locked):
 *   Calling updateJournalEntry(userId, entryId, {}) SUCCEEDS. Prisma's
 *   @updatedAt advances unconditionally regardless of whether any user-visible
 *   field changes. Tests assert the call completes without error, NOT that
 *   updatedAt is frozen.
 *
 * updatedAt advancement:
 *   On any non-empty field update, updatedAt MUST be strictly greater than
 *   the seeded createdAt (pinned to 2024-01-01). Tests seed entries with a
 *   static past updatedAt and assert result.updatedAt > seeded value.
 *
 * gameId semantics:
 *   - `gameId: undefined`  → leave existing gameId untouched (Prisma skip).
 *   - `gameId: null`       → clear the association (Prisma sets NULL).
 *   - `gameId: "<id>"`     → replace the association; FK must exist or
 *                            Prisma raises P2003 → entity translates to
 *                            NotFoundError (same single-seam rule as create).
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { updateJournalEntry } from "@/entities/journal-entry/api/update-journal-entry.server";
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
  db = await setupIsolatedDatabase("update-journal-entry");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _igdbCounter = 50_000;

function makeUser(suffix: string) {
  return {
    id: `uje-user-${suffix}`,
    email: `uje-${suffix}@example.com`,
    name: `UJE User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `uje-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `UJE Game ${suffix}`,
    slug: `uje-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// Pinned entry id — deterministic across tests; truncated in beforeEach.
const ENTRY_ID = "uje-entry-main";

function makeJournalEntry(userId: string, id: string = ENTRY_ID) {
  return {
    id,
    userId,
    content: "Original content",
    kind: "QUICK" as const,
    gameId: null,
    // Pin updatedAt to the past so any real update is detectable.
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
    data: makeJournalEntry("uje-user-owner"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("updateJournalEntry", () => {
  // -------------------------------------------------------------------------
  // Ownership enforcement
  // -------------------------------------------------------------------------

  describe("ownership enforcement", () => {
    it("throws UnauthorizedError when the caller does not own the entry", async () => {
      await expect(
        updateJournalEntry("uje-user-other", ENTRY_ID, {
          content: "Hijacked content",
        })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("leaves the DB row unchanged after an UnauthorizedError", async () => {
      await expect(
        updateJournalEntry("uje-user-other", ENTRY_ID, {
          content: "Should not change",
        })
      ).rejects.toThrow(UnauthorizedError);

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: ENTRY_ID },
      });
      expect(row).not.toBeNull();
      expect(row?.content).toBe("Original content");
      expect(row?.userId).toBe("uje-user-owner");
    });
  });

  // -------------------------------------------------------------------------
  // Not-found (entry does not exist at all)
  // -------------------------------------------------------------------------

  describe("not-found", () => {
    it("throws NotFoundError when the entryId does not exist", async () => {
      await expect(
        updateJournalEntry("uje-user-owner", "uje-entry-nonexistent", {
          content: "Ghost update",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError (not UnauthorizedError) when the entry is completely absent", async () => {
      // Existence is checked before ownership — a missing entry always yields
      // NotFoundError regardless of which userId is supplied.
      const error = await updateJournalEntry(
        "uje-user-other",
        "uje-entry-nonexistent",
        { content: "Phantom" }
      ).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).not.toBeInstanceOf(UnauthorizedError);
    });
  });

  // -------------------------------------------------------------------------
  // Content update
  // -------------------------------------------------------------------------

  describe("content update", () => {
    it("updates the content field and returns the entry", async () => {
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "Updated content body",
      });

      expect(result.content).toBe("Updated content body");
      expect(result.id).toBe(ENTRY_ID);
      expect(result.userId).toBe("uje-user-owner");
    });

    it("persists the new content to the DB", async () => {
      await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "Persistent update",
      });

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: ENTRY_ID },
      });
      expect(row?.content).toBe("Persistent update");
    });

    it("advances updatedAt after a content change", async () => {
      const SEEDED_UPDATED_AT = new Date("2024-01-01T00:00:00.000Z");

      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "Triggers updatedAt advance",
      });

      expect(result.updatedAt.getTime()).toBeGreaterThan(
        SEEDED_UPDATED_AT.getTime()
      );
    });

    it("does not alter kind or gameId when only content is supplied", async () => {
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "Only changing content",
      });

      // Seeded values must remain.
      expect(result.kind).toBe("QUICK");
      expect(result.gameId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Kind update
  // -------------------------------------------------------------------------

  describe("kind update", () => {
    it("changes kind to REFLECTION", async () => {
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        kind: "REFLECTION",
      });

      expect(result.kind).toBe("REFLECTION");
    });

    it("changes kind back to QUICK from REFLECTION", async () => {
      // First change to REFLECTION.
      await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        kind: "REFLECTION",
      });

      // Then revert.
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        kind: "QUICK",
      });

      expect(result.kind).toBe("QUICK");
    });
  });

  // -------------------------------------------------------------------------
  // gameId update
  // -------------------------------------------------------------------------

  describe("gameId update", () => {
    it("links an entry to a game when gameId is provided", async () => {
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        gameId: "uje-game-a",
      });

      expect(result.gameId).toBe("uje-game-a");
    });

    it("returns the game projection after linking to a game", async () => {
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        gameId: "uje-game-a",
      });

      expect(result.game).not.toBeNull();
      expect(result.game?.id).toBe("uje-game-a");
      expect(result.game?.title).toBe("UJE Game a");
      expect(result.game?.slug).toBe("uje-game-a");
    });

    it("clears the game association when gameId is explicit null", async () => {
      // First link to a game.
      await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        gameId: "uje-game-a",
      });

      // Then clear it.
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        gameId: null,
      });

      expect(result.gameId).toBeNull();
      expect(result.game).toBeNull();
    });

    it("leaves gameId untouched when gameId is undefined (not in input)", async () => {
      // First link to a game.
      await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        gameId: "uje-game-a",
      });

      // Update only content — gameId must survive.
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "Leave game alone",
      });

      expect(result.gameId).toBe("uje-game-a");
    });

    it("throws NotFoundError when gameId references a non-existent Game", async () => {
      await expect(
        updateJournalEntry("uje-user-owner", ENTRY_ID, {
          gameId: "uje-game-nonexistent",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("does not mutate the row when a bad gameId causes NotFoundError", async () => {
      await expect(
        updateJournalEntry("uje-user-owner", ENTRY_ID, {
          gameId: "uje-game-nonexistent",
        })
      ).rejects.toThrow(NotFoundError);

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: ENTRY_ID },
      });
      // Row still exists with original values.
      expect(row?.content).toBe("Original content");
      expect(row?.gameId).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Combined update — multiple fields in one call
  // -------------------------------------------------------------------------

  describe("combined update", () => {
    it("updates content, kind, and gameId in a single call", async () => {
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "Full update",
        kind: "REFLECTION",
        gameId: "uje-game-a",
      });

      expect(result.content).toBe("Full update");
      expect(result.kind).toBe("REFLECTION");
      expect(result.gameId).toBe("uje-game-a");
      expect(result.game?.id).toBe("uje-game-a");
    });

    it("persists the combined update to the DB", async () => {
      await updateJournalEntry("uje-user-owner", ENTRY_ID, {
        content: "DB persistence check",
        kind: "REFLECTION",
        gameId: "uje-game-a",
      });

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: ENTRY_ID },
      });
      expect(row?.content).toBe("DB persistence check");
      expect(row?.kind).toBe("REFLECTION");
      expect(row?.gameId).toBe("uje-game-a");
    });
  });

  // -------------------------------------------------------------------------
  // Empty input (no-op write)
  // -------------------------------------------------------------------------

  describe("empty input", () => {
    it("succeeds and returns the entry when an empty input object is passed", async () => {
      // Locked behavior: {} is accepted at the entity layer without error.
      // Prisma still runs the UPDATE and advances updatedAt (due to @updatedAt).
      const result = await updateJournalEntry("uje-user-owner", ENTRY_ID, {});

      expect(result.id).toBe(ENTRY_ID);
      expect(result.userId).toBe("uje-user-owner");
      // All meaningful fields remain at seeded values.
      expect(result.content).toBe("Original content");
      expect(result.kind).toBe("QUICK");
      expect(result.gameId).toBeNull();
    });
  });
});
