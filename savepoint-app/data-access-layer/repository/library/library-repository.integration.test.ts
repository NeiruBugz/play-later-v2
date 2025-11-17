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
import { findLibraryItemsWithFilters } from "./library-repository";

vi.mock("@/shared/lib/app/db", async () => {
  const { getTestDatabase } = await import("@/test/setup/database");

  return {
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
    });
  });
});
