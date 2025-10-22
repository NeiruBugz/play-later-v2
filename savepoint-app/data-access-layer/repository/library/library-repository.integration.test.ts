import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
  testDataBase,
} from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";
import { LibraryItemStatus } from "@prisma/client";
import {
  afterAll,
  beforeAll,
  beforeEach,
  describe,
  expect,
  it,
  vi,
} from "vitest";

import { getLibraryStatsByUserId } from "./library-repository";

// Mock the prisma client to use testDataBase
vi.mock("@/shared/lib", async () => {
  const actual =
    await vi.importActual<typeof import("@/shared/lib")>("@/shared/lib");
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
    ...actual,
    get prisma() {
      return getTestDatabase();
    },
  };
});

describe("LibraryRepository - Integration Tests", () => {
  beforeAll(async () => {
    await setupDatabase();
  });

  afterAll(async () => {
    await cleanupDatabase();
  });

  beforeEach(async () => {
    await resetTestDatabase();
  });

  describe("getLibraryStatsByUserId", () => {
    it("should return correct status counts for games in multiple statuses", async () => {
      // Arrange
      const user = await createUser();
      const game1 = await createGame({ title: "Game 1" });
      const game2 = await createGame({ title: "Game 2" });
      const game3 = await createGame({ title: "Game 3" });
      const game4 = await createGame({ title: "Game 4" });
      const game5 = await createGame({ title: "Game 5" });

      // Create library items with different statuses
      await createLibraryItem({
        userId: user.id,
        gameId: game1.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game2.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game3.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game4.id,
        status: LibraryItemStatus.EXPERIENCED,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game5.id,
        status: LibraryItemStatus.WISHLIST,
      });

      // Act
      const result = await getLibraryStatsByUserId(user.id);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.statusCounts).toEqual({
          CURIOUS_ABOUT: 2,
          CURRENTLY_EXPLORING: 1,
          EXPERIENCED: 1,
          WISHLIST: 1,
        });
      }
    });

    it("should return empty stats for user with no library items", async () => {
      // Arrange
      const user = await createUser();

      // Act
      const result = await getLibraryStatsByUserId(user.id);

      // Assert
      if (!result.ok) {
        console.error("Error:", result.error);
      }
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.statusCounts).toEqual({});
        expect(result.data.recentGames).toEqual([]);
      }
    });

    it("should return last 5 CURRENTLY_EXPLORING games ordered by updatedAt DESC", async () => {
      // Arrange
      const user = await createUser();
      const games = await Promise.all([
        createGame({ title: "Game 1" }),
        createGame({ title: "Game 2" }),
        createGame({ title: "Game 3" }),
        createGame({ title: "Game 4" }),
        createGame({ title: "Game 5" }),
        createGame({ title: "Game 6" }),
        createGame({ title: "Game 7" }),
      ]);

      // Create library items with CURRENTLY_EXPLORING status
      // Add small delays to ensure different updatedAt timestamps
      const items = [];
      for (let i = 0; i < games.length; i++) {
        const item = await createLibraryItem({
          userId: user.id,
          gameId: games[i].id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        items.push(item);
        // Small delay to ensure different timestamps
        await new Promise((resolve) => setTimeout(resolve, 10));
      }

      // Act
      const result = await getLibraryStatsByUserId(user.id);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.recentGames).toHaveLength(5);
        // Should return the last 5 games in reverse order (most recent first)
        expect(result.data.recentGames[0].title).toBe("Game 7");
        expect(result.data.recentGames[1].title).toBe("Game 6");
        expect(result.data.recentGames[2].title).toBe("Game 5");
        expect(result.data.recentGames[3].title).toBe("Game 4");
        expect(result.data.recentGames[4].title).toBe("Game 3");

        // Verify structure of recent games
        expect(result.data.recentGames[0]).toHaveProperty("gameId");
        expect(result.data.recentGames[0]).toHaveProperty("title");
        expect(result.data.recentGames[0]).toHaveProperty("coverImage");
        expect(result.data.recentGames[0]).toHaveProperty("lastPlayed");
        expect(result.data.recentGames[0].lastPlayed).toBeInstanceOf(Date);
      }
    });

    it("should return only CURRENTLY_EXPLORING games in recentGames", async () => {
      // Arrange
      const user = await createUser();
      const game1 = await createGame({ title: "Currently Playing" });
      const game2 = await createGame({ title: "Completed Game" });
      const game3 = await createGame({ title: "Wishlisted Game" });

      await createLibraryItem({
        userId: user.id,
        gameId: game1.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game2.id,
        status: LibraryItemStatus.EXPERIENCED,
      });
      await createLibraryItem({
        userId: user.id,
        gameId: game3.id,
        status: LibraryItemStatus.WISHLIST,
      });

      // Act
      const result = await getLibraryStatsByUserId(user.id);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.recentGames).toHaveLength(1);
        expect(result.data.recentGames[0].title).toBe("Currently Playing");
        expect(result.data.statusCounts).toEqual({
          CURRENTLY_EXPLORING: 1,
          EXPERIENCED: 1,
          WISHLIST: 1,
        });
      }
    });

    it("should handle games with null coverImage", async () => {
      // Arrange
      const user = await createUser();
      const game = await createGame({
        title: "Game Without Cover",
        coverImage: undefined,
      });

      await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      // Act
      const result = await getLibraryStatsByUserId(user.id);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.recentGames).toHaveLength(1);
        expect(result.data.recentGames[0].coverImage).toBeNull();
      }
    });

    it("should not include other users' library items", async () => {
      // Arrange
      const user1 = await createUser({ username: "user1" });
      const user2 = await createUser({ username: "user2" });
      const game1 = await createGame({ title: "User 1 Game" });
      const game2 = await createGame({ title: "User 2 Game" });

      await createLibraryItem({
        userId: user1.id,
        gameId: game1.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });
      await createLibraryItem({
        userId: user2.id,
        gameId: game2.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      // Act
      const result = await getLibraryStatsByUserId(user1.id);

      // Assert
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.data.statusCounts).toEqual({
          CURRENTLY_EXPLORING: 1,
        });
        expect(result.data.recentGames).toHaveLength(1);
        expect(result.data.recentGames[0].title).toBe("User 1 Game");
      }
    });
  });
});
