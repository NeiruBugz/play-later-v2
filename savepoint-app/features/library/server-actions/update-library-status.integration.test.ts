import { setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";
import { LibraryItemStatus } from "@prisma/client";

import { prisma } from "@/shared/lib/app/db";

import { updateLibraryStatusAction } from "./update-library-status";

// Mock Next.js cache revalidation
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

// Mock auth module
vi.mock("@/auth", () => ({
  getServerUserId: vi.fn(),
}));

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
      title: "Test Game",
      igdbId: 12345,
    });

    // Mock getServerUserId to return test user
    const { getServerUserId } = await import("@/auth");
    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  describe("Successful status updates", () => {
    it("should update library item status", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);

      // Verify database state
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
    });

    it("should handle all valid status transitions", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const statuses: LibraryItemStatus[] = [
        LibraryItemStatus.CURRENTLY_EXPLORING,
        LibraryItemStatus.TOOK_A_BREAK,
        LibraryItemStatus.EXPERIENCED,
        LibraryItemStatus.REVISITING,
      ];

      for (const status of statuses) {
        const result = await updateLibraryStatusAction({
          libraryItemId: libraryItem.id,
          status,
        });

        expect(result.success).toBe(true);
        if (!result.success) continue;
        expect(result.data.status).toBe(status);
      }
    });
  });

  describe("Status transition validation", () => {
    it("should prevent moving TO Wishlist from other statuses", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "WISHLIST",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("Cannot move a game back to Wishlist");

      // Verify status unchanged
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURRENTLY_EXPLORING);
    });

    it("should allow updating Wishlist TO other statuses", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WISHLIST,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "CURIOUS_ABOUT",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
    });

    it("should allow staying in Wishlist status (same status update)", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WISHLIST,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "WISHLIST",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.status).toBe(LibraryItemStatus.WISHLIST);
    });
  });

  describe("Authorization checks", () => {
    it("should return error when user is not authenticated", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should prevent users from updating other users' library items", async () => {
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
      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Library item not found");

      // Verify library item was not modified
      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.CURIOUS_ABOUT);
    });

    it("should return error when library item doesn't exist", async () => {
      const nonExistentId = 999999;

      const result = await updateLibraryStatusAction({
        libraryItemId: nonExistentId,
        status: "CURRENTLY_EXPLORING",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Library item not found");
    });
  });

  describe("Input validation", () => {
    it("should return error for invalid input - negative library item ID", async () => {
      const result = await updateLibraryStatusAction({
        libraryItemId: -1,
        status: "CURIOUS_ABOUT",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid input - zero library item ID", async () => {
      const result = await updateLibraryStatusAction({
        libraryItemId: 0,
        status: "CURIOUS_ABOUT",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid status enum", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        // @ts-expect-error - Testing invalid status
        status: "INVALID_STATUS",
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });
  });

  describe("Cache revalidation", () => {
    it("should call revalidatePath after successful update", async () => {
      const { revalidatePath } = await import("next/cache");

      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.CURIOUS_ABOUT,
      });

      await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: "CURRENTLY_EXPLORING",
      });

      expect(revalidatePath).toHaveBeenCalledWith("/library");
    });

    it("should not call revalidatePath on error", async () => {
      const { revalidatePath } = await import("next/cache");
      vi.mocked(revalidatePath).mockClear();

      await updateLibraryStatusAction({
        libraryItemId: 999999, // Non-existent ID
        status: "CURRENTLY_EXPLORING",
      });

      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
