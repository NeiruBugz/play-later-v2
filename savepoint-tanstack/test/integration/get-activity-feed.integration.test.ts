/**
 * RED integration test for getActivityFeed (Slice 20 — social graph).
 *
 * This test is intentionally failing: `@/features/view-activity-feed/api/get-activity-feed.worker`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * Real Prisma against the isolated test DB for all assertions.
 * No mocks — pure DB read (uses raw SQL union over LibraryItem, no Activity model).
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Activity source-of-truth (confirmed from canonical savepoint-app):
 *   The activity feed is a VIEW-DRIVEN QUERY over `LibraryItem` rows — there
 *   is NO dedicated `Activity` Prisma model. Canonical `activity-feed-repository.ts`
 *   runs raw SQL joining LibraryItem + Follow + user + Game, ordered by
 *   GREATEST(createdAt, statusChangedAt) DESC. This tanstack implementation
 *   mirrors that approach. No new Prisma model was required.
 *
 * Worker signature:
 *   getActivityFeedWorker(
 *     userId: string | undefined,
 *     data: unknown,
 *   ): Promise<ActivityFeedResult>
 *
 * Auth rule:
 *   The activity feed endpoint is auth-gated: if `userId` is undefined the
 *   worker throws `UnauthorizedError`. Anonymous viewers cannot call this fn.
 *   (Cross-user public activity via `/u/$username/activity` is handled by a
 *   separate public query in the entity layer, not by this worker.)
 *
 * Input shape (Zod-validated inside worker):
 *   const GET_ACTIVITY_FEED_INPUT = z.object({
 *     limit?: z.number().int().min(1).max(50).optional(),
 *     cursor?: z.object({
 *       timestamp: z.string(),
 *       id: z.number().int(),
 *     }).optional(),
 *   });
 *   (Empty object `{}` is a valid input — returns the first page with default limit.)
 *
 * Return type:
 *   type FeedItem = {
 *     id: number;              // LibraryItem.id
 *     status: string;          // LibraryItemStatus value
 *     activityTimestamp: Date; // GREATEST(createdAt, statusChangedAt)
 *     userId: string;
 *     gameId: string;
 *     userName: string | null;
 *     userUsername: string | null;
 *     userImage: string | null;
 *     gameTitle: string;
 *     gameCoverImage: string | null;
 *     gameSlug: string;
 *   };
 *
 *   type ActivityFeedResult = {
 *     items: FeedItem[];
 *     nextCursor: { timestamp: string; id: number } | null;
 *   };
 *
 * Feed composition (auth-gated viewer feed):
 *   The feed returned for userId X contains LibraryItem rows from:
 *     - Users that X follows (with isPublicProfile = true).
 *   Own-activity is NOT included in the social feed (consistent with
 *   canonical `findFeedForUser` which joins on Follow — self-rows require a
 *   self-follow which is disallowed). An authenticated viewer sees only their
 *   followees' activity. The user's own activity is exposed via the separate
 *   `/u/$username/activity` tab (getPublicActivityForUser — not this fn).
 *
 * Cross-user visibility rules:
 *   Only LibraryItem rows belonging to users with isPublicProfile = true
 *   appear in the feed. Private-profile activity is silently excluded.
 *
 * Ordering:
 *   Items are ordered by activityTimestamp DESC (most recent first), then
 *   by LibraryItem.id DESC for stable tie-breaking.
 *
 * Cursor pagination:
 *   nextCursor is null when fewer items than the requested limit are returned.
 *   A non-null cursor can be passed in a subsequent call to fetch the next page.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { getActivityFeedWorker } from "@/features/view-activity-feed/api/get-activity-feed.worker";
import { UnauthorizedError } from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-activity-feed");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

let _igdbCounter = 60_000;

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `gaf-user-${suffix}`,
    email: `gaf-${suffix}@example.com`,
    name: `GAF User ${suffix}`,
    username: `gaf-${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `gaf-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `GAF Game ${suffix}`,
    slug: `gaf-game-${suffix}`,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeLibraryItem(
  userId: string,
  gameId: string,
  opts: {
    status?: "WISHLIST" | "SHELF" | "UP_NEXT" | "PLAYING" | "PLAYED";
    createdAt?: Date;
  } = {}
) {
  return {
    userId,
    gameId,
    status: (opts.status ?? "SHELF") as
      | "WISHLIST"
      | "SHELF"
      | "UP_NEXT"
      | "PLAYING"
      | "PLAYED",
    acquisitionType: "DIGITAL" as const,
    createdAt: opts.createdAt ?? new Date("2024-06-01T00:00:00.000Z"),
    updatedAt: opts.createdAt ?? new Date("2024-06-01T00:00:00.000Z"),
  };
}

function makeFollow(followerId: string, followingId: string) {
  return { followerId, followingId };
}

// ---------------------------------------------------------------------------
// Common setup:
//   - alice: the authenticated viewer; follows bob (public) + does NOT follow carol.
//   - bob: public profile with library items.
//   - carol: public profile with library items (alice does NOT follow).
//   - private-dan: private profile that bob follows (to test privacy exclusion).
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order.
  await db.prisma.follow.deleteMany();
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("bob") });
  await db.prisma.user.create({ data: makeUser("carol") });
  await db.prisma.user.create({
    data: makeUser("private-dan", { isPublicProfile: false }),
  });

  await db.prisma.game.create({ data: makeGame("a") });
  await db.prisma.game.create({ data: makeGame("b") });
  await db.prisma.game.create({ data: makeGame("c") });

  // alice follows bob.
  await db.prisma.follow.create({
    data: makeFollow("gaf-user-alice", "gaf-user-bob"),
  });

  // bob has two library items.
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("gaf-user-bob", "gaf-game-a", {
      status: "PLAYING",
      createdAt: new Date("2024-06-01T10:00:00.000Z"),
    }),
  });
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("gaf-user-bob", "gaf-game-b", {
      status: "PLAYED",
      createdAt: new Date("2024-06-02T10:00:00.000Z"),
    }),
  });

  // carol has a library item (alice does NOT follow carol).
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("gaf-user-carol", "gaf-game-c", {
      status: "SHELF",
      createdAt: new Date("2024-06-03T10:00:00.000Z"),
    }),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("getActivityFeedWorker", () => {
  // -------------------------------------------------------------------------
  // Auth gate — feed requires authentication
  // -------------------------------------------------------------------------

  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(getActivityFeedWorker(undefined, {})).rejects.toThrow(
        UnauthorizedError
      );
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — returns followees' activity
  // -------------------------------------------------------------------------

  describe("happy path (alice views her feed)", () => {
    it("returns items from users alice follows", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      const userIds = result.items.map((item) => item.userId);
      expect(userIds).toContain("gaf-user-bob");
    });

    it("does not return items from users alice does not follow", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      const userIds = result.items.map((item) => item.userId);
      expect(userIds).not.toContain("gaf-user-carol");
    });

    it("returns both of bob's library items in alice's feed", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      const bobItems = result.items.filter(
        (item) => item.userId === "gaf-user-bob"
      );
      expect(bobItems).toHaveLength(2);
    });

    it("returns items ordered by activityTimestamp DESC (most recent first)", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      const timestamps = result.items.map((item) =>
        item.activityTimestamp.getTime()
      );
      // Each timestamp must be >= the next one.
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]!);
      }
    });
  });

  // -------------------------------------------------------------------------
  // Cross-user visibility — private profile excluded from feed
  // -------------------------------------------------------------------------

  describe("cross-user visibility (private profile exclusion)", () => {
    it("excludes activity from private-profile users even when a followee follows them", async () => {
      // bob follows private-dan; private-dan has a library item.
      await db.prisma.follow.create({
        data: makeFollow("gaf-user-bob", "gaf-user-private-dan"),
      });
      await db.prisma.libraryItem.create({
        data: makeLibraryItem("gaf-user-private-dan", "gaf-game-a", {
          status: "PLAYING",
          createdAt: new Date("2024-06-04T10:00:00.000Z"),
        }),
      });

      // alice follows bob; alice's feed should NOT include private-dan's items
      // even though bob follows private-dan.
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      const userIds = result.items.map((item) => item.userId);
      expect(userIds).not.toContain("gaf-user-private-dan");
    });

    it("does not include alice's own library items in her social feed", async () => {
      // alice has her own library item.
      await db.prisma.libraryItem.create({
        data: makeLibraryItem("gaf-user-alice", "gaf-game-c", {
          status: "PLAYING",
          createdAt: new Date("2024-06-05T10:00:00.000Z"),
        }),
      });

      const result = await getActivityFeedWorker("gaf-user-alice", {});

      const userIds = result.items.map((item) => item.userId);
      // Own items are NOT in the social feed — own-activity is via the separate
      // /u/$username/activity tab (different worker).
      expect(userIds).not.toContain("gaf-user-alice");
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------

  describe("return shape", () => {
    it("returns items with the required FeedItem fields", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("nextCursor");
      expect(Array.isArray(result.items)).toBe(true);

      if (result.items.length > 0) {
        const item = result.items[0]!;
        expect(item).toHaveProperty("id");
        expect(item).toHaveProperty("status");
        expect(item).toHaveProperty("activityTimestamp");
        expect(item).toHaveProperty("userId");
        expect(item).toHaveProperty("gameId");
        expect(item).toHaveProperty("userName");
        expect(item).toHaveProperty("userUsername");
        expect(item).toHaveProperty("userImage");
        expect(item).toHaveProperty("gameTitle");
        expect(item).toHaveProperty("gameCoverImage");
        expect(item).toHaveProperty("gameSlug");
      }
    });

    it("activityTimestamp is a Date instance", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      expect(result.items.length).toBeGreaterThan(0);
      expect(result.items[0]!.activityTimestamp).toBeInstanceOf(Date);
    });
  });

  // -------------------------------------------------------------------------
  // Empty feed
  // -------------------------------------------------------------------------

  describe("empty feed", () => {
    it("returns an empty items array when the viewer follows nobody", async () => {
      // carol follows nobody.
      const result = await getActivityFeedWorker("gaf-user-carol", {});

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it("returns an empty items array when followees have no library items", async () => {
      // Make carol follow alice (alice has no library items in this fixture).
      await db.prisma.follow.create({
        data: makeFollow("gaf-user-carol", "gaf-user-alice"),
      });

      const result = await getActivityFeedWorker("gaf-user-carol", {});

      expect(result.items).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Cursor pagination
  // -------------------------------------------------------------------------

  describe("cursor pagination", () => {
    it("returns nextCursor = null when items count is below the limit", async () => {
      // Default limit is 20; we only have 2 items in alice's feed.
      const result = await getActivityFeedWorker("gaf-user-alice", {});

      expect(result.nextCursor).toBeNull();
    });

    it("returns nextCursor = null when limit is explicitly set above item count", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {
        limit: 50,
      });

      expect(result.nextCursor).toBeNull();
    });

    it("returns a non-null nextCursor when limit is smaller than total items", async () => {
      const result = await getActivityFeedWorker("gaf-user-alice", {
        limit: 1,
      });

      // alice has 2 items from bob; with limit=1, there should be a next page.
      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).not.toBeNull();
    });

    it("fetches the second page using the cursor from the first page", async () => {
      const firstPage = await getActivityFeedWorker("gaf-user-alice", {
        limit: 1,
      });
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await getActivityFeedWorker("gaf-user-alice", {
        limit: 1,
        cursor: firstPage.nextCursor!,
      });

      // Second page must have at least one item different from the first.
      expect(secondPage.items.length).toBeGreaterThan(0);
      expect(secondPage.items[0]!.id).not.toBe(firstPage.items[0]!.id);
    });
  });
});
