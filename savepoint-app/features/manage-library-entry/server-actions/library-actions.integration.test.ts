import { getServerUserId } from "@/auth";
import { LibraryItemStatus } from "@/data-access-layer/domain/library";
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

import { addToLibraryAction } from "./add-to-library-action";
import { updateLibraryEntryAction } from "./update-library-entry-action";
import { updateLibraryStatusAction } from "./update-library-status-action";

const {
  mockGetGameDetails,
  MockIgdbService,
  mockPopulateGameInDatabase,
  MockGameDetailService,
} = vi.hoisted(() => {
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
    MockGameDetailService: class {
      async populateGameInDatabase(...args: unknown[]) {
        return mockPopulate(...args);
      }
    },
  };
});

vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: MockIgdbService,
}));

vi.mock("@/data-access-layer/services/game-detail/game-detail-service", () => ({
  GameDetailService: MockGameDetailService,
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
      const createdGame = await getTestDatabase().game.create({
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
      return { success: true, data: createdGame };
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
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.gameId).toBe(testGame.id);
      expect(result.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);

      const libraryItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
      expect(libraryItem?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should add game with platform information", async () => {
      const result = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.platform).toBe("PlayStation 5");

      const libraryItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
      expect(libraryItem?.platform).toBe("PlayStation 5");
    });

    it("should add game without platform information", async () => {
      const result = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.platform).toBeNull();

      const libraryItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
      expect(libraryItem?.platform).toBeNull();
    });

    it("should handle all journey statuses", async () => {
      const statuses = [
        LibraryItemStatus.WANT_TO_PLAY,
        LibraryItemStatus.OWNED,
        LibraryItemStatus.PLAYING,
        LibraryItemStatus.PLAYED,
      ];

      for (let i = 0; i < statuses.length; i++) {
        const status = statuses[i];
        const user = await createUser({
          email: `user-status-${i}@example.com`,
          username: `user-status-${i}`,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should allow adding the same game multiple times (current data model supports multiple entries)", async () => {
      const firstResult = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      });

      expect(firstResult.success).toBe(true);
      if (!firstResult.success) return;

      const secondResult = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PlayStation 5",
      });

      expect(secondResult.success).toBe(true);
      if (!secondResult.success) return;

      expect(firstResult.data.id).not.toBe(secondResult.data.id);
      expect(firstResult.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
      expect(secondResult.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should return error for invalid input", async () => {
      const result = await addToLibraryAction({
        igdbId: -1,
        status: LibraryItemStatus.WANT_TO_PLAY,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);

      const game = await getTestDatabase().game.findUnique({
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
      const createdGame = await getTestDatabase().game.create({
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
      return { success: true, data: createdGame };
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(initialLibraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYING);

      const dbItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: initialLibraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.PLAYING);
    });

    it("should update the most recently modified library item", async () => {
      const oldItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      await new Promise((resolve) => setTimeout(resolve, 10));

      const recentItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.PLAYED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(recentItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYED);

      const dbOldItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: oldItem.id },
      });
      expect(dbOldItem?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should handle all journey status transitions", async () => {
      const initialLibraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const statuses = [
        LibraryItemStatus.PLAYING,
        LibraryItemStatus.PLAYED,
        LibraryItemStatus.PLAYED,
        LibraryItemStatus.PLAYING,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.gameId).toBe(testGame.id);
      expect(result.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);

      const libraryItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
    });

    it("should create library item with null platform when using quick action", async () => {
      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.platform).toBeNull();

      const libraryItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
      expect(libraryItem?.platform).toBeNull();
    });

    it("should fetch game from IGDB and create library item if game doesn't exist", async () => {
      const newIgdbId = 999;

      const result = await updateLibraryStatusAction({
        igdbId: newIgdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);

      const game = await getTestDatabase().game.findUnique({
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should return error for invalid input", async () => {
      const result = await updateLibraryStatusAction({
        igdbId: -1,
        status: LibraryItemStatus.WANT_TO_PLAY,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYED);

      const dbItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.PLAYED);
    });

    it("should update library item startedAt date", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      });

      const startedDate = new Date(Date.now() + 60 * 60 * 1000);
      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
        startedAt: startedDate,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.startedAt?.getTime()).toBe(startedDate.getTime());

      const dbItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.startedAt?.getTime()).toBe(startedDate.getTime());
    });

    it("should update both status and completedAt date simultaneously", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.PLAYING,
        platform: "PC",
      });

      const completedDate = new Date(Date.now() + 24 * 60 * 60 * 1000);
      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYED,
        completedAt: completedDate,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYED);
      expect(result.data.completedAt?.getTime()).toBe(completedDate.getTime());

      const dbItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.PLAYED);
      expect(dbItem?.completedAt?.getTime()).toBe(completedDate.getTime());
    });

    it("should update specific library item without affecting others", async () => {
      const item1 = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const item2 = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: item1.id,
        status: LibraryItemStatus.PLAYED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(item1.id);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYED);

      const dbItem2 = await getTestDatabase().libraryItem.findUnique({
        where: { id: item2.id },
      });
      expect(dbItem2?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });
  });

  describe("Error handling", () => {
    it("should return error when user is not authenticated", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYED,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should return error for invalid input - negative library item ID", async () => {
      const result = await updateLibraryEntryAction({
        libraryItemId: -1,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid input - zero library item ID", async () => {
      const result = await updateLibraryEntryAction({
        libraryItemId: 0,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error when library item doesn't exist", async () => {
      const nonExistentId = 999999;

      const result = await updateLibraryEntryAction({
        libraryItemId: nonExistentId,
        status: LibraryItemStatus.PLAYED,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYED,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Failed to update library entry");

      const dbItem = await getTestDatabase().libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should return error for invalid status enum", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe(LibraryItemStatus.PLAYING);
      expect(result.data.platform).toBe("PC");
    });

    it("should preserve platform when updating other fields", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.platform).toBe("PC");
      expect(result.data.status).toBe(LibraryItemStatus.PLAYING);
    });
  });
});
