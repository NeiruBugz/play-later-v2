/**
 * Integration tests for countFollowers, countFollowing, and isFollowing.
 *
 * countFollowers:
 *   - Returns 0 for non-public target
 *   - Returns 0 for missing target
 *   - Returns 0 when public target has no followers
 *   - Counts only public followers for a public target
 *   - Excludes private followers from the count
 *
 * countFollowing:
 *   - Returns 0 for non-public target
 *   - Returns 0 for missing target
 *   - Counts only public accounts the target follows
 *   - Excludes private accounts from the count
 *
 * isFollowing:
 *   - Returns false when no follow row exists
 *   - Returns true when a follow row exists
 *   - Returns false for a non-existent follower
 */

import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";

import { countFollowers } from "@/entities/follow/api/count-followers.server";
import { countFollowing } from "@/entities/follow/api/count-following.server";
import { isFollowing } from "@/entities/follow/api/is-following.server";

import {
  setupIsolatedDatabase,
  type IsolatedDatabase,
} from "../setup/isolated-db.ts";

let db: IsolatedDatabase;

beforeAll(async () => {
  db = await setupIsolatedDatabase("follow-counts-is-following");
}, 60_000);

afterAll(async () => {
  await db?.teardown();
});

function makeUser(suffix: string, opts: { isPublicProfile?: boolean } = {}) {
  return {
    id: `fcif-user-${suffix}`,
    email: `fcif-${suffix}@example.com`,
    name: `FCIF User ${suffix}`,
    username: `fcif-${suffix}`,
    emailVerified: true,
    isPublicProfile: opts.isPublicProfile ?? true,
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-01T00:00:00.000Z"),
  };
}

function makeFollow(followerId: string, followingId: string) {
  return { followerId, followingId };
}

beforeEach(async () => {
  await db.prisma.follow.deleteMany();
  await db.prisma.user.deleteMany();

  // Canonical fixture: alice (public), bob (public), carol (public), private-dan (private).
  await db.prisma.user.create({ data: makeUser("alice") });
  await db.prisma.user.create({ data: makeUser("bob") });
  await db.prisma.user.create({ data: makeUser("carol") });
  await db.prisma.user.create({
    data: makeUser("private-dan", { isPublicProfile: false }),
  });
});

// ---------------------------------------------------------------------------
// countFollowers
// ---------------------------------------------------------------------------

describe("countFollowers", () => {
  describe("given target has no followers", () => {
    it("returns 0 for a public user with no followers", async () => {
      const count = await countFollowers("fcif-user-alice");

      expect(count).toBe(0);
    });
  });

  describe("given target is not public", () => {
    it("returns 0 for a private profile (privacy invariant)", async () => {
      // Even if private-dan had followers, count should be 0.
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-alice", "fcif-user-private-dan"),
      });

      const count = await countFollowers("fcif-user-private-dan");

      expect(count).toBe(0);
    });
  });

  describe("given target does not exist", () => {
    it("returns 0 for a non-existent userId", async () => {
      const count = await countFollowers("fcif-user-nonexistent");

      expect(count).toBe(0);
    });
  });

  describe("given alice has public and private followers", () => {
    beforeEach(async () => {
      // bob (public) + carol (public) + private-dan (private) all follow alice.
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-bob", "fcif-user-alice"),
      });
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-carol", "fcif-user-alice"),
      });
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-private-dan", "fcif-user-alice"),
      });
    });

    it("counts only public followers", async () => {
      const count = await countFollowers("fcif-user-alice");

      // bob + carol = 2; private-dan excluded.
      expect(count).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// countFollowing
// ---------------------------------------------------------------------------

describe("countFollowing", () => {
  describe("given target has no followings", () => {
    it("returns 0 for a public user who follows nobody", async () => {
      const count = await countFollowing("fcif-user-alice");

      expect(count).toBe(0);
    });
  });

  describe("given target is not public", () => {
    it("returns 0 for a private profile (privacy invariant)", async () => {
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-private-dan", "fcif-user-alice"),
      });

      const count = await countFollowing("fcif-user-private-dan");

      expect(count).toBe(0);
    });
  });

  describe("given target does not exist", () => {
    it("returns 0 for a non-existent userId", async () => {
      const count = await countFollowing("fcif-user-nonexistent");

      expect(count).toBe(0);
    });
  });

  describe("given alice follows public and private accounts", () => {
    beforeEach(async () => {
      // alice follows bob (public) + carol (public) + private-dan (private).
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-alice", "fcif-user-bob"),
      });
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-alice", "fcif-user-carol"),
      });
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-alice", "fcif-user-private-dan"),
      });
    });

    it("counts only followings of public accounts", async () => {
      const count = await countFollowing("fcif-user-alice");

      // bob + carol = 2; private-dan excluded.
      expect(count).toBe(2);
    });
  });
});

// ---------------------------------------------------------------------------
// isFollowing
// ---------------------------------------------------------------------------

describe("isFollowing", () => {
  describe("given no follow row exists", () => {
    it("returns false", async () => {
      const result = await isFollowing("fcif-user-alice", "fcif-user-bob");

      expect(result).toBe(false);
    });
  });

  describe("given alice follows bob", () => {
    beforeEach(async () => {
      await db.prisma.follow.create({
        data: makeFollow("fcif-user-alice", "fcif-user-bob"),
      });
    });

    it("returns true for the (alice, bob) pair", async () => {
      const result = await isFollowing("fcif-user-alice", "fcif-user-bob");

      expect(result).toBe(true);
    });

    it("returns false for the reverse (bob, alice) pair", async () => {
      const result = await isFollowing("fcif-user-bob", "fcif-user-alice");

      expect(result).toBe(false);
    });
  });

  describe("given non-existent user IDs", () => {
    it("returns false without throwing", async () => {
      const result = await isFollowing(
        "fcif-user-ghost",
        "fcif-user-nonexistent"
      );

      expect(result).toBe(false);
    });
  });
});
