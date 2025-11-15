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

import { findPlatformsForGame } from "../platform/platform-repository";
import { isRepositorySuccess } from "../types";
import {
  findAllLibraryItemsByGameId,
  findLibraryItemsWithFilters,
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

  describe("findLibraryItemsWithFilters", () => {
    describe("basic filtering", () => {
      it("should return all library items for user with no filters", async () => {
        const user = await createUser();
        const game1 = await createGame({ title: "Dark Souls" });
        const game2 = await createGame({ title: "Bloodborne" });
        const game3 = await createGame({ title: "Elden Ring" });

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

        const result = await findLibraryItemsWithFilters({ userId: user.id });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data.every((item) => item.userId === user.id)).toBe(
            true
          );
        }
      });

      it("should filter by status correctly", async () => {
        const user = await createUser();
        const game1 = await createGame({ title: "Game 1" });
        const game2 = await createGame({ title: "Game 2" });
        const game3 = await createGame({ title: "Game 3" });

        await createLibraryItem({
          userId: user.id,
          gameId: game1.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game2.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game3.id,
          status: LibraryItemStatus.WISHLIST,
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(2);
          expect(
            result.data.every(
              (item) => item.status === LibraryItemStatus.CURRENTLY_EXPLORING
            )
          ).toBe(true);
        }
      });

      it("should filter by platform correctly", async () => {
        const user = await createUser();
        const game1 = await createGame({ title: "PC Game" });
        const game2 = await createGame({ title: "PS5 Game" });
        const game3 = await createGame({ title: "Another PC Game" });

        await createLibraryItem({
          userId: user.id,
          gameId: game1.id,
          platform: "PC",
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game2.id,
          platform: "PlayStation 5",
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game3.id,
          platform: "PC",
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          platform: "PC",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(2);
          expect(result.data.every((item) => item.platform === "PC")).toBe(
            true
          );
        }
      });

      it("should filter by game title search (case-insensitive)", async () => {
        const user = await createUser();
        const game1 = await createGame({
          title: "The Legend of Zelda: Breath of the Wild",
        });
        const game2 = await createGame({
          title: "The Legend of Zelda: Tears of the Kingdom",
        });
        const game3 = await createGame({ title: "Dark Souls III" });

        await createLibraryItem({ userId: user.id, gameId: game1.id });
        await createLibraryItem({ userId: user.id, gameId: game2.id });
        await createLibraryItem({ userId: user.id, gameId: game3.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          search: "zelda",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(2);
          expect(
            result.data.every((item) =>
              item.game.title.toLowerCase().includes("zelda")
            )
          ).toBe(true);
        }
      });

      it("should apply multiple filters simultaneously", async () => {
        const user = await createUser();
        const game1 = await createGame({ title: "Dark Souls" });
        const game2 = await createGame({ title: "Dark Souls III" });
        const game3 = await createGame({ title: "Bloodborne" });

        await createLibraryItem({
          userId: user.id,
          gameId: game1.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game2.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game3.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PlayStation 5",
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
          platform: "PC",
          search: "dark souls",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(2);
          expect(result.data.every((item) => item.platform === "PC")).toBe(
            true
          );
          expect(
            result.data.every(
              (item) => item.status === LibraryItemStatus.CURRENTLY_EXPLORING
            )
          ).toBe(true);
          expect(
            result.data.every((item) =>
              item.game.title.toLowerCase().includes("dark souls")
            )
          ).toBe(true);
        }
      });
    });

    describe("sorting", () => {
      it("should sort by createdAt ascending", async () => {
        const user = await createUser();
        const games = await Promise.all([
          createGame({ title: "Game 1" }),
          createGame({ title: "Game 2" }),
          createGame({ title: "Game 3" }),
        ]);

        const prisma = getTestDatabase();
        const baseTime = new Date("2024-01-01T00:00:00.000Z");

        for (let i = 0; i < games.length; i++) {
          const item = await createLibraryItem({
            userId: user.id,
            gameId: games[i].id,
          });
          await prisma.libraryItem.update({
            where: { id: item.id },
            data: { createdAt: new Date(baseTime.getTime() + i * 86400000) },
          });
        }

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "createdAt",
          sortOrder: "asc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Game 1");
          expect(result.data[1].game.title).toBe("Game 2");
          expect(result.data[2].game.title).toBe("Game 3");
        }
      });

      it("should sort by createdAt descending", async () => {
        const user = await createUser();
        const games = await Promise.all([
          createGame({ title: "Game 1" }),
          createGame({ title: "Game 2" }),
          createGame({ title: "Game 3" }),
        ]);

        const prisma = getTestDatabase();
        const baseTime = new Date("2024-01-01T00:00:00.000Z");

        for (let i = 0; i < games.length; i++) {
          const item = await createLibraryItem({
            userId: user.id,
            gameId: games[i].id,
          });
          await prisma.libraryItem.update({
            where: { id: item.id },
            data: { createdAt: new Date(baseTime.getTime() + i * 86400000) },
          });
        }

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "createdAt",
          sortOrder: "desc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Game 3");
          expect(result.data[1].game.title).toBe("Game 2");
          expect(result.data[2].game.title).toBe("Game 1");
        }
      });

      it("should sort by releaseDate ascending", async () => {
        const user = await createUser();
        const game1 = await createGame({
          title: "Oldest Game",
          releaseDate: new Date("2020-01-01"),
        });
        const game2 = await createGame({
          title: "Middle Game",
          releaseDate: new Date("2022-01-01"),
        });
        const game3 = await createGame({
          title: "Newest Game",
          releaseDate: new Date("2024-01-01"),
        });

        await createLibraryItem({ userId: user.id, gameId: game3.id });
        await createLibraryItem({ userId: user.id, gameId: game1.id });
        await createLibraryItem({ userId: user.id, gameId: game2.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "releaseDate",
          sortOrder: "asc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Oldest Game");
          expect(result.data[1].game.title).toBe("Middle Game");
          expect(result.data[2].game.title).toBe("Newest Game");
        }
      });

      it("should sort by releaseDate descending", async () => {
        const user = await createUser();
        const game1 = await createGame({
          title: "Oldest Game",
          releaseDate: new Date("2020-01-01"),
        });
        const game2 = await createGame({
          title: "Middle Game",
          releaseDate: new Date("2022-01-01"),
        });
        const game3 = await createGame({
          title: "Newest Game",
          releaseDate: new Date("2024-01-01"),
        });

        await createLibraryItem({ userId: user.id, gameId: game1.id });
        await createLibraryItem({ userId: user.id, gameId: game2.id });
        await createLibraryItem({ userId: user.id, gameId: game3.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "releaseDate",
          sortOrder: "desc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Newest Game");
          expect(result.data[1].game.title).toBe("Middle Game");
          expect(result.data[2].game.title).toBe("Oldest Game");
        }
      });

      it("should sort by startedAt ascending with null handling", async () => {
        const user = await createUser();
        const games = await Promise.all([
          createGame({ title: "Not Started" }),
          createGame({ title: "Started First" }),
          createGame({ title: "Started Second" }),
        ]);

        const prisma = getTestDatabase();

        await createLibraryItem({
          userId: user.id,
          gameId: games[0].id,
        });
        const item2 = await createLibraryItem({
          userId: user.id,
          gameId: games[1].id,
        });
        await prisma.libraryItem.update({
          where: { id: item2.id },
          data: {
            createdAt: new Date("2023-12-01"),
            startedAt: new Date("2024-01-01"),
          },
        });
        const item3 = await createLibraryItem({
          userId: user.id,
          gameId: games[2].id,
        });
        await prisma.libraryItem.update({
          where: { id: item3.id },
          data: {
            createdAt: new Date("2023-12-01"),
            startedAt: new Date("2024-02-01"),
          },
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "startedAt",
          sortOrder: "asc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Started First");
          expect(result.data[1].game.title).toBe("Started Second");
          expect(result.data[2].game.title).toBe("Not Started");
          expect(result.data[2].startedAt).toBeNull();
        }
      });

      it("should sort by startedAt descending with null handling", async () => {
        const user = await createUser();
        const games = await Promise.all([
          createGame({ title: "Not Started" }),
          createGame({ title: "Started First" }),
          createGame({ title: "Started Second" }),
        ]);

        const prisma = getTestDatabase();

        await createLibraryItem({
          userId: user.id,
          gameId: games[0].id,
        });
        const item2 = await createLibraryItem({
          userId: user.id,
          gameId: games[1].id,
        });
        await prisma.libraryItem.update({
          where: { id: item2.id },
          data: {
            createdAt: new Date("2023-12-01"),
            startedAt: new Date("2024-01-01"),
          },
        });
        const item3 = await createLibraryItem({
          userId: user.id,
          gameId: games[2].id,
        });
        await prisma.libraryItem.update({
          where: { id: item3.id },
          data: {
            createdAt: new Date("2023-12-01"),
            startedAt: new Date("2024-02-01"),
          },
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "startedAt",
          sortOrder: "desc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Not Started");
          expect(result.data[0].startedAt).toBeNull();
          expect(result.data[1].game.title).toBe("Started Second");
          expect(result.data[2].game.title).toBe("Started First");
        }
      });

      it("should sort by completedAt ascending with null handling", async () => {
        const user = await createUser();
        const games = await Promise.all([
          createGame({ title: "Not Completed" }),
          createGame({ title: "Completed First" }),
          createGame({ title: "Completed Second" }),
        ]);

        const prisma = getTestDatabase();

        await createLibraryItem({
          userId: user.id,
          gameId: games[0].id,
        });
        const item2 = await createLibraryItem({
          userId: user.id,
          gameId: games[1].id,
        });
        await prisma.libraryItem.update({
          where: { id: item2.id },
          data: {
            createdAt: new Date("2023-12-01"),
            completedAt: new Date("2024-01-01"),
          },
        });
        const item3 = await createLibraryItem({
          userId: user.id,
          gameId: games[2].id,
        });
        await prisma.libraryItem.update({
          where: { id: item3.id },
          data: {
            createdAt: new Date("2023-12-01"),
            completedAt: new Date("2024-02-01"),
          },
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "completedAt",
          sortOrder: "asc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Completed First");
          expect(result.data[1].game.title).toBe("Completed Second");
          expect(result.data[2].game.title).toBe("Not Completed");
          expect(result.data[2].completedAt).toBeNull();
        }
      });

      it("should sort by completedAt descending with null handling", async () => {
        const user = await createUser();
        const games = await Promise.all([
          createGame({ title: "Not Completed" }),
          createGame({ title: "Completed First" }),
          createGame({ title: "Completed Second" }),
        ]);

        const prisma = getTestDatabase();

        await createLibraryItem({
          userId: user.id,
          gameId: games[0].id,
        });
        const item2 = await createLibraryItem({
          userId: user.id,
          gameId: games[1].id,
        });
        await prisma.libraryItem.update({
          where: { id: item2.id },
          data: {
            createdAt: new Date("2023-12-01"),
            completedAt: new Date("2024-01-01"),
          },
        });
        const item3 = await createLibraryItem({
          userId: user.id,
          gameId: games[2].id,
        });
        await prisma.libraryItem.update({
          where: { id: item3.id },
          data: {
            createdAt: new Date("2023-12-01"),
            completedAt: new Date("2024-02-01"),
          },
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "completedAt",
          sortOrder: "desc",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
          expect(result.data[0].game.title).toBe("Not Completed");
          expect(result.data[0].completedAt).toBeNull();
          expect(result.data[1].game.title).toBe("Completed Second");
          expect(result.data[2].game.title).toBe("Completed First");
        }
      });
    });

    describe("deduplication", () => {
      it("should return only most recent item per game when distinctByGame is true", async () => {
        const user = await createUser();
        const game = await createGame({ title: "Dark Souls" });

        const prisma = getTestDatabase();

        const item1 = await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURIOUS_ABOUT,
        });
        await prisma.libraryItem.update({
          where: { id: item1.id },
          data: { updatedAt: new Date("2024-01-01") },
        });

        const item2 = await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        await prisma.libraryItem.update({
          where: { id: item2.id },
          data: { updatedAt: new Date("2024-02-01") },
        });

        const item3 = await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.EXPERIENCED,
        });
        await prisma.libraryItem.update({
          where: { id: item3.id },
          data: { updatedAt: new Date("2024-03-01") },
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          distinctByGame: true,
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].id).toBe(item3.id);
          expect(result.data[0].status).toBe(LibraryItemStatus.EXPERIENCED);
        }
      });

      it("should return all items when distinctByGame is false", async () => {
        const user = await createUser();
        const game = await createGame({ title: "Dark Souls" });

        await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURIOUS_ABOUT,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          status: LibraryItemStatus.EXPERIENCED,
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          distinctByGame: false,
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(3);
        }
      });

      it("should deduplicate multiple games correctly", async () => {
        const user = await createUser();
        const game1 = await createGame({ title: "Game 1" });
        const game2 = await createGame({ title: "Game 2" });

        const prisma = getTestDatabase();

        const item1 = await createLibraryItem({
          userId: user.id,
          gameId: game1.id,
        });
        await prisma.libraryItem.update({
          where: { id: item1.id },
          data: { updatedAt: new Date("2024-01-01") },
        });

        const item2 = await createLibraryItem({
          userId: user.id,
          gameId: game1.id,
        });
        await prisma.libraryItem.update({
          where: { id: item2.id },
          data: { updatedAt: new Date("2024-02-01") },
        });

        const item3 = await createLibraryItem({
          userId: user.id,
          gameId: game2.id,
        });
        await prisma.libraryItem.update({
          where: { id: item3.id },
          data: { updatedAt: new Date("2024-01-15") },
        });

        const item4 = await createLibraryItem({
          userId: user.id,
          gameId: game2.id,
        });
        await prisma.libraryItem.update({
          where: { id: item4.id },
          data: { updatedAt: new Date("2024-02-15") },
        });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          distinctByGame: true,
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(2);
          const gameIds = result.data.map((item) => item.gameId).sort();
          expect(gameIds).toEqual([game1.id, game2.id].sort());
          expect(result.data.find((item) => item.gameId === game1.id)?.id).toBe(
            item2.id
          );
          expect(result.data.find((item) => item.gameId === game2.id)?.id).toBe(
            item4.id
          );
        }
      });
    });

    describe("library item count", () => {
      it("should include library item count per game for the user", async () => {
        const user = await createUser();
        const game = await createGame({ title: "Dark Souls" });

        await createLibraryItem({ userId: user.id, gameId: game.id });
        await createLibraryItem({ userId: user.id, gameId: game.id });
        await createLibraryItem({ userId: user.id, gameId: game.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          distinctByGame: true,
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].game._count.libraryItems).toBe(3);
        }
      });

      it("should count only the user's library items per game", async () => {
        const user1 = await createUser({ email: "user1@test.com" });
        const user2 = await createUser({ email: "user2@test.com" });
        const game = await createGame({ title: "Popular Game" });

        await createLibraryItem({ userId: user1.id, gameId: game.id });
        await createLibraryItem({ userId: user1.id, gameId: game.id });
        await createLibraryItem({ userId: user2.id, gameId: game.id });
        await createLibraryItem({ userId: user2.id, gameId: game.id });
        await createLibraryItem({ userId: user2.id, gameId: game.id });

        const result = await findLibraryItemsWithFilters({
          userId: user1.id,
          distinctByGame: true,
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].game._count.libraryItems).toBe(2);
        }
      });
    });

    describe("edge cases", () => {
      it("should handle empty result set", async () => {
        const user = await createUser();

        const result = await findLibraryItemsWithFilters({ userId: user.id });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(0);
        }
      });

      it("should enforce row-level security (user can only see their own items)", async () => {
        const user1 = await createUser({ email: "user1@test.com" });
        const user2 = await createUser({ email: "user2@test.com" });
        const game1 = await createGame({ title: "User 1 Game" });
        const game2 = await createGame({ title: "User 2 Game" });

        await createLibraryItem({ userId: user1.id, gameId: game1.id });
        await createLibraryItem({ userId: user2.id, gameId: game2.id });

        const result1 = await findLibraryItemsWithFilters({ userId: user1.id });
        const result2 = await findLibraryItemsWithFilters({ userId: user2.id });

        expect(isRepositorySuccess(result1)).toBe(true);
        expect(isRepositorySuccess(result2)).toBe(true);
        if (isRepositorySuccess(result1) && isRepositorySuccess(result2)) {
          expect(result1.data).toHaveLength(1);
          expect(result2.data).toHaveLength(1);
          expect(result1.data[0].game.title).toBe("User 1 Game");
          expect(result2.data[0].game.title).toBe("User 2 Game");
        }
      });

      it("should handle special characters in search", async () => {
        const user = await createUser();
        const game1 = await createGame({
          title: "The Legend of Zelda: Breath of the Wild",
        });
        const game2 = await createGame({ title: "Dark Souls III" });

        await createLibraryItem({ userId: user.id, gameId: game1.id });
        await createLibraryItem({ userId: user.id, gameId: game2.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          search: "zelda: breath",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(1);
          expect(result.data[0].game.title).toBe(
            "The Legend of Zelda: Breath of the Wild"
          );
        }
      });

      it("should handle empty string in search", async () => {
        const user = await createUser();
        const game = await createGame({ title: "Test Game" });

        await createLibraryItem({ userId: user.id, gameId: game.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          search: "",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(1);
        }
      });

      it("should return empty array when search matches no games", async () => {
        const user = await createUser();
        const game = await createGame({ title: "Dark Souls" });

        await createLibraryItem({ userId: user.id, gameId: game.id });

        const result = await findLibraryItemsWithFilters({
          userId: user.id,
          search: "nonexistent game title",
        });

        expect(isRepositorySuccess(result)).toBe(true);
        if (isRepositorySuccess(result)) {
          expect(result.data).toHaveLength(0);
        }
      });

      it("should handle apostrophes and quotes in search", async () => {
        const user = await createUser();
        const game1 = await createGame({ title: "The Witcher 3: Wild Hunt" });
        const game2 = await createGame({
          title: "Baldur's Gate 3",
        });
        const game3 = await createGame({
          title: 'Dragon Age: "The Veilguard"',
        });

        await createLibraryItem({ userId: user.id, gameId: game1.id });
        await createLibraryItem({ userId: user.id, gameId: game2.id });
        await createLibraryItem({ userId: user.id, gameId: game3.id });

        const resultApostrophe = await findLibraryItemsWithFilters({
          userId: user.id,
          search: "baldur's",
        });

        expect(isRepositorySuccess(resultApostrophe)).toBe(true);
        if (isRepositorySuccess(resultApostrophe)) {
          expect(resultApostrophe.data).toHaveLength(1);
          expect(resultApostrophe.data[0].game.title).toBe("Baldur's Gate 3");
        }

        const resultQuotes = await findLibraryItemsWithFilters({
          userId: user.id,
          search: "veilguard",
        });

        expect(isRepositorySuccess(resultQuotes)).toBe(true);
        if (isRepositorySuccess(resultQuotes)) {
          expect(resultQuotes.data).toHaveLength(1);
          expect(resultQuotes.data[0].game.title).toBe(
            'Dragon Age: "The Veilguard"'
          );
        }
      });

      it("should handle games with null release date in sorting", async () => {
        const user = await createUser();
        const game1 = await createGame({
          title: "Game With Release Date",
          releaseDate: new Date("2024-01-01"),
        });
        const game2 = await createGame({
          title: "Game Without Release Date",
          releaseDate: undefined,
        });
        const game3 = await createGame({
          title: "Another Game With Release Date",
          releaseDate: new Date("2023-01-01"),
        });

        await createLibraryItem({ userId: user.id, gameId: game1.id });
        await createLibraryItem({ userId: user.id, gameId: game2.id });
        await createLibraryItem({ userId: user.id, gameId: game3.id });

        const resultAsc = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "releaseDate",
          sortOrder: "asc",
        });

        expect(isRepositorySuccess(resultAsc)).toBe(true);
        if (isRepositorySuccess(resultAsc)) {
          expect(resultAsc.data).toHaveLength(3);
          expect(resultAsc.data[0].game.title).toBe(
            "Another Game With Release Date"
          );
          expect(resultAsc.data[1].game.title).toBe("Game With Release Date");
          expect(resultAsc.data[2].game.title).toBe(
            "Game Without Release Date"
          );
          expect(resultAsc.data[2].game.releaseDate).toBeNull();
        }

        const resultDesc = await findLibraryItemsWithFilters({
          userId: user.id,
          sortBy: "releaseDate",
          sortOrder: "desc",
        });

        expect(isRepositorySuccess(resultDesc)).toBe(true);
        if (isRepositorySuccess(resultDesc)) {
          expect(resultDesc.data).toHaveLength(3);
          expect(resultDesc.data[0].game.title).toBe(
            "Game Without Release Date"
          );
          expect(resultDesc.data[0].game.releaseDate).toBeNull();
          expect(resultDesc.data[1].game.title).toBe("Game With Release Date");
          expect(resultDesc.data[2].game.title).toBe(
            "Another Game With Release Date"
          );
        }
      });

      it("should handle multiple library items for the same game on different platforms", async () => {
        const user = await createUser();
        const game = await createGame({ title: "Multi-Platform Game" });

        await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          platform: "PC",
          status: LibraryItemStatus.CURRENTLY_EXPLORING,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          platform: "PlayStation 5",
          status: LibraryItemStatus.EXPERIENCED,
        });
        await createLibraryItem({
          userId: user.id,
          gameId: game.id,
          platform: "Xbox Series X|S",
          status: LibraryItemStatus.CURIOUS_ABOUT,
        });

        const resultAllPlatforms = await findLibraryItemsWithFilters({
          userId: user.id,
          distinctByGame: false,
        });

        expect(isRepositorySuccess(resultAllPlatforms)).toBe(true);
        if (isRepositorySuccess(resultAllPlatforms)) {
          expect(resultAllPlatforms.data).toHaveLength(3);
          expect(
            resultAllPlatforms.data.every((item) => item.gameId === game.id)
          ).toBe(true);
        }

        const resultPCOnly = await findLibraryItemsWithFilters({
          userId: user.id,
          platform: "PC",
          distinctByGame: false,
        });

        expect(isRepositorySuccess(resultPCOnly)).toBe(true);
        if (isRepositorySuccess(resultPCOnly)) {
          expect(resultPCOnly.data).toHaveLength(1);
          expect(resultPCOnly.data[0].platform).toBe("PC");
          expect(resultPCOnly.data[0].status).toBe(
            LibraryItemStatus.CURRENTLY_EXPLORING
          );
        }

        const resultDistinct = await findLibraryItemsWithFilters({
          userId: user.id,
          distinctByGame: true,
        });

        expect(isRepositorySuccess(resultDistinct)).toBe(true);
        if (isRepositorySuccess(resultDistinct)) {
          expect(resultDistinct.data).toHaveLength(1);
          expect(resultDistinct.data[0].gameId).toBe(game.id);
        }
      });
    });
  });

  describe("findPlatformsForGame", () => {
    it("should return supported platforms for game", async () => {
      const prisma = getTestDatabase();
      const game = await createGame({ title: "Multi-Platform Game" });

      const platform1 = await prisma.platform.create({
        data: {
          igdbId: 48,
          name: "PlayStation 5",
          slug: "ps5",
          abbreviation: "PS5",
        },
      });

      const platform2 = await prisma.platform.create({
        data: {
          igdbId: 169,
          name: "Xbox Series X|S",
          slug: "xsx",
          abbreviation: "XSX",
        },
      });

      await prisma.platform.create({
        data: {
          igdbId: 6,
          name: "PC (Microsoft Windows)",
          slug: "win",
          abbreviation: "PC",
        },
      });

      await prisma.gamePlatform.createMany({
        data: [
          { gameId: game.id, platformId: platform1.id },
          { gameId: game.id, platformId: platform2.id },
        ],
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(2);
        expect(result.data.otherPlatforms).toHaveLength(1);

        const supportedNames = result.data.supportedPlatforms
          .map((p) => p.name)
          .sort();
        expect(supportedNames).toEqual(["PlayStation 5", "Xbox Series X|S"]);

        expect(result.data.otherPlatforms[0].name).toBe(
          "PC (Microsoft Windows)"
        );
      }
    });

    it("should return other platforms not supported by game", async () => {
      const prisma = getTestDatabase();
      const game = await createGame({ title: "Exclusive Game" });

      const platform1 = await prisma.platform.create({
        data: {
          igdbId: 48,
          name: "PlayStation 5",
          slug: "ps5",
          abbreviation: "PS5",
        },
      });

      await prisma.platform.create({
        data: {
          igdbId: 169,
          name: "Xbox Series X|S",
          slug: "xsx",
          abbreviation: "XSX",
        },
      });

      await prisma.gamePlatform.create({
        data: { gameId: game.id, platformId: platform1.id },
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(1);
        expect(result.data.supportedPlatforms[0].name).toBe("PlayStation 5");
        expect(result.data.otherPlatforms).toHaveLength(1);
        expect(result.data.otherPlatforms[0].name).toBe("Xbox Series X|S");
      }
    });

    it("should handle game with no platforms", async () => {
      const prisma = getTestDatabase();
      const game = await createGame({ title: "Game Without Platforms" });

      await prisma.platform.createMany({
        data: [
          {
            igdbId: 48,
            name: "PlayStation 5",
            slug: "ps5",
            abbreviation: "PS5",
          },
          {
            igdbId: 169,
            name: "Xbox Series X|S",
            slug: "xsx",
            abbreviation: "XSX",
          },
        ],
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(0);
        expect(result.data.otherPlatforms.length).toBeGreaterThan(0);
      }
    });

    it("should handle game with all platforms supported", async () => {
      const prisma = getTestDatabase();
      const game = await createGame({ title: "Universal Game" });

      const platform1 = await prisma.platform.create({
        data: {
          igdbId: 48,
          name: "PlayStation 5",
          slug: "ps5",
          abbreviation: "PS5",
        },
      });

      const platform2 = await prisma.platform.create({
        data: {
          igdbId: 169,
          name: "Xbox Series X|S",
          slug: "xsx",
          abbreviation: "XSX",
        },
      });

      await prisma.gamePlatform.createMany({
        data: [
          { gameId: game.id, platformId: platform1.id },
          { gameId: game.id, platformId: platform2.id },
        ],
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(2);
        expect(result.data.otherPlatforms).toHaveLength(0);
      }
    });

    it("should sort platforms alphabetically by name", async () => {
      const prisma = getTestDatabase();
      const game = await createGame({ title: "Multi-Platform Game" });

      const platformC = await prisma.platform.create({
        data: {
          igdbId: 1,
          name: "Charlie",
          slug: "charlie",
          abbreviation: "C",
        },
      });

      const platformA = await prisma.platform.create({
        data: { igdbId: 2, name: "Alpha", slug: "alpha", abbreviation: "A" },
      });

      await prisma.platform.create({
        data: { igdbId: 3, name: "Beta", slug: "beta", abbreviation: "B" },
      });

      await prisma.gamePlatform.createMany({
        data: [
          { gameId: game.id, platformId: platformC.id },
          { gameId: game.id, platformId: platformA.id },
        ],
      });

      const result = await findPlatformsForGame(game.id);

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms.map((p) => p.name)).toEqual([
          "Alpha",
          "Charlie",
        ]);
        expect(result.data.otherPlatforms.map((p) => p.name)).toEqual(["Beta"]);
      }
    });

    it("should return empty arrays for non-existent game", async () => {
      const prisma = getTestDatabase();

      await prisma.platform.create({
        data: {
          igdbId: 48,
          name: "PlayStation 5",
          slug: "ps5",
          abbreviation: "PS5",
        },
      });

      const result = await findPlatformsForGame("non-existent-game-id");

      expect(isRepositorySuccess(result)).toBe(true);
      if (isRepositorySuccess(result)) {
        expect(result.data.supportedPlatforms).toHaveLength(0);
        expect(result.data.otherPlatforms.length).toBeGreaterThan(0);
      }
    });
  });
});
