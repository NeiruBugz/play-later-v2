import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
  testDb,
} from "@/test/setup/db-factories";
import { type User } from "@prisma/client";

import { findFeedForUser, findPopularFeed } from "./activity-feed-repository";

async function createPublicUser(
  options: Parameters<typeof createUser>[0] = {}
): Promise<User> {
  const user = await createUser(options);
  return testDb!.user.update({
    where: { id: user.id },
    data: { isPublicProfile: true },
  });
}

async function follow(followerId: string, followingId: string): Promise<void> {
  await testDb!.follow.create({ data: { followerId, followingId } });
}

describe("ActivityFeedRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("findFeedForUser", () => {
    it("should return items only from followed users", async () => {
      const viewer = await createUser();
      const followed = await createPublicUser();
      const stranger = await createPublicUser();
      const game = await createGame();

      await follow(viewer.id, followed.id);

      await createLibraryItem({ userId: followed.id, gameId: game.id });
      await createLibraryItem({ userId: stranger.id, gameId: game.id });

      const result = await findFeedForUser(viewer.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe(followed.id);
    });

    it("should return empty result when user follows nobody", async () => {
      const viewer = await createUser();
      const publicUser = await createPublicUser();
      const game = await createGame();

      await createLibraryItem({ userId: publicUser.id, gameId: game.id });

      const result = await findFeedForUser(viewer.id);

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it("should exclude items from private followed users", async () => {
      const viewer = await createUser();
      const publicFollowed = await createPublicUser();
      const privateFollowed = await createUser();
      const game = await createGame();

      await follow(viewer.id, publicFollowed.id);
      await follow(viewer.id, privateFollowed.id);

      await createLibraryItem({ userId: publicFollowed.id, gameId: game.id });
      await createLibraryItem({ userId: privateFollowed.id, gameId: game.id });

      const result = await findFeedForUser(viewer.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe(publicFollowed.id);
    });

    it("should include enriched user and game fields on each item", async () => {
      const viewer = await createUser();
      const followed = await createPublicUser({
        name: "Alice",
        username: "alice_test",
      });
      const game = await createGame({ title: "Half-Life 3" });

      await follow(viewer.id, followed.id);
      await createLibraryItem({ userId: followed.id, gameId: game.id });

      const result = await findFeedForUser(viewer.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        userId: followed.id,
        gameId: game.id,
        userName: "Alice",
        userUsername: "alice_test",
        gameTitle: "Half-Life 3",
      });
    });

    it("should order items by activityTimestamp descending", async () => {
      const viewer = await createUser();
      const followed = await createPublicUser();
      const game1 = await createGame();
      const game2 = await createGame();
      const game3 = await createGame();

      await follow(viewer.id, followed.id);

      const now = new Date();
      const oldest = new Date(now.getTime() - 3000);
      const middle = new Date(now.getTime() - 2000);
      const newest = new Date(now.getTime() - 1000);

      await createLibraryItem({
        userId: followed.id,
        gameId: game1.id,
        createdAt: oldest,
      });
      await createLibraryItem({
        userId: followed.id,
        gameId: game2.id,
        createdAt: newest,
      });
      await createLibraryItem({
        userId: followed.id,
        gameId: game3.id,
        createdAt: middle,
      });

      const result = await findFeedForUser(viewer.id);

      expect(result.items).toHaveLength(3);
      const timestamps = result.items.map((i) => i.activityTimestamp.getTime());
      expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
      expect(timestamps[1]).toBeGreaterThanOrEqual(timestamps[2]);
    });

    it("should use statusChangedAt as activityTimestamp when it is later than createdAt", async () => {
      const viewer = await createUser();
      const followed = await createPublicUser();
      const game1 = await createGame();
      const game2 = await createGame();

      await follow(viewer.id, followed.id);

      const baseTime = new Date("2024-01-01T00:00:00Z");
      const laterTime = new Date("2024-06-01T00:00:00Z");

      await createLibraryItem({
        userId: followed.id,
        gameId: game1.id,
        createdAt: baseTime,
      });

      const itemWithStatusChange = await createLibraryItem({
        userId: followed.id,
        gameId: game2.id,
        createdAt: baseTime,
      });
      await testDb!.libraryItem.update({
        where: { id: itemWithStatusChange.id },
        data: { statusChangedAt: laterTime },
      });

      const result = await findFeedForUser(viewer.id);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].gameId).toBe(game2.id);
      expect(result.items[0].activityTimestamp.getTime()).toBe(
        laterTime.getTime()
      );
    });

    describe("cursor pagination", () => {
      it("should return nextCursor when items exceed the limit", async () => {
        const viewer = await createUser();
        const followed = await createPublicUser();

        await follow(viewer.id, followed.id);

        const games = await Promise.all(
          Array.from({ length: 6 }, () => createGame())
        );
        for (const game of games) {
          await createLibraryItem({ userId: followed.id, gameId: game.id });
        }

        const firstPage = await findFeedForUser(viewer.id, undefined, 5);

        expect(firstPage.items).toHaveLength(5);
        expect(firstPage.nextCursor).not.toBeNull();
      });

      it("should return null nextCursor when all items fit within the limit", async () => {
        const viewer = await createUser();
        const followed = await createPublicUser();

        await follow(viewer.id, followed.id);

        const game = await createGame();
        await createLibraryItem({ userId: followed.id, gameId: game.id });

        const result = await findFeedForUser(viewer.id, undefined, 10);

        expect(result.nextCursor).toBeNull();
      });

      it("should fetch second page with no overlap using the cursor", async () => {
        const viewer = await createUser();
        const followed = await createPublicUser();

        await follow(viewer.id, followed.id);

        const games = await Promise.all(
          Array.from({ length: 8 }, () => createGame())
        );
        for (const game of games) {
          await createLibraryItem({ userId: followed.id, gameId: game.id });
        }

        const firstPage = await findFeedForUser(viewer.id, undefined, 5);
        expect(firstPage.nextCursor).not.toBeNull();

        const secondPage = await findFeedForUser(
          viewer.id,
          firstPage.nextCursor!,
          5
        );

        expect(secondPage.items.length).toBeGreaterThan(0);

        const firstPageIds = new Set(firstPage.items.map((i) => i.id));
        for (const item of secondPage.items) {
          expect(firstPageIds.has(item.id)).toBe(false);
        }
      });

      it("should cover all items when paginating through pages sequentially", async () => {
        const viewer = await createUser();
        const followed = await createPublicUser();

        await follow(viewer.id, followed.id);

        const games = await Promise.all(
          Array.from({ length: 7 }, () => createGame())
        );
        for (const game of games) {
          await createLibraryItem({ userId: followed.id, gameId: game.id });
        }

        const allIds: number[] = [];
        let cursor: { timestamp: Date; id: number } | undefined = undefined;

        do {
          const page = await findFeedForUser(viewer.id, cursor, 3);
          allIds.push(...page.items.map((i) => i.id));
          cursor = page.nextCursor ?? undefined;
        } while (cursor !== undefined);

        expect(allIds).toHaveLength(7);
        expect(new Set(allIds).size).toBe(7);
      });
    });
  });

  describe("findPopularFeed", () => {
    it("should return items from all public users regardless of follow status", async () => {
      const viewer = await createUser();
      const publicFollowed = await createPublicUser();
      const publicStranger = await createPublicUser();
      const game = await createGame();

      await follow(viewer.id, publicFollowed.id);

      await createLibraryItem({ userId: publicFollowed.id, gameId: game.id });
      await createLibraryItem({ userId: publicStranger.id, gameId: game.id });

      const result = await findPopularFeed();

      const userIds = result.items.map((i) => i.userId);
      expect(userIds).toContain(publicFollowed.id);
      expect(userIds).toContain(publicStranger.id);
    });

    it("should exclude items from private users", async () => {
      const publicUser = await createPublicUser();
      const privateUser = await createUser();
      const game = await createGame();

      await createLibraryItem({ userId: publicUser.id, gameId: game.id });
      await createLibraryItem({ userId: privateUser.id, gameId: game.id });

      const result = await findPopularFeed();

      const userIds = result.items.map((i) => i.userId);
      expect(userIds).toContain(publicUser.id);
      expect(userIds).not.toContain(privateUser.id);
    });

    it("should return empty result when no public users have library items", async () => {
      await createUser();

      const result = await findPopularFeed();

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });

    it("should order results by activityTimestamp descending", async () => {
      const user1 = await createPublicUser();
      const user2 = await createPublicUser();
      const game1 = await createGame();
      const game2 = await createGame();

      await createLibraryItem({
        userId: user1.id,
        gameId: game1.id,
        createdAt: new Date("2024-01-01T00:00:00Z"),
      });
      await createLibraryItem({
        userId: user2.id,
        gameId: game2.id,
        createdAt: new Date("2024-06-01T00:00:00Z"),
      });

      const result = await findPopularFeed();

      expect(result.items).toHaveLength(2);
      expect(result.items[0].userId).toBe(user2.id);
      expect(result.items[1].userId).toBe(user1.id);
    });

    describe("cursor pagination", () => {
      it("should return nextCursor when items exceed the limit", async () => {
        const publicUser = await createPublicUser();
        const games = await Promise.all(
          Array.from({ length: 6 }, () => createGame())
        );

        for (const game of games) {
          await createLibraryItem({ userId: publicUser.id, gameId: game.id });
        }

        const firstPage = await findPopularFeed(undefined, undefined, 5);

        expect(firstPage.items).toHaveLength(5);
        expect(firstPage.nextCursor).not.toBeNull();
      });

      it("should fetch second page with no overlap using the cursor", async () => {
        const publicUser = await createPublicUser();
        const games = await Promise.all(
          Array.from({ length: 8 }, () => createGame())
        );

        for (const game of games) {
          await createLibraryItem({ userId: publicUser.id, gameId: game.id });
        }

        const firstPage = await findPopularFeed(undefined, undefined, 5);
        expect(firstPage.nextCursor).not.toBeNull();

        const secondPage = await findPopularFeed(
          undefined,
          firstPage.nextCursor!,
          5
        );

        expect(secondPage.items.length).toBeGreaterThan(0);

        const firstPageIds = new Set(firstPage.items.map((i) => i.id));
        for (const item of secondPage.items) {
          expect(firstPageIds.has(item.id)).toBe(false);
        }
      });
    });
  });
});
