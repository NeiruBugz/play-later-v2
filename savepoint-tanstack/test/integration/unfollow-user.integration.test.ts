/**
 * RED integration test for unfollowUser (Slice 20 — social graph).
 *
 * This test is intentionally failing: `@/features/unfollow-user/api/unfollow-user.worker`
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
 * Worker signature:
 *   unfollowUserWorker(
 *     userId: string | undefined,
 *     data: unknown,
 *   ): Promise<void>
 *
 * The worker owns its own auth gate: if `userId` is undefined it throws
 * `UnauthorizedError`. The `createServerFn` wrapper in
 * `features/unfollow-user/api/unfollow-user.ts` delegates to this worker.
 *
 * Input shape (Zod-validated inside worker):
 *   const UNFOLLOW_USER_INPUT = z.object({
 *     targetUserId: z.string().min(1),
 *   });
 *
 * Idempotency rule:
 *   Unfollowing a user who is not currently followed is a no-op — NOT a
 *   `NotFoundError`. The underlying `deleteMany` (no throw on missing row)
 *   makes this natural. This mirrors canonical `deleteFollow` which also
 *   uses `deleteMany`.
 *
 * Self-unfollow:
 *   Not a distinct error case — self-follow rows cannot exist (blocked by
 *   followUserWorker), so unfollowing self is just a no-op (0 rows deleted).
 *
 * Return value:
 *   void on success.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { unfollowUserWorker } from "@/features/unfollow-user/api/unfollow-user.worker";
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
  db = await setupIsolatedDatabase("unfollow-user");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeUser(suffix: string) {
  return {
    id: `ufu-user-${suffix}`,
    email: `ufu-${suffix}@example.com`,
    name: `UFU User ${suffix}`,
    emailVerified: true,
    isPublicProfile: true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeFollow(followerId: string, followingId: string) {
  return { followerId, followingId };
}

// ---------------------------------------------------------------------------
// Common setup: two users + an existing follow relationship alice → bob.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order.
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("bob") });
  await db.prisma.user.create({ data: makeUser("carol") });

  // alice already follows bob at the start of each test.
  await db.prisma.follow.create({
    data: makeFollow("ufu-user-alice", "ufu-user-bob"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("unfollowUserWorker", () => {
  // -------------------------------------------------------------------------
  // Auth gate
  // -------------------------------------------------------------------------

  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(
        unfollowUserWorker(undefined, { targetUserId: "ufu-user-bob" })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("does not remove any Follow rows when unauthenticated", async () => {
      const before = await db.prisma.follow.count();

      await expect(
        unfollowUserWorker(undefined, { targetUserId: "ufu-user-bob" })
      ).rejects.toThrow(UnauthorizedError);

      const after = await db.prisma.follow.count();
      expect(after).toBe(before);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("happy path", () => {
    it("removes the Follow row when alice unfollows bob", async () => {
      await unfollowUserWorker("ufu-user-alice", {
        targetUserId: "ufu-user-bob",
      });

      const follow = await db.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: "ufu-user-alice",
            followingId: "ufu-user-bob",
          },
        },
      });
      expect(follow).toBeNull();
    });

    it("returns void on success", async () => {
      const result = await unfollowUserWorker("ufu-user-alice", {
        targetUserId: "ufu-user-bob",
      });

      expect(result).toBeUndefined();
    });

    it("decrements follower count for the target user after unfollow", async () => {
      const before = await db.prisma.follow.count({
        where: { followingId: "ufu-user-bob" },
      });

      await unfollowUserWorker("ufu-user-alice", {
        targetUserId: "ufu-user-bob",
      });

      const after = await db.prisma.follow.count({
        where: { followingId: "ufu-user-bob" },
      });
      expect(after).toBe(before - 1);
    });

    it("does not affect other Follow rows belonging to the same user", async () => {
      // Add a second follow: alice → carol
      await db.prisma.follow.create({
        data: makeFollow("ufu-user-alice", "ufu-user-carol"),
      });

      // Unfollow bob only.
      await unfollowUserWorker("ufu-user-alice", {
        targetUserId: "ufu-user-bob",
      });

      // alice → carol must still exist.
      const carolFollow = await db.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: "ufu-user-alice",
            followingId: "ufu-user-carol",
          },
        },
      });
      expect(carolFollow).not.toBeNull();
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency — unfollowing someone not followed is a no-op
  // -------------------------------------------------------------------------

  describe("idempotency (unfollow when not following)", () => {
    it("does not throw when the follow relationship does not exist", async () => {
      // carol has never followed bob.
      await expect(
        unfollowUserWorker("ufu-user-carol", { targetUserId: "ufu-user-bob" })
      ).resolves.toBeUndefined();
    });

    it("leaves the DB unchanged when no follow row exists to remove", async () => {
      const before = await db.prisma.follow.count();

      // carol has never followed bob.
      await unfollowUserWorker("ufu-user-carol", {
        targetUserId: "ufu-user-bob",
      });

      const after = await db.prisma.follow.count();
      expect(after).toBe(before);
    });

    it("is safe to call twice on the same pair", async () => {
      await unfollowUserWorker("ufu-user-alice", {
        targetUserId: "ufu-user-bob",
      });

      // Second call is a no-op.
      await expect(
        unfollowUserWorker("ufu-user-alice", { targetUserId: "ufu-user-bob" })
      ).resolves.toBeUndefined();
    });
  });

  // -------------------------------------------------------------------------
  // Isolation — only the requested follow row is removed
  // -------------------------------------------------------------------------

  describe("isolation", () => {
    it("does not remove bob's follows when alice unfollows bob", async () => {
      // bob follows carol.
      await db.prisma.follow.create({
        data: makeFollow("ufu-user-bob", "ufu-user-carol"),
      });

      await unfollowUserWorker("ufu-user-alice", {
        targetUserId: "ufu-user-bob",
      });

      const bobCarolFollow = await db.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: "ufu-user-bob",
            followingId: "ufu-user-carol",
          },
        },
      });
      expect(bobCarolFollow).not.toBeNull();
    });
  });
});
