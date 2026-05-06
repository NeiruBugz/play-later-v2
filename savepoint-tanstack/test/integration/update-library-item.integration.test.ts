/**
 * RED integration test for updateLibraryItem (Slice 11 — library mutations).
 *
 * This test is intentionally failing: `@/entities/library-item/api/update-library-item.server`
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
 *   updateLibraryItem(
 *     userId: string,
 *     itemId: number,
 *     input: UpdateLibraryItemInput,
 *   ): Promise<LibraryItem>
 *
 * Input shape (all fields optional):
 *   type UpdateLibraryItemInput = {
 *     status?: LibraryItemStatus;
 *     rating?: number | null;
 *     platform?: string | null;
 *     startedAt?: Date | null;
 *     completedAt?: Date | null;
 *   };
 *
 * Error ordering (deliberate divergence from canonical savepoint-app):
 *   The canonical library-repository uses a combined `findFirst({ where: { id, userId } })`
 *   which collapses "item not found" and "wrong owner" into a single NotFoundError.
 *   This entity layer diverges: it does a TWO-STEP check so callers get a semantically
 *   correct error:
 *     1. findUnique({ where: { id: itemId } })  → if null  → NotFoundError
 *     2. if item.userId !== userId              → UnauthorizedError
 *     3. proceed with update
 *   Rationale: for write mutations, distinguishing "this item doesn't exist at all"
 *   from "you don't own this item" is useful for the feature-layer (e.g., the UI can
 *   show "gone" vs "forbidden" copy). Security note: we are revealing item existence to
 *   authenticated users calling the entity function directly, which is acceptable because
 *   the feature layer (createServerFn) already requires an authenticated userId via
 *   requireUserId() — an unauthenticated caller cannot reach the entity.
 *
 * Empty-input behavior (locked):
 *   Calling updateLibraryItem(userId, itemId, {}) SUCCEEDS and returns the item.
 *   Prisma's @updatedAt WILL advance even on an empty update({}) call because Prisma
 *   injects the timestamp unconditionally. This is documented and tests will assert
 *   the call completes without error, not that updatedAt is frozen.
 *
 * updatedAt advancement:
 *   On any non-empty field update, updatedAt MUST be strictly greater than the
 *   createdAt timestamp seeded in beforeEach (which is pinned to 2024-01-01). The
 *   test seeds items with a static past updatedAt and asserts the returned item's
 *   updatedAt > the seeded value.
 *
 * Return value:
 *   The full LibraryItem row (all columns), matching the Prisma model shape.
 *   No relation includes (game, User) required at the entity layer.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { updateLibraryItem } from "@/entities/library-item/api/update-library-item.server";
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
  db = await setupIsolatedDatabase("update-library-item");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

// Counters start high enough not to collide between tests, and are reset in
// beforeEach by truncating tables.
let _gameCounter = 20_000;

function makeUser(suffix: string) {
  return {
    id: `uli-user-${suffix}`,
    email: `uli-${suffix}@example.com`,
    name: `ULI User ${suffix}`,
    emailVerified: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `uli-game-${suffix}`,
    igdbId: _gameCounter++,
    title: `ULI Game ${suffix}`,
    slug: `uli-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// Pin a specific item id so tests can reference it predictably. We use a
// sequence starting at 10_001 to avoid clashing with any auto-increment rows
// created during setup. Each beforeEach truncates LibraryItem so the id can
// be reused across describe blocks.
const ITEM_ID = 10_001;

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
    // Pin updatedAt to the past so any real update is detectable.
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Common setup: one owner + one other user + one game + one library item.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order.
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("owner") });
  await db.prisma.user.create({ data: makeUser("other") });
  await db.prisma.game.create({ data: makeGame("a") });
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("uli-user-owner", "uli-game-a"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("updateLibraryItem", () => {
  // -------------------------------------------------------------------------
  // Ownership enforcement
  // -------------------------------------------------------------------------

  describe("ownership enforcement", () => {
    it("throws UnauthorizedError when the caller does not own the item", async () => {
      await expect(
        updateLibraryItem("uli-user-other", ITEM_ID, { status: "PLAYING" })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("leaves the DB row unchanged after an UnauthorizedError", async () => {
      // Attempt mutation as the wrong user.
      await expect(
        updateLibraryItem("uli-user-other", ITEM_ID, { status: "PLAYING" })
      ).rejects.toThrow(UnauthorizedError);

      // Re-read the row and confirm it still has the seeded values.
      const row = await db.prisma.libraryItem.findUnique({
        where: { id: ITEM_ID },
      });
      expect(row).not.toBeNull();
      expect(row?.status).toBe("SHELF");
      expect(row?.userId).toBe("uli-user-owner");
    });
  });

  // -------------------------------------------------------------------------
  // Not-found (item does not exist at all)
  // -------------------------------------------------------------------------

  describe("not-found", () => {
    it("throws NotFoundError when the itemId does not exist", async () => {
      const nonExistentId = 99_999;

      await expect(
        updateLibraryItem("uli-user-owner", nonExistentId, {
          status: "PLAYING",
        })
      ).rejects.toThrow(NotFoundError);
    });

    it("throws NotFoundError (not UnauthorizedError) when the item is completely absent", async () => {
      // Distinction matters: existence is checked before ownership.
      const nonExistentId = 99_998;

      const error = await updateLibraryItem("uli-user-other", nonExistentId, {
        status: "PLAYING",
      }).catch((e: unknown) => e);

      expect(error).toBeInstanceOf(NotFoundError);
      expect(error).not.toBeInstanceOf(UnauthorizedError);
    });
  });

  // -------------------------------------------------------------------------
  // Status update
  // -------------------------------------------------------------------------

  describe("status update", () => {
    const statuses = [
      "WISHLIST",
      "SHELF",
      "UP_NEXT",
      "PLAYING",
      "PLAYED",
    ] as const;

    for (const newStatus of statuses) {
      it(`changes status to ${newStatus} and returns the updated item`, async () => {
        const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
          status: newStatus,
        });

        expect(result.status).toBe(newStatus);
        expect(result.id).toBe(ITEM_ID);
        expect(result.userId).toBe("uli-user-owner");
      });
    }

    it("advances updatedAt after a status change", async () => {
      const SEEDED_UPDATED_AT = new Date("2024-01-01T00:00:00.000Z");

      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        status: "PLAYING",
      });

      expect(result.updatedAt.getTime()).toBeGreaterThan(
        SEEDED_UPDATED_AT.getTime()
      );
    });

    it("does not alter other fields when only status is supplied", async () => {
      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        status: "PLAYED",
      });

      // These fields were null in the seeded row — they must remain null.
      expect(result.rating).toBeNull();
      expect(result.platform).toBeNull();
      expect(result.startedAt).toBeNull();
      expect(result.completedAt).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Rating update
  // -------------------------------------------------------------------------

  describe("rating update", () => {
    it("sets rating to a positive integer", async () => {
      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        rating: 8,
      });

      expect(result.rating).toBe(8);
    });

    it("clears rating when null is passed", async () => {
      // First set a rating.
      await updateLibraryItem("uli-user-owner", ITEM_ID, { rating: 7 });

      // Then clear it.
      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        rating: null,
      });

      expect(result.rating).toBeNull();
    });

    it("persists the rating to the DB row", async () => {
      await updateLibraryItem("uli-user-owner", ITEM_ID, { rating: 9 });

      const row = await db.prisma.libraryItem.findUnique({
        where: { id: ITEM_ID },
      });
      expect(row?.rating).toBe(9);
    });
  });

  // -------------------------------------------------------------------------
  // Platform update
  // -------------------------------------------------------------------------

  describe("platform update", () => {
    it("sets platform to a non-null string", async () => {
      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        platform: "PlayStation 5",
      });

      expect(result.platform).toBe("PlayStation 5");
    });

    it("clears platform when null is passed", async () => {
      // First set a platform.
      await updateLibraryItem("uli-user-owner", ITEM_ID, { platform: "PC" });

      // Then clear it.
      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        platform: null,
      });

      expect(result.platform).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Date field updates (startedAt, completedAt)
  // -------------------------------------------------------------------------

  describe("date field updates", () => {
    it("sets startedAt to a Date value", async () => {
      const startDate = new Date("2024-06-01T00:00:00.000Z");

      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        startedAt: startDate,
      });

      expect(result.startedAt).toEqual(startDate);
    });

    it("clears startedAt when null is passed", async () => {
      await updateLibraryItem("uli-user-owner", ITEM_ID, {
        startedAt: new Date("2024-06-01T00:00:00.000Z"),
      });

      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        startedAt: null,
      });

      expect(result.startedAt).toBeNull();
    });

    it("sets completedAt to a Date value", async () => {
      const completedDate = new Date("2024-09-15T00:00:00.000Z");

      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        completedAt: completedDate,
      });

      expect(result.completedAt).toEqual(completedDate);
    });

    it("clears completedAt when null is passed", async () => {
      await updateLibraryItem("uli-user-owner", ITEM_ID, {
        completedAt: new Date("2024-09-15T00:00:00.000Z"),
      });

      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        completedAt: null,
      });

      expect(result.completedAt).toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Combined update — multiple fields in one call
  // -------------------------------------------------------------------------

  describe("combined update", () => {
    it("updates status, rating, platform, startedAt, and completedAt in a single call", async () => {
      const startDate = new Date("2024-05-01T00:00:00.000Z");
      const completedDate = new Date("2024-08-30T00:00:00.000Z");

      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {
        status: "PLAYED",
        rating: 10,
        platform: "Nintendo Switch",
        startedAt: startDate,
        completedAt: completedDate,
      });

      expect(result.status).toBe("PLAYED");
      expect(result.rating).toBe(10);
      expect(result.platform).toBe("Nintendo Switch");
      expect(result.startedAt).toEqual(startDate);
      expect(result.completedAt).toEqual(completedDate);
    });

    it("persists the combined update to the DB", async () => {
      await updateLibraryItem("uli-user-owner", ITEM_ID, {
        status: "PLAYED",
        rating: 7,
        platform: "PC",
      });

      const row = await db.prisma.libraryItem.findUnique({
        where: { id: ITEM_ID },
      });
      expect(row?.status).toBe("PLAYED");
      expect(row?.rating).toBe(7);
      expect(row?.platform).toBe("PC");
    });
  });

  // -------------------------------------------------------------------------
  // Empty input (no-op write)
  // -------------------------------------------------------------------------

  describe("empty input", () => {
    it("succeeds and returns the item when an empty input object is passed", async () => {
      // Locked behavior: {} is accepted at the entity layer without error.
      // Prisma will still run the UPDATE and advance updatedAt (due to @updatedAt).
      const result = await updateLibraryItem("uli-user-owner", ITEM_ID, {});

      expect(result.id).toBe(ITEM_ID);
      expect(result.userId).toBe("uli-user-owner");
      // All meaningful fields remain at seeded values.
      expect(result.status).toBe("SHELF");
      expect(result.rating).toBeNull();
      expect(result.platform).toBeNull();
    });
  });
});
