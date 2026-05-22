/**
 * Integration tests for getActivityForUser — the per-user activity query
 * (distinct from getActivityFeedForViewer which uses the Follow graph).
 *
 * Covers:
 *   - Returns the target user's own LibraryItem stream
 *   - No Follow-graph join (any user's items are returned)
 *   - Items ordered by activityTimestamp DESC
 *   - Cursor pagination: nextCursor null/non-null, second page
 *   - Empty result when user has no library items
 *   - Return shape (FeedItem fields present)
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { getActivityForUser } from "@/entities/activity-feed/api/get-activity-feed.server";
import { getActivityForUserWorker } from "@/features/view-activity-feed/api/get-activity-for-user.worker";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("get-activity-for-user");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

let _igdbCounter = 80_000;

function makeUser(suffix: string) {
  return {
    id: `gafu-user-${suffix}`,
    email: `gafu-${suffix}@example.com`,
    name: `GAFU User ${suffix}`,
    username: `gafu-${suffix}`,
    emailVerified: true,
    isPublicProfile: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeGame(suffix: string) {
  return {
    id: `gafu-game-${suffix}`,
    igdbId: _igdbCounter++,
    title: `GAFU Game ${suffix}`,
    slug: `gafu-game-${suffix}`,
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

beforeEach(async () => {
  await db.prisma.libraryItem.deleteMany();
  await db.prisma.game.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("bob") });

  await db.prisma.game.create({ data: makeGame("a") });
  await db.prisma.game.create({ data: makeGame("b") });
  await db.prisma.game.create({ data: makeGame("c") });

  // alice has two items.
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("gafu-user-alice", "gafu-game-a", {
      status: "PLAYING",
      createdAt: new Date("2024-06-01T10:00:00.000Z"),
    }),
  });
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("gafu-user-alice", "gafu-game-b", {
      status: "PLAYED",
      createdAt: new Date("2024-06-02T10:00:00.000Z"),
    }),
  });

  // bob has one item.
  await db.prisma.libraryItem.create({
    data: makeLibraryItem("gafu-user-bob", "gafu-game-c", {
      status: "SHELF",
      createdAt: new Date("2024-06-03T10:00:00.000Z"),
    }),
  });
});

describe("getActivityForUser", () => {
  describe("given alice has two library items", () => {
    it("returns alice's own library items", async () => {
      const result = await getActivityForUser("gafu-user-alice");

      const userIds = result.items.map((i) => i.userId);
      expect(userIds.every((id) => id === "gafu-user-alice")).toBe(true);
    });

    it("returns exactly two items for alice", async () => {
      const result = await getActivityForUser("gafu-user-alice");

      expect(result.items).toHaveLength(2);
    });

    it("does not include bob's items in alice's activity", async () => {
      const result = await getActivityForUser("gafu-user-alice");

      const userIds = result.items.map((i) => i.userId);
      expect(userIds).not.toContain("gafu-user-bob");
    });

    it("returns items ordered by activityTimestamp DESC", async () => {
      const result = await getActivityForUser("gafu-user-alice");

      const timestamps = result.items.map((i) => i.activityTimestamp.getTime());
      for (let i = 0; i < timestamps.length - 1; i++) {
        expect(timestamps[i]).toBeGreaterThanOrEqual(timestamps[i + 1]!);
      }
    });
  });

  describe("return shape", () => {
    it("returns items with required FeedItem fields", async () => {
      const result = await getActivityForUser("gafu-user-alice");

      expect(result).toHaveProperty("items");
      expect(result).toHaveProperty("nextCursor");

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
    });

    it("activityTimestamp is a Date instance", async () => {
      const result = await getActivityForUser("gafu-user-alice");

      expect(result.items[0]!.activityTimestamp).toBeInstanceOf(Date);
    });
  });

  describe("empty state", () => {
    it("returns empty items array when user has no library items", async () => {
      // Create a user with no items.
      await db.prisma.user.create({ data: makeUser("empty") });

      const result = await getActivityForUser("gafu-user-empty");

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("cursor pagination", () => {
    it("returns nextCursor = null when items count is below the limit", async () => {
      // alice has 2 items; default limit is 20.
      const result = await getActivityForUser("gafu-user-alice");

      expect(result.nextCursor).toBeNull();
    });

    it("returns a non-null nextCursor when limit is smaller than total items", async () => {
      const result = await getActivityForUser("gafu-user-alice", { limit: 1 });

      expect(result.items).toHaveLength(1);
      expect(result.nextCursor).not.toBeNull();
    });

    it("fetches the second page using the cursor from the first page", async () => {
      const firstPage = await getActivityForUser("gafu-user-alice", {
        limit: 1,
      });
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await getActivityForUser("gafu-user-alice", {
        limit: 1,
        cursor: firstPage.nextCursor!,
      });

      expect(secondPage.items.length).toBeGreaterThan(0);
      expect(secondPage.items[0]!.id).not.toBe(firstPage.items[0]!.id);
    });
  });
});

// ---- Worker smoke test ---------------------------------------------------

describe("getActivityForUserWorker", () => {
  it("delegates to getActivityForUser and returns items for the target user", async () => {
    const result = await getActivityForUserWorker(undefined, {
      targetUserId: "gafu-user-alice",
    });

    expect(result).toHaveProperty("items");
    expect(result.items.length).toBeGreaterThan(0);
    const userIds = result.items.map((i) => i.userId);
    expect(userIds.every((id) => id === "gafu-user-alice")).toBe(true);
  });
});
