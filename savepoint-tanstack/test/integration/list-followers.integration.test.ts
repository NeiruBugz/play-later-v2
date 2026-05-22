/**
 * RED integration test for listFollowers (Slice 20 — social graph).
 *
 * This test is intentionally failing: `@/features/social-discovery/api/list-followers.worker`
 * does not exist yet. The import fails at module-resolution — that is the
 * canonical RED state. Do not implement production code in this file.
 *
 * Real Prisma against the isolated test DB for all assertions.
 * No mocks — pure DB read.
 *
 * ============================================================
 * CONTRACT (locked here; GREEN agent must not deviate without
 * updating this comment block)
 * ============================================================
 *
 * Location decision (locked in spec):
 *   The server fn + worker live under `features/social-discovery/api/` to keep
 *   the follow/unfollow features focused on the mutation surface. Separate from
 *   `features/follow-user/` and `features/unfollow-user/`.
 *
 * Worker signature:
 *   listFollowersWorker(
 *     userId: string | undefined,
 *     data: unknown,
 *   ): Promise<ListFollowersResult>
 *
 * NOTE: Listing followers is a public read — an unauthenticated viewer can
 * view the followers of a public profile. The worker accepts
 * `userId: string | undefined` and does NOT throw UnauthorizedError when
 * undefined. Authentication is optional; pass undefined for anonymous calls.
 *
 * Input shape (Zod-validated inside worker):
 *   const LIST_FOLLOWERS_INPUT = z.object({
 *     targetUserId: z.string().min(1),  // whose followers to list
 *   });
 *
 * Return type:
 *   type ListFollowersResult = {
 *     followers: Array<{
 *       id: string;
 *       name: string | null;
 *       username: string | null;
 *       image: string | null;
 *     }>;
 *     total: number;
 *   };
 *
 * Visibility rule:
 *   Only followers with `isPublicProfile = true` appear in the result.
 *   Private followers are silently excluded.
 *
 * Target privacy:
 *   If `targetUserId` is a non-public user, the query returns an empty
 *   followers list (consistent privacy invariant: private profiles have no
 *   visible social graph). Implementation note: the entity query may either
 *   throw NotFoundError or return `{ followers: [], total: 0 }` for a private
 *   target — prefer returning empty to match the public-list UX (no error
 *   page for "this user has no public followers"). GREEN agent: document the
 *   chosen approach here.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { listFollowersWorker } from "@/features/social-discovery/api/list-followers.worker";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("list-followers");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `lf-user-${suffix}`,
    email: `lf-${suffix}@example.com`,
    name: `LF User ${suffix}`,
    username: `lf-${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeFollow(followerId: string, followingId: string) {
  return { followerId, followingId };
}

// ---------------------------------------------------------------------------
// Common setup: target + several followers (mix of public/private).
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();

  // Target user (public).
  await db.prisma.user.create({ data: makeUser("bob") });

  // Public followers.
  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("carol") });

  // Private follower — must not appear in results.
  await db.prisma.user.create({
    data: makeUser("private-dan", { isPublicProfile: false }),
  });

  // Another public user who does NOT follow bob — used for isolation checks.
  await db.prisma.user.create({ data: makeUser("eve") });

  // Seed follows: alice + carol + private-dan → bob.
  await db.prisma.follow.create({
    data: makeFollow("lf-user-alice", "lf-user-bob"),
  });
  await db.prisma.follow.create({
    data: makeFollow("lf-user-carol", "lf-user-bob"),
  });
  await db.prisma.follow.create({
    data: makeFollow("lf-user-private-dan", "lf-user-bob"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("listFollowersWorker", () => {
  // -------------------------------------------------------------------------
  // Happy path — anonymous viewer
  // -------------------------------------------------------------------------

  describe("anonymous viewer (userId = undefined)", () => {
    it("returns public followers without requiring authentication", async () => {
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-bob",
      });

      expect(result.followers.length).toBeGreaterThan(0);
    });

    it("includes only followers with isPublicProfile = true", async () => {
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-bob",
      });

      const ids = result.followers.map((f) => f.id);
      expect(ids).toContain("lf-user-alice");
      expect(ids).toContain("lf-user-carol");
      // Private follower must be absent.
      expect(ids).not.toContain("lf-user-private-dan");
    });

    it("total reflects only public followers", async () => {
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-bob",
      });

      // 2 public followers (alice + carol); private-dan excluded.
      expect(result.total).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — authenticated viewer
  // -------------------------------------------------------------------------

  describe("authenticated viewer", () => {
    it("returns the same public-only followers list for an authenticated viewer", async () => {
      const result = await listFollowersWorker("lf-user-eve", {
        targetUserId: "lf-user-bob",
      });

      const ids = result.followers.map((f) => f.id);
      expect(ids).toContain("lf-user-alice");
      expect(ids).toContain("lf-user-carol");
      expect(ids).not.toContain("lf-user-private-dan");
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------

  describe("return shape", () => {
    it("returns followers with id, name, username, image fields", async () => {
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-bob",
      });

      expect(result.followers.length).toBeGreaterThan(0);

      const follower = result.followers[0];
      expect(follower).toHaveProperty("id");
      expect(follower).toHaveProperty("name");
      expect(follower).toHaveProperty("username");
      expect(follower).toHaveProperty("image");
    });

    it("returns total as a number", async () => {
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-bob",
      });

      expect(typeof result.total).toBe("number");
    });
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe("empty state", () => {
    it("returns an empty followers array when the target has no followers", async () => {
      // eve has no followers.
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-eve",
      });

      expect(result.followers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Does not leak other users' follow relationships
  // -------------------------------------------------------------------------

  describe("given the target user has a private profile", () => {
    it("returns empty followers list without throwing when target is private", async () => {
      // private-dan has isPublicProfile = false (seeded in common setup).
      const result = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-private-dan",
      });
      expect(result.followers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("isolation", () => {
    it("does not include followers of other users in the result", async () => {
      // alice follows bob; make alice also follow eve.
      await db.prisma.follow.create({
        data: makeFollow("lf-user-alice", "lf-user-eve"),
      });

      // Query bob's followers — alice should appear.
      const bobResult = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-bob",
      });
      // Query eve's followers — alice should also appear.
      const eveResult = await listFollowersWorker(undefined, {
        targetUserId: "lf-user-eve",
      });

      // Bob's result must not contain eve's follower counts.
      expect(bobResult.total).toBe(2); // alice + carol (not eve's count)
      expect(eveResult.total).toBe(1); // alice only
    });
  });
});
