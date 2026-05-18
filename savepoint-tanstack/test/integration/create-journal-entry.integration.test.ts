/**
 * RED integration test for createJournalEntry (Slice 16 — journal entry CRUD).
 *
 * This test is intentionally failing: `@/entities/journal-entry/api/create-journal-entry.server`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * Real Prisma against the isolated test DB for all assertions.
 * No mocks — no IGDB or fetch calls needed (pure DB mutation).
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Signature:
 *   createJournalEntry(
 *     userId: string,
 *     input: CreateJournalEntryInput,
 *   ): Promise<JournalTimelineEntry>
 *
 * Input shape:
 *   type CreateJournalEntryInput = {
 *     content: string;               // required, non-empty
 *                                    // entity layer trusts caller; feature/Zod enforces min length
 *     kind?: "QUICK" | "REFLECTION"; // optional; default "QUICK"
 *     gameId?: string | null;        // optional; entries may be game-less
 *   };
 *
 * Return type (locked):
 *   JournalTimelineEntry from `entities/journal-entry/model/types.ts` — the
 *   full JournalEntry row with the `game` relation projected via
 *   JOURNAL_ENTRY_GAME_SELECT (id, title, slug, coverImage). This unifies
 *   timeline reads and mutation return values — callers never need a second
 *   fetch after a create.
 *
 * userId ownership:
 *   userId is NEVER read from the input struct — it is a separate first
 *   argument. The feature layer resolves the authenticated user via
 *   requireUserId() and passes it here. The entity layer must not inspect
 *   any session state.
 *
 * Default kind (locked):
 *   When `kind` is omitted from input, the created row has kind === "QUICK".
 *   The entity layer sets the default; Prisma schema may also have a default,
 *   but the entity must not rely solely on the schema default (the return
 *   value must reflect "QUICK" whether Prisma or the entity set it).
 *
 * FK violation (gameId not found):
 *   If `gameId` is provided but the Game row does not exist, Prisma throws a
 *   P2003 (foreign-key constraint violation). The entity layer translates
 *   P2003 on the gameId column → NotFoundError. This is the single-seam
 *   mapping rule: exactly one place maps Prisma errors, scoped via
 *   error.meta?.field_name or error.meta?.constraint.
 *
 * Game-less entries:
 *   `gameId` omitted or explicit null → `game` in the returned row is null.
 *   Both spellings are supported; no error is thrown.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { createJournalEntry } from "@/entities/journal-entry/api/create-journal-entry.server";
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
  db = await setupIsolatedDatabase("create-journal-entry");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _igdbCounter = 40_000;

function makeUser(suffix: string) {
  return {
    id: `cje-user-${suffix}`,
    email: `cje-${suffix}@example.com`,
    name: `CJE User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `cje-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `CJE Game ${suffix}`,
    slug: `cje-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Common setup: one owner + one game
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order.
  await db.prisma.journalEntry.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("owner") });
  await db.prisma.game.create({ data: makeGame("a") });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("createJournalEntry", () => {
  // -------------------------------------------------------------------------
  // Happy path — game-less entry
  // -------------------------------------------------------------------------

  describe("game-less entry (no gameId)", () => {
    it("creates a row with the correct userId and content when gameId is omitted", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "My first journal note",
      });

      expect(result.userId).toBe("cje-user-owner");
      expect(result.content).toBe("My first journal note");
    });

    it("defaults kind to QUICK when kind is omitted", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Quick thought",
      });

      expect(result.kind).toBe("QUICK");
    });

    it("returns game as null when gameId is omitted", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "No game context",
      });

      expect(result.game).toBeNull();
    });

    it("returns game as null when gameId is explicit null", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Explicit null game",
        gameId: null,
      });

      expect(result.game).toBeNull();
    });

    it("persists the entry to the DB (findUnique returns the row)", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Persisted entry",
      });

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: result.id },
      });
      expect(row).not.toBeNull();
      expect(row?.content).toBe("Persisted entry");
    });

    it("increments the journal entry count by 1 after creation", async () => {
      const before = await db.prisma.journalEntry.count({
        where: { userId: "cje-user-owner" },
      });

      await createJournalEntry("cje-user-owner", {
        content: "Counting check",
      });

      const after = await db.prisma.journalEntry.count({
        where: { userId: "cje-user-owner" },
      });
      expect(after).toBe(before + 1);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — entry linked to a game
  // -------------------------------------------------------------------------

  describe("entry linked to an existing game", () => {
    it("creates a row with the provided gameId", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Playing this game",
        gameId: "cje-game-a",
      });

      expect(result.gameId).toBe("cje-game-a");
    });

    it("returns the game projection (id, title, slug, coverImage)", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Entry with full game projection",
        gameId: "cje-game-a",
      });

      expect(result.game).not.toBeNull();
      expect(result.game?.id).toBe("cje-game-a");
      expect(result.game?.title).toBe("CJE Game a");
      expect(result.game?.slug).toBe("cje-game-a");
      // coverImage is null in the seeded game — assert it's present in the
      // projection shape (even if null).
      expect("coverImage" in (result.game ?? {})).toBe(true);
    });
  });

  // -------------------------------------------------------------------------
  // Kind variants
  // -------------------------------------------------------------------------

  describe("kind field", () => {
    it("creates a QUICK entry when kind is explicitly QUICK", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Explicit quick note",
        kind: "QUICK",
      });

      expect(result.kind).toBe("QUICK");
    });

    it("creates a REFLECTION entry when kind is REFLECTION", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Long-form reflection",
        kind: "REFLECTION",
      });

      expect(result.kind).toBe("REFLECTION");
    });
  });

  // -------------------------------------------------------------------------
  // Full round-trip — all fields in one call
  // -------------------------------------------------------------------------

  describe("combined input (all fields)", () => {
    it("creates an entry with content, kind REFLECTION, and a linked game", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Long session today",
        kind: "REFLECTION",
        gameId: "cje-game-a",
      });

      expect(result.content).toBe("Long session today");
      expect(result.kind).toBe("REFLECTION");
      expect(result.gameId).toBe("cje-game-a");
      expect(result.game?.id).toBe("cje-game-a");
    });

    it("persists the combined entry to the DB", async () => {
      const result = await createJournalEntry("cje-user-owner", {
        content: "Check persistence of all fields",
        kind: "REFLECTION",
        gameId: "cje-game-a",
      });

      const row = await db.prisma.journalEntry.findUnique({
        where: { id: result.id },
      });
      expect(row?.content).toBe("Check persistence of all fields");
      expect(row?.kind).toBe("REFLECTION");
      expect(row?.gameId).toBe("cje-game-a");
      expect(row?.userId).toBe("cje-user-owner");
    });
  });

  // -------------------------------------------------------------------------
  // FK violation — gameId does not exist
  // -------------------------------------------------------------------------

  describe("non-existent gameId (FK violation)", () => {
    it("throws NotFoundError when gameId references a non-existent Game", async () => {
      await expect(
        createJournalEntry("cje-user-owner", {
          content: "Ghost game entry",
          gameId: "cje-game-nonexistent",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("does not create any row when the FK violation occurs", async () => {
      const before = await db.prisma.journalEntry.count();

      await expect(
        createJournalEntry("cje-user-owner", {
          content: "Should not persist",
          gameId: "cje-game-nonexistent",
        })
      ).rejects.toThrow(NotFoundError);

      const after = await db.prisma.journalEntry.count();
      expect(after).toBe(before);
    });
  });

  // -------------------------------------------------------------------------
  // Isolation — userId is taken from the argument, not input
  // -------------------------------------------------------------------------

  describe("userId isolation", () => {
    it("creates the entry owned by the supplied userId", async () => {
      // The input struct has no userId — the function must derive ownership
      // entirely from the first argument.
      const result = await createJournalEntry("cje-user-owner", {
        content: "Ownership check",
      });

      expect(result.userId).toBe("cje-user-owner");
    });
  });
});
