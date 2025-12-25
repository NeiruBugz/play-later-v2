import { getServerUserId } from "@/auth";
import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import {
  cleanupDatabase,
  resetTestDatabase,
  setupDatabase,
} from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

import { prisma } from "@/shared/lib/app/db";

import { addToLibraryAction } from "./add-to-library-action";
import { updateLibraryEntryAction } from "./update-library-entry-action";
import { updateLibraryStatusAction } from "./update-library-status-action";

const { mockGetGameDetails, MockIgdbService, mockPopulateGameInDatabase } =
  vi.hoisted(() => {
    const mockFn = vi.fn();
    const mockPopulate = vi.fn();

    return {
      mockGetGameDetails: mockFn,
      MockIgdbService: class {
        async getGameDetails(...args: unknown[]) {
          return mockFn(...args);
        }
      },
      mockPopulateGameInDatabase: mockPopulate,
    };
  });

vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: MockIgdbService,
}));

vi.mock("@/data-access-layer/services/game-detail/game-detail-service", () => ({
  populateGameInDatabase: mockPopulateGameInDatabase,
}));

beforeAll(async () => {
  await setupDatabase();
});

afterAll(async () => {
  await cleanupDatabase();
});

describe("addToLibraryAction - Integration Tests", () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testGame: Awaited<ReturnType<typeof createGame>>;

  beforeEach(async () => {
    await resetTestDatabase();
    vi.clearAllMocks();

    mockGetGameDetails.mockResolvedValue({
      success: true,
      data: {
        game: {
          id: 999,
          name: "Test Game",
          slug: "test-game",
          summary: "A test game",
          cover: { image_id: "test123" },
          first_release_date: 1609459200,
          genres: [{ id: 1, name: "Action", slug: "action" }],
          platforms: [{ id: 1, name: "PC", slug: "pc", abbreviation: "PC" }],
        },
      },
    });

    mockPopulateGameInDatabase.mockImplementation(async (game) => {
      await prisma.game.create({
        data: {
          title: game.name,
          igdbId: game.id,
          slug: game.slug,
          description: game.summary,
          coverImage: game.cover?.image_id
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
            : null,
          releaseDate: game.first_release_date
            ? new Date(game.first_release_date * 1000)
            : null,
        },
      });
    });

    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  describe("Adding new game to library", () => {
    it("should add game to library when game exists in database", async () => {
      const result = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.gameId).toBe(testGame.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);

      const libraryItem = await prisma.libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
      expect(libraryItem?.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
    });

    it("should add game with platform information", async () => {
      const result = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WISHLIST,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.platform).toBe("PlayStation 5");
    });

    it("should handle all journey statuses", async () => {
      const statuses = [
        LibraryItemStatus.CURIOUS_ABOUT,
        LibraryItemStatus.CURRENTLY_EXPLORING,
        LibraryItemStatus.TOOK_A_BREAK,
        LibraryItemStatus.EXPERIENCED,
        LibraryItemStatus.WISHLIST,
        LibraryItemStatus.REVISITING,
      ];

      for (const status of statuses) {
        const user = await createUser({
          email: `user-${status}@example.com`,
          username: `user-${status}`,
        });

        const { getServerUserId } = await import("@/auth");
        vi.mocked(getServerUserId).mockResolvedValue(user.id);

        const result = await addToLibraryAction({
          igdbId: testGame.igdbId,
          status,
          platform: "PC",
        });

        expect(result.success).toBe(true);
        if (!result.success) continue;
        expect(result.data.status).toBe(status);
      }
    });
  });

  describe("Error handling", () => {
    it("should return error when user is not authenticated", async () => {
      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const result = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should allow adding the same game multiple times (current data model supports multiple entries)", async () => {
      const firstResult = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      expect(firstResult.success).toBe(true);
      if (!firstResult.success) return;

      const secondResult = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WISHLIST,
        platform: "PlayStation 5",
      });

      expect(secondResult.success).toBe(true);
      if (!secondResult.success) return;

      expect(firstResult.data.id).not.toBe(secondResult.data.id);
      expect(firstResult.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
      expect(secondResult.data.status).toBe(LibraryItemStatus.WISHLIST);
    });

    it("should return error for invalid input", async () => {
      const result = await addToLibraryAction({
        igdbId: -1,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });
  });

  describe("Fetching game from IGDB when not in database", () => {
    it("should fetch and populate game from IGDB when not in database", async () => {
      const newIgdbId = 999;

      const result = await addToLibraryAction({
        igdbId: newIgdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);

      const game = await prisma.game.findUnique({
        where: { igdbId: newIgdbId },
      });
      expect(game).toBeTruthy();
    });
  });
});

describe("updateLibraryStatusAction - Integration Tests", () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testGame: Awaited<ReturnType<typeof createGame>>;

  beforeEach(async () => {
    await resetTestDatabase();
    mockGetGameDetails.mockResolvedValue({
      success: true,
      data: {
        game: {
          id: 999,
          name: "Test Game",
          slug: "test-game",
          summary: "A test game",
          cover: { image_id: "test123" },
          first_release_date: 1609459200,
          genres: [{ id: 1, name: "Action", slug: "action" }],
          platforms: [{ id: 1, name: "PC", slug: "pc", abbreviation: "PC" }],
        },
      },
    });

    mockPopulateGameInDatabase.mockImplementation(async (game) => {
      await prisma.game.create({
        data: {
          title: game.name,
          igdbId: game.id,
          slug: game.slug,
          description: game.summary,
          coverImage: game.cover?.image_id
            ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg`
            : null,
          releaseDate: game.first_release_date
            ? new Date(game.first_release_date * 1000)
            : null,
        },
      });
    });

    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  describe("Updating existing library item status", () => {
    it("should update existing library item's status", async () => {
      const initialLibraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(initialLibraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: initialLibraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
    });

    it("should update the most recently modified library item", async () => {
      const oldItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const recentItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WISHLIST,
      });

      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(recentItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.EXPERIENCED);

      const dbOldItem = await prisma.libraryItem.findUnique({
        where: { id: oldItem.id },
      });
      expect(dbOldItem?.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
    });

    it("should handle all journey status transitions", async () => {
      const initialLibraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const statuses = [
        LibraryItemStatus.CURRENTLY_EXPLORING,
        LibraryItemStatus.TOOK_A_BREAK,
        LibraryItemStatus.EXPERIENCED,
        LibraryItemStatus.REVISITING,
      ];

      for (const status of statuses) {
        const result = await updateLibraryStatusAction({
          igdbId: testGame.igdbId,
          status,
        });

        expect(result.success).toBe(true);
        if (!result.success) continue;
        expect(result.data.id).toBe(initialLibraryItem.id);
        expect(result.data.status).toBe(status);
      }
    });
  });

  describe("Creating library item when none exists", () => {
    it("should create new library item if game exists but not in library", async () => {
      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.gameId).toBe(testGame.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);

      const libraryItem = await prisma.libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
    });

    it("should fetch game from IGDB and create library item if game doesn't exist", async () => {
      const newIgdbId = 999;

      const result = await updateLibraryStatusAction({
        igdbId: newIgdbId,
        status: LibraryItemStatus.WISHLIST,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.status).toBe(LibraryItemStatus.WISHLIST);

      const game = await prisma.game.findUnique({
        where: { igdbId: newIgdbId },
      });
      expect(game).toBeTruthy();
    });
  });

  describe("Error handling", () => {
    it("should return error when user is not authenticated", async () => {
      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should return error for invalid input", async () => {
      const result = await updateLibraryStatusAction({
        igdbId: -1,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid status enum", async () => {
      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: "INVALID_STATUS" as LibraryItemStatus,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });
  });
});

describe("updateLibraryEntryAction - Integration Tests", () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testGame: Awaited<ReturnType<typeof createGame>>;

  beforeEach(async () => {
    await resetTestDatabase();
    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  describe("Updating specific library entry", () => {
    it("should update library item status by ID", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.EXPERIENCED);

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.EXPERIENCED);
    });

    it("should update library item startedAt date", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      const startedDate = new Date(Date.now() + 60 * 60 * 1000);
      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        startedAt: startedDate,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.startedAt?.getTime()).toBe(startedDate.getTime());

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.startedAt?.getTime()).toBe(startedDate.getTime());
    });

    it("should update both status and completedAt date simultaneously", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "PC",
      });

      const completedDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.EXPERIENCED,
        completedAt: completedDate,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.EXPERIENCED);
      expect(result.data.completedAt?.getTime()).toBe(completedDate.getTime());

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.EXPERIENCED);
      expect(dbItem?.completedAt?.getTime()).toBe(completedDate.getTime());
    });

    it("should update specific library item without affecting others", async () => {
      const item1 = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const item2 = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WISHLIST,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: item1.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(item1.id);
      expect(result.data.status).toBe(LibraryItemStatus.EXPERIENCED);

      const dbItem2 = await prisma.libraryItem.findUnique({
        where: { id: item2.id },
      });
      expect(dbItem2?.status).toBe(LibraryItemStatus.WISHLIST);
    });
  });

  describe("Error handling", () => {
    it("should return error when user is not authenticated", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should return error for invalid input - negative library item ID", async () => {
      const result = await updateLibraryEntryAction({
        libraryItemId: -1,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid input - zero library item ID", async () => {
      const result = await updateLibraryEntryAction({
        libraryItemId: 0,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error when library item doesn't exist", async () => {
      const nonExistentId = 999999;

      const result = await updateLibraryEntryAction({
        libraryItemId: nonExistentId,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Failed to update library entry");
    });

    it("should return error when library item belongs to different user", async () => {
      const otherUser = await createUser({
        email: "other@example.com",
        username: "otheruser",
      });

      const libraryItem = await createLibraryItem({
        userId: otherUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Failed to update library entry");

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
    });

    it("should return error for invalid status enum", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: "INVALID_STATUS" as LibraryItemStatus,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });
  });

  describe("Optional platform field", () => {
    it("should allow updating status without changing platform", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
      expect(result.data.platform).toBe("PC");
    });

    it("should preserve platform when updating other fields", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.platform).toBe("PC");
      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
    });
  });
});
