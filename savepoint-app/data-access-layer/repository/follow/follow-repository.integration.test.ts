import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import { createUser } from "@/test/setup/db-factories";

import { ConflictError } from "@/shared/lib/errors";

import {
  countFollowers,
  countFollowing,
  createFollow,
  deleteFollow,
  findFollowers,
  findFollowing,
  isFollowing,
} from "./follow-repository";

describe("FollowRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("createFollow", () => {
    it("should create a follow relationship successfully", async () => {
      const follower = await createUser();
      const following = await createUser();

      const result = await createFollow(follower.id, following.id);

      expect(result).toMatchObject({
        followerId: follower.id,
        followingId: following.id,
      });
    });

    it("should throw DuplicateError when creating the same follow relationship twice", async () => {
      const follower = await createUser();
      const following = await createUser();

      await createFollow(follower.id, following.id);

      await expect(createFollow(follower.id, following.id)).rejects.toThrow(
        ConflictError
      );
    });
  });

  describe("deleteFollow", () => {
    it("should remove an existing follow relationship", async () => {
      const follower = await createUser();
      const following = await createUser();

      await createFollow(follower.id, following.id);
      await deleteFollow(follower.id, following.id);

      const stillFollowing = await isFollowing(follower.id, following.id);
      expect(stillFollowing).toBe(false);
    });

    it("should be a no-op when deleting a non-existent follow relationship", async () => {
      const follower = await createUser();
      const following = await createUser();

      await expect(
        deleteFollow(follower.id, following.id)
      ).resolves.toBeUndefined();
    });
  });

  describe("findFollowers", () => {
    it("should return paginated list of followers with user profile data", async () => {
      const target = await createUser({ name: "Target User" });
      const follower1 = await createUser({
        name: "Follower One",
        isPublicProfile: true,
      });
      const follower2 = await createUser({
        name: "Follower Two",
        isPublicProfile: true,
      });

      await createFollow(follower1.id, target.id);
      await createFollow(follower2.id, target.id);

      const result = await findFollowers(target.id);

      expect(result.total).toBe(2);
      expect(result.followers).toHaveLength(2);

      const followerIds = result.followers.map((f) => f.id);
      expect(followerIds).toContain(follower1.id);
      expect(followerIds).toContain(follower2.id);

      const followerProfile = result.followers.find(
        (f) => f.id === follower1.id
      );
      expect(followerProfile).toMatchObject({
        id: follower1.id,
        name: follower1.name,
        username: follower1.username,
        image: follower1.image,
      });
    });

    it("should respect pagination options", async () => {
      const target = await createUser();
      const followers = await Promise.all([
        createUser({ isPublicProfile: true }),
        createUser({ isPublicProfile: true }),
        createUser({ isPublicProfile: true }),
      ]);

      for (const follower of followers) {
        await createFollow(follower.id, target.id);
      }

      const page = await findFollowers(target.id, { skip: 0, take: 2 });

      expect(page.total).toBe(3);
      expect(page.followers).toHaveLength(2);
    });

    it("should return empty list when user has no followers", async () => {
      const user = await createUser();

      const result = await findFollowers(user.id);

      expect(result.followers).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("findFollowing", () => {
    it("should return paginated list of followed users with user profile data", async () => {
      const follower = await createUser({ name: "The Follower" });
      const followed1 = await createUser({
        name: "Followed One",
        isPublicProfile: true,
      });
      const followed2 = await createUser({
        name: "Followed Two",
        isPublicProfile: true,
      });

      await createFollow(follower.id, followed1.id);
      await createFollow(follower.id, followed2.id);

      const result = await findFollowing(follower.id);

      expect(result.total).toBe(2);
      expect(result.following).toHaveLength(2);

      const followingIds = result.following.map((f) => f.id);
      expect(followingIds).toContain(followed1.id);
      expect(followingIds).toContain(followed2.id);

      const followedProfile = result.following.find(
        (f) => f.id === followed1.id
      );
      expect(followedProfile).toMatchObject({
        id: followed1.id,
        name: followed1.name,
        username: followed1.username,
        image: followed1.image,
      });
    });

    it("should respect pagination options", async () => {
      const follower = await createUser();
      const targets = await Promise.all([
        createUser({ isPublicProfile: true }),
        createUser({ isPublicProfile: true }),
        createUser({ isPublicProfile: true }),
      ]);

      for (const target of targets) {
        await createFollow(follower.id, target.id);
      }

      const page = await findFollowing(follower.id, { skip: 1, take: 2 });

      expect(page.total).toBe(3);
      expect(page.following).toHaveLength(2);
    });

    it("should return empty list when user follows nobody", async () => {
      const user = await createUser();

      const result = await findFollowing(user.id);

      expect(result.following).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("countFollowers", () => {
    it("should return the correct number of public followers", async () => {
      const target = await createUser();
      const follower1 = await createUser({ isPublicProfile: true });
      const follower2 = await createUser({ isPublicProfile: true });
      const follower3 = await createUser({ isPublicProfile: true });

      await createFollow(follower1.id, target.id);
      await createFollow(follower2.id, target.id);
      await createFollow(follower3.id, target.id);

      const count = await countFollowers(target.id);

      expect(count).toBe(3);
    });

    it("should exclude private followers from the count", async () => {
      const target = await createUser();
      const publicFollower = await createUser({ isPublicProfile: true });
      const privateFollower = await createUser({ isPublicProfile: false });

      await createFollow(publicFollower.id, target.id);
      await createFollow(privateFollower.id, target.id);

      const count = await countFollowers(target.id);

      expect(count).toBe(1);
    });

    it("should return zero when user has no followers", async () => {
      const user = await createUser();

      const count = await countFollowers(user.id);

      expect(count).toBe(0);
    });
  });

  describe("countFollowing", () => {
    it("should return the correct number of public users being followed", async () => {
      const follower = await createUser();
      const target1 = await createUser({ isPublicProfile: true });
      const target2 = await createUser({ isPublicProfile: true });

      await createFollow(follower.id, target1.id);
      await createFollow(follower.id, target2.id);

      const count = await countFollowing(follower.id);

      expect(count).toBe(2);
    });

    it("should exclude private users from the count", async () => {
      const follower = await createUser();
      const publicTarget = await createUser({ isPublicProfile: true });
      const privateTarget = await createUser({ isPublicProfile: false });

      await createFollow(follower.id, publicTarget.id);
      await createFollow(follower.id, privateTarget.id);

      const count = await countFollowing(follower.id);

      expect(count).toBe(1);
    });

    it("should return zero when user follows nobody", async () => {
      const user = await createUser();

      const count = await countFollowing(user.id);

      expect(count).toBe(0);
    });
  });

  describe("isFollowing", () => {
    it("should return true when a follow relationship exists", async () => {
      const follower = await createUser();
      const following = await createUser();

      await createFollow(follower.id, following.id);

      const result = await isFollowing(follower.id, following.id);

      expect(result).toBe(true);
    });

    it("should return false when no follow relationship exists", async () => {
      const follower = await createUser();
      const following = await createUser();

      const result = await isFollowing(follower.id, following.id);

      expect(result).toBe(false);
    });

    it("should return false after a follow relationship is deleted", async () => {
      const follower = await createUser();
      const following = await createUser();

      await createFollow(follower.id, following.id);
      await deleteFollow(follower.id, following.id);

      const result = await isFollowing(follower.id, following.id);

      expect(result).toBe(false);
    });

    it("should not confuse direction (A follows B is distinct from B follows A)", async () => {
      const userA = await createUser();
      const userB = await createUser();

      await createFollow(userA.id, userB.id);

      expect(await isFollowing(userA.id, userB.id)).toBe(true);
      expect(await isFollowing(userB.id, userA.id)).toBe(false);
    });
  });

  describe("cascade on user delete", () => {
    it("should remove all follow relationships when the follower is deleted", async () => {
      const follower = await createUser();
      const target1 = await createUser();
      const target2 = await createUser();

      await createFollow(follower.id, target1.id);
      await createFollow(follower.id, target2.id);

      const { testDb } = await import("@/test/setup/db-factories");
      await testDb!.user.delete({ where: { id: follower.id } });

      expect(await countFollowers(target1.id)).toBe(0);
      expect(await countFollowers(target2.id)).toBe(0);
    });

    it("should remove all follow relationships when the followed user is deleted", async () => {
      const target = await createUser();
      const follower1 = await createUser();
      const follower2 = await createUser();

      await createFollow(follower1.id, target.id);
      await createFollow(follower2.id, target.id);

      const { testDb } = await import("@/test/setup/db-factories");
      await testDb!.user.delete({ where: { id: target.id } });

      expect(await countFollowing(follower1.id)).toBe(0);
      expect(await countFollowing(follower2.id)).toBe(0);
    });
  });
});
