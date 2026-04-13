import { resetTestDatabase, setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
  testDb,
} from "@/test/setup/db-factories";
import { type User } from "@prisma/client";

import { findActivityByUserId } from "./activity-feed-repository";

async function createPublicUser(
  options: Parameters<typeof createUser>[0] = {}
): Promise<User> {
  const user = await createUser(options);
  return testDb!.user.update({
    where: { id: user.id },
    data: { isPublicProfile: true },
  });
}

describe("findActivityByUserId - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("ordering", () => {
    it("should return items sorted by activityTimestamp descending then id descending", async () => {
      const user = await createPublicUser();
      const game1 = await createGame();
      const game2 = await createGame();
      const game3 = await createGame();

      const now = new Date();
      const oldest = new Date(now.getTime() - 3000);
      const middle = new Date(now.getTime() - 2000);
      const newest = new Date(now.getTime() - 1000);

      await createLibraryItem({
        userId: user.id,
        gameId: game1.id,
        createdAt: oldest,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game2.id,
        createdAt: newest,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game3.id,
        createdAt: middle,
      });

      const result = await findActivityByUserId(user.id);

      expect(result.items).toHaveLength(3);
      const timestamps = result.items.map((i) => i.activityTimestamp.getTime());
      expect(timestamps[0]).toBeGreaterThanOrEqual(timestamps[1]);
      expect(timestamps[1]).toBeGreaterThanOrEqual(timestamps[2]);
    });

    it("should use statusChangedAt as activityTimestamp when it is later than createdAt", async () => {
      const user = await createPublicUser();
      const game1 = await createGame();
      const game2 = await createGame();

      const baseTime = new Date("2024-01-01T00:00:00Z");
      const laterTime = new Date("2024-06-01T00:00:00Z");

      await createLibraryItem({
        userId: user.id,
        gameId: game1.id,
        createdAt: baseTime,
      });

      const itemWithStatusChange = await createLibraryItem({
        userId: user.id,
        gameId: game2.id,
        createdAt: baseTime,
      });
      await testDb!.libraryItem.update({
        where: { id: itemWithStatusChange.id },
        data: { statusChangedAt: laterTime },
      });

      const result = await findActivityByUserId(user.id);

      expect(result.items).toHaveLength(2);
      expect(result.items[0].gameId).toBe(game2.id);
      expect(result.items[0].activityTimestamp.getTime()).toBe(
        laterTime.getTime()
      );
    });
  });

  describe("cursor pagination", () => {
    it("should return nextCursor when items exceed the limit", async () => {
      const user = await createPublicUser();
      const games = await Promise.all(
        Array.from({ length: 6 }, () => createGame())
      );

      for (const game of games) {
        await createLibraryItem({ userId: user.id, gameId: game.id });
      }

      const firstPage = await findActivityByUserId(user.id, undefined, 5);

      expect(firstPage.items).toHaveLength(5);
      expect(firstPage.nextCursor).not.toBeNull();
    });

    it("should return null nextCursor when all items fit within the limit", async () => {
      const user = await createPublicUser();
      const game = await createGame();
      await createLibraryItem({ userId: user.id, gameId: game.id });

      const result = await findActivityByUserId(user.id, undefined, 10);

      expect(result.nextCursor).toBeNull();
    });

    it("should fetch second page with no overlap using the cursor", async () => {
      const user = await createPublicUser();
      const games = await Promise.all(
        Array.from({ length: 8 }, () => createGame())
      );

      for (const game of games) {
        await createLibraryItem({ userId: user.id, gameId: game.id });
      }

      const firstPage = await findActivityByUserId(user.id, undefined, 5);
      expect(firstPage.nextCursor).not.toBeNull();

      const secondPage = await findActivityByUserId(
        user.id,
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
      const user = await createPublicUser();
      const games = await Promise.all(
        Array.from({ length: 7 }, () => createGame())
      );

      for (const game of games) {
        await createLibraryItem({ userId: user.id, gameId: game.id });
      }

      const allIds: number[] = [];
      let cursor: { timestamp: Date; id: number } | undefined = undefined;

      do {
        const page = await findActivityByUserId(user.id, cursor, 3);
        allIds.push(...page.items.map((i) => i.id));
        cursor = page.nextCursor ?? undefined;
      } while (cursor !== undefined);

      expect(allIds).toHaveLength(7);
      expect(new Set(allIds).size).toBe(7);
    });
  });

  describe("User + Game joins", () => {
    it("should include enriched user and game fields on each item", async () => {
      const user = await createPublicUser({
        name: "Alice",
        username: "alice_activity_test",
      });
      const game = await createGame({ title: "Half-Life 3" });
      await createLibraryItem({ userId: user.id, gameId: game.id });

      const result = await findActivityByUserId(user.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0]).toMatchObject({
        userId: user.id,
        gameId: game.id,
        userName: "Alice",
        userUsername: "alice_activity_test",
        gameTitle: "Half-Life 3",
      });
    });

    it("should expose gameSlug and gameCoverImage on each item", async () => {
      const user = await createPublicUser();
      const game = await createGame({
        slug: "unique-game-slug",
        coverImage: "https://example.com/cover.jpg",
      });
      await createLibraryItem({ userId: user.id, gameId: game.id });

      const result = await findActivityByUserId(user.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].gameSlug).toBe("unique-game-slug");
      expect(result.items[0].gameCoverImage).toBe(
        "https://example.com/cover.jpg"
      );
    });

    it("should expose userImage on each item", async () => {
      const user = await createPublicUser();
      const game = await createGame();
      await createLibraryItem({ userId: user.id, gameId: game.id });

      const result = await findActivityByUserId(user.id);

      expect(result.items).toHaveLength(1);
      expect(Object.keys(result.items[0])).toContain("userImage");
    });
  });

  describe("zero-result case", () => {
    it("should return empty items and null nextCursor when user has no library items", async () => {
      const user = await createPublicUser();

      const result = await findActivityByUserId(user.id);

      expect(result.items).toHaveLength(0);
      expect(result.nextCursor).toBeNull();
    });
  });

  describe("user isolation", () => {
    it("should exclude items from other users", async () => {
      const targetUser = await createPublicUser();
      const otherUser = await createPublicUser();
      const game = await createGame();

      await createLibraryItem({ userId: targetUser.id, gameId: game.id });
      await createLibraryItem({ userId: otherUser.id, gameId: game.id });

      const result = await findActivityByUserId(targetUser.id);

      expect(result.items).toHaveLength(1);
      expect(result.items[0].userId).toBe(targetUser.id);
    });

    it("should return all items for the target user regardless of follow relationships", async () => {
      const targetUser = await createPublicUser();
      const game1 = await createGame();
      const game2 = await createGame();
      const game3 = await createGame();

      await createLibraryItem({ userId: targetUser.id, gameId: game1.id });
      await createLibraryItem({ userId: targetUser.id, gameId: game2.id });
      await createLibraryItem({ userId: targetUser.id, gameId: game3.id });

      const result = await findActivityByUserId(targetUser.id);

      expect(result.items).toHaveLength(3);
      for (const item of result.items) {
        expect(item.userId).toBe(targetUser.id);
      }
    });
  });

  describe("limit", () => {
    it("should cap results at the specified limit", async () => {
      const user = await createPublicUser();
      const games = await Promise.all(
        Array.from({ length: 5 }, () => createGame())
      );

      for (const game of games) {
        await createLibraryItem({ userId: user.id, gameId: game.id });
      }

      const result = await findActivityByUserId(user.id, undefined, 3);

      expect(result.items).toHaveLength(3);
    });
  });
});
