import {
  cleanupDatabase,
  getTestDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";
import { LibraryItemStatus } from "@prisma/client";

import { isRepositorySuccess } from "../types";
import {
  findAllLibraryItemsByGameId,
  findMostRecentLibraryItemByGameId,
  getLibraryStatsByUserId,
} from "./library-repository";

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
      const user = await createUser();
      const game1 = await createGame({ title: "Game 1" });
      const game2 = await createGame({ title: "Game 2" });
      const game3 = await createGame({ title: "Game 3" });
      const game4 = await createGame({ title: "Game 4" });
      const game5 = await createGame({ title: "Game 5" });

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

      const result = await getLibraryStatsByUserId(user.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.statusCounts).toEqual({
          CURIOUS_ABOUT: 2,
          CURRENTLY_EXPLORING: 1,
          EXPERIENCED: 1,
          WISHLIST: 1,
        });
      }
    });

    it("should return empty stats for user with no library items", async () => {
      const user = await createUser();

      const result = await getLibraryStatsByUserId(user.id);

      if (!isRepositorySuccess(result)) {
        console.error("Error:", result.error);
      }
      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.statusCounts).toEqual({});
        expect(result.data.recentGames).toEqual([]);
      }
    });

    it("should return last 5 CURRENTLY_EXPLORING games ordered by updatedAt DESC", async () => {
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

      const items = [];
      const prisma = getTestDatabase();
      const baseTime = new Date("2024-01-01T00:00:00.000Z");
      const intervalMs = 1000;
      for (let i = 0; i < games.length; i++) {
        const item = await createLibraryItem({
          userId: user.id,
          gameId: games[i].id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        const deterministicUpdatedAt = new Date(
          baseTime.getTime() + i * intervalMs
        );
        const updatedItem = await prisma.libraryItem.update({
          where: { id: item.id },
          data: { updatedAt: deterministicUpdatedAt },
        });
        items.push(updatedItem);
      }

      const result = await getLibraryStatsByUserId(user.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.recentGames).toHaveLength(5);
        expect(result.data.recentGames[0].title).toBe("Game 7");
        expect(result.data.recentGames[1].title).toBe("Game 6");
        expect(result.data.recentGames[2].title).toBe("Game 5");
        expect(result.data.recentGames[3].title).toBe("Game 4");
        expect(result.data.recentGames[4].title).toBe("Game 3");

        expect(result.data.recentGames[0]).toHaveProperty("gameId");
        expect(result.data.recentGames[0]).toHaveProperty("title");
        expect(result.data.recentGames[0]).toHaveProperty("coverImage");
        expect(result.data.recentGames[0]).toHaveProperty("lastPlayed");
        expect(result.data.recentGames[0].lastPlayed).toBeInstanceOf(Date);
      }
    });

    it("should return only CURRENTLY_EXPLORING games in recentGames", async () => {
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

      const result = await getLibraryStatsByUserId(user.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
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

      const result = await getLibraryStatsByUserId(user.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.recentGames).toHaveLength(1);
        expect(result.data.recentGames[0].coverImage).toBeNull();
      }
    });

    it("should not include other users' library items", async () => {
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

      const result = await getLibraryStatsByUserId(user1.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.statusCounts).toEqual({
          CURRENTLY_EXPLORING: 1,
        });
        expect(result.data.recentGames).toHaveLength(1);
        expect(result.data.recentGames[0].title).toBe("User 1 Game");
      }
    });
  });

  describe("findMostRecentLibraryItemByGameId", () => {
    it("should return the most recently updated library item for a game", async () => {
      const user = await createUser();
      const game = await createGame({ title: "Test Game" });

      // Create multiple library items at different times
      await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      // Simulate time passing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const item2 = await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      // Update item2 to make it the most recent
      await getTestDatabase().libraryItem.update({
        where: { id: item2.id },
        data: { updatedAt: new Date() },
      });

      const result = await findMostRecentLibraryItemByGameId({
        userId: user.id,
        gameId: game.id,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).not.toBeNull();
        expect(result.data?.id).toBe(item2.id);
        expect(result.data?.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
      }
    });

    it("should return null when no library items exist for the game", async () => {
      const user = await createUser();
      const game = await createGame({ title: "Test Game" });

      const result = await findMostRecentLibraryItemByGameId({
        userId: user.id,
        gameId: game.id,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toBeNull();
      }
    });

    it("should only return library items for the specified user", async () => {
      const user1 = await createUser({ email: "user1@test.com" });
      const user2 = await createUser({ email: "user2@test.com" });
      const game = await createGame({ title: "Test Game" });

      await createLibraryItem({
        userId: user2.id,
        gameId: game.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      const result = await findMostRecentLibraryItemByGameId({
        userId: user1.id,
        gameId: game.id,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toBeNull();
      }
    });
  });

  describe("findAllLibraryItemsByGameId", () => {
    it("should return all library items for a game ordered by creation date", async () => {
      const user = await createUser();
      const game = await createGame({ title: "Test Game" });

      const item1 = await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      // Simulate time passing
      await new Promise((resolve) => setTimeout(resolve, 100));

      const item2 = await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      await new Promise((resolve) => setTimeout(resolve, 100));

      const item3 = await createLibraryItem({
        userId: user.id,
        gameId: game.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      const result = await findAllLibraryItemsByGameId({
        userId: user.id,
        gameId: game.id,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toHaveLength(3);
        // Should be ordered by createdAt ascending (oldest first)
        expect(result.data[0].id).toBe(item1.id);
        expect(result.data[1].id).toBe(item2.id);
        expect(result.data[2].id).toBe(item3.id);
      }
    });

    it("should return empty array when no library items exist for the game", async () => {
      const user = await createUser();
      const game = await createGame({ title: "Test Game" });

      const result = await findAllLibraryItemsByGameId({
        userId: user.id,
        gameId: game.id,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toHaveLength(0);
      }
    });

    it("should only return library items for the specified user", async () => {
      const user1 = await createUser({ email: "user1@test.com" });
      const user2 = await createUser({ email: "user2@test.com" });
      const game = await createGame({ title: "Test Game" });

      await createLibraryItem({
        userId: user1.id,
        gameId: game.id,
        status: LibraryItemStatus.WISHLIST,
      });

      await createLibraryItem({
        userId: user2.id,
        gameId: game.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      const result = await findAllLibraryItemsByGameId({
        userId: user1.id,
        gameId: game.id,
      });

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data).toHaveLength(1);
        expect(result.data[0].status).toBe(LibraryItemStatus.WISHLIST);
      }
    });
  });
});
