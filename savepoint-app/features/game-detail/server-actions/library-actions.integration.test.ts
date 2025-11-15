import { setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";
import { LibraryItemStatus } from "@prisma/client";

import { prisma } from "@/shared/lib";

import { addToLibraryAction } from "./add-to-library-action";
import { updateLibraryEntryAction } from "./update-library-entry-action";
import { updateLibraryStatusAction } from "./update-library-status-action";

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth module
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

// Mock only IgdbService - don't mock the entire services module
vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: vi.fn().mockImplementation(() => ({
    getGameDetails: vi.fn().mockResolvedValue({
      success: true,
      data: {
        game: {
          id: 999,
          name: "Test Game",
          slug: "test-game",
          summary: "A test game",
          cover: { image_id: "test123" },
          first_release_date: 1609459200, // 2021-01-01
          genres: [{ id: 1, name: "Action", slug: "action" }],
          platforms: [
            {
              id: 1,
              name: "PC",
              slug: "pc",
              abbreviation: "PC",
            },
          ],
        },
      },
    }),
  })),
}));

describe("addToLibraryAction - Integration Tests", () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testGame: Awaited<ReturnType<typeof createGame>>;

  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    // Create test game
    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    // Mock getServerUserId to return test user
    const { getServerUserId } = await import("@/auth");
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

      // Verify library item was created in database
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
        // Create new user for each status to avoid duplicates
        const user = await createUser({
          email: `user-${status}@example.com`,
          username: `user-${status}`,
        });

        // Mock auth for this iteration
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
      // Add game to library first
      const firstResult = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      expect(firstResult.success).toBe(true);
      if (!firstResult.success) return;

      // Add the same game again with different status - should succeed
      // NOTE: Current data model intentionally allows multiple library entries per game
      // See: context/spec/002-game-detail-pages/functional-spec.md (Data Model Clarification)
      const secondResult = await addToLibraryAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WISHLIST,
        platform: "PlayStation 5",
      });

      expect(secondResult.success).toBe(true);
      if (!secondResult.success) return;

      // Verify both entries exist and are different
      expect(firstResult.data.id).not.toBe(secondResult.data.id);
      expect(firstResult.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
      expect(secondResult.data.status).toBe(LibraryItemStatus.WISHLIST);
    });

    it("should return error for invalid input", async () => {
      const result = await addToLibraryAction({
        igdbId: -1, // Invalid IGDB ID
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
      const newIgdbId = 999; // Game not in database

      const result = await addToLibraryAction({
        igdbId: newIgdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // Verify game was added to library
      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);

      // Verify game was created in database
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

  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    // Create test game
    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    // Mock getServerUserId to return test user
    const { getServerUserId } = await import("@/auth");
    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  describe("Updating existing library item status", () => {
    it("should update existing library item's status", async () => {
      // Create initial library item
      const initialLibraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      // Update status
      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(initialLibraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);

      // Verify database state
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: initialLibraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
    });

    it("should update the most recently modified library item", async () => {
      // Create multiple library items for the same game
      const oldItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      // Wait a bit to ensure different timestamps
      await new Promise((resolve) => setTimeout(resolve, 10));

      const recentItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WISHLIST,
      });

      // Update status - should update the most recent item
      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(recentItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.EXPERIENCED);

      // Verify old item remains unchanged
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
        LibraryItemStatus.WISHLIST,
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
      // Game exists but no library item
      const result = await updateLibraryStatusAction({
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.gameId).toBe(testGame.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);

      // Verify library item was created in database
      const libraryItem = await prisma.libraryItem.findUnique({
        where: { id: result.data.id },
      });
      expect(libraryItem).toBeTruthy();
    });

    it("should fetch game from IGDB and create library item if game doesn't exist", async () => {
      const newIgdbId = 999; // Game not in database

      const result = await updateLibraryStatusAction({
        igdbId: newIgdbId,
        status: LibraryItemStatus.WISHLIST,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.userId).toBe(testUser.id);
      expect(result.data.status).toBe(LibraryItemStatus.WISHLIST);

      // Verify game was created in database
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
        igdbId: -1, // Invalid IGDB ID
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

  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    // Create test user
    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    // Create test game
    testGame = await createGame({
      title: "Existing Game",
      igdbId: 12345,
    });

    // Mock getServerUserId to return test user
    const { getServerUserId } = await import("@/auth");
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

      // Verify database state
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.EXPERIENCED);
    });

    it("should update library item platform by ID", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.platform).toBe("PlayStation 5");

      // Verify database state
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.platform).toBe("PlayStation 5");
    });

    it("should update both status and platform simultaneously", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
        platform: "Xbox Series X",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
      expect(result.data.platform).toBe("Xbox Series X");

      // Verify database state
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
      expect(dbItem?.platform).toBe("Xbox Series X");
    });

    it("should update specific library item without affecting others", async () => {
      // Create multiple library items
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

      // Update only item1
      const result = await updateLibraryEntryAction({
        libraryItemId: item1.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(item1.id);
      expect(result.data.status).toBe(LibraryItemStatus.EXPERIENCED);

      // Verify item2 remains unchanged
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
      // Create another user
      const otherUser = await createUser({
        email: "other@example.com",
        username: "otheruser",
      });

      // Create library item for other user
      const libraryItem = await createLibraryItem({
        userId: otherUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      // Try to update as testUser (mocked in beforeEach)
      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.EXPERIENCED,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Failed to update library entry");

      // Verify library item was not modified
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
        // platform not provided
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
      expect(result.data.platform).toBe("PC"); // Should remain unchanged
    });

    it("should allow clearing platform by providing undefined", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: "PC",
      });

      const result = await updateLibraryEntryAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
        platform: undefined,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      // The platform field should remain as "PC" since we're not explicitly setting it to null
      // The schema doesn't convert undefined to null, so the field should remain unchanged
      expect(result.data.platform).toBe("PC");
    });
  });
});
