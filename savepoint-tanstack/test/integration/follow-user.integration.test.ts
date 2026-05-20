/**
 * RED integration test for followUser (Slice 20 — social graph).
 *
 * This test is intentionally failing: `@/features/follow-user/api/follow-user.worker`
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
 *   followUserWorker(
 *     userId: string | undefined,
 *     data: unknown,
 *   ): Promise<void>
 *
 * The worker owns its own auth gate: if `userId` is undefined it throws
 * `UnauthorizedError`. The `createServerFn` wrapper in
 * `features/follow-user/api/follow-user.ts` delegates to this worker.
 *
 * Input shape (Zod-validated inside worker):
 *   const FOLLOW_USER_INPUT = z.object({
 *     targetUserId: z.string().min(1),
 *   });
 *
 * Self-follow rule (intentional divergence from canonical savepoint-app):
 *   Canonical SocialService throws `ConflictError` on self-follow.
 *   Tanstack worker throws `ValidationError` instead (locked in spec).
 *   Rationale: self-follow is a semantic input error (the value itself is
 *   invalid for the operation), not a constraint conflict.
 *
 * Idempotency rule (intentional divergence from canonical follow-repository):
 *   Canonical `createFollow` throws `ConflictError` on a duplicate P2002.
 *   Tanstack worker performs an upsert / skip-on-conflict: a second call with
 *   the same (followerId, targetUserId) pair is a no-op and returns void —
 *   NOT a `ConflictError`. Mirrors the Slice 10 `addGameToLibrary` idempotency
 *   precedent. Rationale: client retry storms must not surface errors to users.
 *
 * Visibility rule:
 *   The target user must have `isPublicProfile = true`; following a private
 *   profile throws `NotFoundError` (privacy invariant: "missing" and "denied"
 *   collapse to the same error to prevent enumeration attacks).
 *
 * Return value:
 *   void on success (the caller revalidates the route after the call).
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { followUserWorker } from "@/features/follow-user/api/follow-user.worker";
import {
  NotFoundError,
  UnauthorizedError,
  ValidationError,
} from "@/shared/lib/errors";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("follow-user");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `fu-user-${suffix}`,
    email: `fu-${suffix}@example.com`,
    name: `FU User ${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

// ---------------------------------------------------------------------------
// Common setup: two public users + one private user.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  // Truncate in FK-safe order.
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();

  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("bob") });
  await db.prisma.user.create({
    data: makeUser("private", { isPublicProfile: false }),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("followUserWorker", () => {
  // -------------------------------------------------------------------------
  // Auth gate
  // -------------------------------------------------------------------------

  describe("auth gate", () => {
    it("throws UnauthorizedError when userId is undefined", async () => {
      await expect(
        followUserWorker(undefined, { targetUserId: "fu-user-bob" })
      ).rejects.toThrow(UnauthorizedError);
    });

    it("does not create a Follow row when unauthenticated", async () => {
      await expect(
        followUserWorker(undefined, { targetUserId: "fu-user-bob" })
      ).rejects.toThrow(UnauthorizedError);

      const count = await db.prisma.follow.count();
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path
  // -------------------------------------------------------------------------

  describe("happy path", () => {
    it("creates a Follow row between two public users", async () => {
      await followUserWorker("fu-user-alice", { targetUserId: "fu-user-bob" });

      const follow = await db.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: "fu-user-alice",
            followingId: "fu-user-bob",
          },
        },
      });
      expect(follow).not.toBeNull();
    });

    it("returns void on success", async () => {
      const result = await followUserWorker("fu-user-alice", {
        targetUserId: "fu-user-bob",
      });

      expect(result).toBeUndefined();
    });

    it("increments follower count for the target user after follow", async () => {
      const before = await db.prisma.follow.count({
        where: { followingId: "fu-user-bob" },
      });

      await followUserWorker("fu-user-alice", { targetUserId: "fu-user-bob" });

      const after = await db.prisma.follow.count({
        where: { followingId: "fu-user-bob" },
      });
      expect(after).toBe(before + 1);
    });
  });

  // -------------------------------------------------------------------------
  // Self-follow rejection — ValidationError (diverges from canonical ConflictError)
  // -------------------------------------------------------------------------

  describe("self-follow", () => {
    it("throws ValidationError when the caller attempts to follow themselves", async () => {
      await expect(
        followUserWorker("fu-user-alice", { targetUserId: "fu-user-alice" })
      ).rejects.toThrow(ValidationError);
    });

    it("does not create a Follow row on self-follow attempt", async () => {
      await expect(
        followUserWorker("fu-user-alice", { targetUserId: "fu-user-alice" })
      ).rejects.toThrow(ValidationError);

      const count = await db.prisma.follow.count({
        where: { followerId: "fu-user-alice", followingId: "fu-user-alice" },
      });
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Idempotency — double-follow is a no-op, NOT a ConflictError
  // -------------------------------------------------------------------------

  describe("idempotency (double-follow)", () => {
    it("does not throw on a second follow call for the same pair", async () => {
      await followUserWorker("fu-user-alice", { targetUserId: "fu-user-bob" });

      // Second call must not throw.
      await expect(
        followUserWorker("fu-user-alice", { targetUserId: "fu-user-bob" })
      ).resolves.toBeUndefined();
    });

    it("leaves exactly one Follow row after two identical follow calls", async () => {
      await followUserWorker("fu-user-alice", { targetUserId: "fu-user-bob" });
      await followUserWorker("fu-user-alice", { targetUserId: "fu-user-bob" });

      const count = await db.prisma.follow.count({
        where: {
          followerId: "fu-user-alice",
          followingId: "fu-user-bob",
        },
      });
      expect(count).toBe(1);
    });
  });

  // -------------------------------------------------------------------------
  // Privacy invariant — following a private profile throws NotFoundError
  // -------------------------------------------------------------------------

  describe("private profile visibility", () => {
    it("throws NotFoundError when the target user has isPublicProfile = false", async () => {
      await expect(
        followUserWorker("fu-user-alice", { targetUserId: "fu-user-private" })
      ).rejects.toThrow(NotFoundError);
    });

    it("does not create a Follow row when target profile is private", async () => {
      await expect(
        followUserWorker("fu-user-alice", { targetUserId: "fu-user-private" })
      ).rejects.toThrow(NotFoundError);

      const count = await db.prisma.follow.count({
        where: { followingId: "fu-user-private" },
      });
      expect(count).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Target not found
  // -------------------------------------------------------------------------

  describe("target user not found", () => {
    it("throws NotFoundError when the target userId does not exist", async () => {
      await expect(
        followUserWorker("fu-user-alice", {
          targetUserId: "fu-user-nonexistent",
        })
      ).rejects.toThrow(NotFoundError);
    });
  });
});
