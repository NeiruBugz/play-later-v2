/**
 * RED integration test for listFollowing (Slice 20 — social graph).
 *
 * This test is intentionally failing: `@/features/social-discovery/api/list-following.worker`
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
 *   Co-located with `listFollowersWorker` at `features/social-discovery/api/`.
 *
 * Worker signature:
 *   listFollowingWorker(
 *     userId: string | undefined,
 *     data: unknown,
 *   ): Promise<ListFollowingResult>
 *
 * NOTE: Listing following is a public read — an unauthenticated viewer can
 * view the accounts a public profile follows. The worker accepts
 * `userId: string | undefined` and does NOT throw UnauthorizedError when
 * undefined.
 *
 * Input shape (Zod-validated inside worker):
 *   const LIST_FOLLOWING_INPUT = z.object({
 *     targetUserId: z.string().min(1),  // whose following list to retrieve
 *   });
 *
 * Return type:
 *   type ListFollowingResult = {
 *     following: Array<{
 *       id: string;
 *       name: string | null;
 *       username: string | null;
 *       image: string | null;
 *     }>;
 *     total: number;
 *   };
 *
 * Visibility rule:
 *   Only accounts being followed that have `isPublicProfile = true` appear.
 *   Entries where the followed account is private are silently excluded.
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

// RED import — this module does not exist until the GREEN step.
import { listFollowingWorker } from "@/features/social-discovery/api/list-following.worker";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

// ---------------------------------------------------------------------------
// Isolated DB
// ---------------------------------------------------------------------------

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("list-following");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

// ---------------------------------------------------------------------------
// Fixture helpers
// ---------------------------------------------------------------------------

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `lfg-user-${suffix}`,
    email: `lfg-${suffix}@example.com`,
    name: `LFG User ${suffix}`,
    username: `lfg-${suffix}`,
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
// Common setup: alice (subject) follows bob (public) + carol (public) + private-dan.
// ---------------------------------------------------------------------------

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();

  // Subject user whose following list we query.
  await db.prisma.user.create({ data: makeUser("alice") });

  // Users alice follows.
  await db.prisma.user.create({ data: makeUser("bob") });
  await db.prisma.user.create({ data: makeUser("carol") });
  await db.prisma.user.create({
    data: makeUser("private-dan", { isPublicProfile: false }),
  });

  // Unrelated user — used for isolation checks.
  await db.prisma.user.create({ data: makeUser("eve") });

  // Seed follows: alice → bob, carol, private-dan.
  await db.prisma.follow.create({
    data: makeFollow("lfg-user-alice", "lfg-user-bob"),
  });
  await db.prisma.follow.create({
    data: makeFollow("lfg-user-alice", "lfg-user-carol"),
  });
  await db.prisma.follow.create({
    data: makeFollow("lfg-user-alice", "lfg-user-private-dan"),
  });
});

// ---------------------------------------------------------------------------
// Test suite
// ---------------------------------------------------------------------------

describe("listFollowingWorker", () => {
  // -------------------------------------------------------------------------
  // Happy path — anonymous viewer
  // -------------------------------------------------------------------------

  describe("anonymous viewer (userId = undefined)", () => {
    it("returns public following entries without requiring authentication", async () => {
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-alice",
      });

      expect(result.following.length).toBeGreaterThan(0);
    });

    it("includes only followed accounts with isPublicProfile = true", async () => {
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-alice",
      });

      const ids = result.following.map((f) => f.id);
      expect(ids).toContain("lfg-user-bob");
      expect(ids).toContain("lfg-user-carol");
      // Private account must be absent.
      expect(ids).not.toContain("lfg-user-private-dan");
    });

    it("total reflects only public following entries", async () => {
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-alice",
      });

      // 2 public following (bob + carol); private-dan excluded.
      expect(result.total).toBe(2);
    });
  });

  // -------------------------------------------------------------------------
  // Happy path — authenticated viewer
  // -------------------------------------------------------------------------

  describe("authenticated viewer", () => {
    it("returns the same public-only following list for an authenticated viewer", async () => {
      const result = await listFollowingWorker("lfg-user-eve", {
        targetUserId: "lfg-user-alice",
      });

      const ids = result.following.map((f) => f.id);
      expect(ids).toContain("lfg-user-bob");
      expect(ids).toContain("lfg-user-carol");
      expect(ids).not.toContain("lfg-user-private-dan");
    });
  });

  // -------------------------------------------------------------------------
  // Return shape
  // -------------------------------------------------------------------------

  describe("return shape", () => {
    it("returns following entries with id, name, username, image fields", async () => {
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-alice",
      });

      expect(result.following.length).toBeGreaterThan(0);

      const entry = result.following[0];
      expect(entry).toHaveProperty("id");
      expect(entry).toHaveProperty("name");
      expect(entry).toHaveProperty("username");
      expect(entry).toHaveProperty("image");
    });

    it("returns total as a number", async () => {
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-alice",
      });

      expect(typeof result.total).toBe("number");
    });
  });

  // -------------------------------------------------------------------------
  // Empty state
  // -------------------------------------------------------------------------

  describe("empty state", () => {
    it("returns an empty following array when the target follows nobody", async () => {
      // eve follows nobody.
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-eve",
      });

      expect(result.following).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  // -------------------------------------------------------------------------
  // Symmetry — listFollowers and listFollowing are independent
  // -------------------------------------------------------------------------

  describe("symmetry with listFollowers", () => {
    it("alice following bob does not make bob appear in alice's followers list", async () => {
      // alice follows bob — but bob does NOT follow alice in this fixture.
      const result = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-bob",
      });

      // bob's following list should be empty (he doesn't follow anyone here).
      expect(result.following).toHaveLength(0);
    });
  });

  // -------------------------------------------------------------------------
  // Isolation
  // -------------------------------------------------------------------------

  describe("isolation", () => {
    it("does not include following relationships of other users", async () => {
      // bob also follows carol.
      await db.prisma.follow.create({
        data: makeFollow("lfg-user-bob", "lfg-user-carol"),
      });

      const aliceResult = await listFollowingWorker(undefined, {
        targetUserId: "lfg-user-alice",
      });

      // alice follows bob + carol; bob's additional follow of carol must not
      // inflate alice's total.
      expect(aliceResult.total).toBe(2);
    });
  });
});
