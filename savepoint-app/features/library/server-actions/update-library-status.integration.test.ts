import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { setupDatabase } from "@/test/setup/database";
import {
  createGame,
  createLibraryItem,
  createUser,
} from "@/test/setup/db-factories";

import { prisma } from "@/shared/lib/app/db";

import { updateLibraryStatusAction } from "./update-library-status";

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

vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));

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
    testUser = await createUser({
      email: "test@example.com",
      username: "testuser",
    });

    testGame = await createGame({
      title: "Test Game",
      igdbId: 12345,
    });

    const { getServerUserId } = await import("@/auth");
    vi.mocked(getServerUserId).mockResolvedValue(testUser.id);
  });

  describe("Successful status updates", () => {
    it("should update library item status", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.id).toBe(libraryItem.id);
      expect(result.data.status).toBe(LibraryItemStatus.PLAYING);

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.PLAYING);
    });

    it("should handle all valid status transitions", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const statuses: LibraryItemStatus[] = [
        LibraryItemStatus.PLAYING,
        LibraryItemStatus.PLAYED,
        LibraryItemStatus.PLAYED,
        LibraryItemStatus.PLAYING,
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
    it("should allow moving TO Want to Play from other statuses", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.PLAYING,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should allow updating Want to Play TO other statuses", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.status).toBe(LibraryItemStatus.PLAYING);
    });

    it("should allow staying in Want to Play status (same status update)", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;
      expect(result.data.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });
  });

  describe("Authorization checks", () => {
    it("should return error when user is not authenticated", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const { getServerUserId } = await import("@/auth");
      vi.mocked(getServerUserId).mockResolvedValue(undefined);

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toContain("logged in");
    });

    it("should prevent users from updating other users' library items", async () => {
      const otherUser = await createUser({
        email: "other@example.com",
        username: "otheruser",
      });

      const libraryItem = await createLibraryItem({
        userId: otherUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Library item not found");

      const dbItem = await prisma.libraryItem.findUnique({
        where: { id: libraryItem.id },
      });
      expect(dbItem?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should return error when library item doesn't exist", async () => {
      const nonExistentId = 999999;

      const result = await updateLibraryStatusAction({
        libraryItemId: nonExistentId,
        status: LibraryItemStatus.PLAYING,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid input - zero library item ID", async () => {
      const result = await updateLibraryStatusAction({
        libraryItemId: 0,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;
      expect(result.error).toBe("Invalid input data");
    });

    it("should return error for invalid status enum", async () => {
      const libraryItem = await createLibraryItem({
        userId: testUser.id,
        gameId: testGame.id,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,

        status: "INVALID_STATUS" as any as LibraryItemStatus,
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
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      await updateLibraryStatusAction({
        libraryItemId: libraryItem.id,
        status: LibraryItemStatus.PLAYING,
      });

      expect(revalidatePath).toHaveBeenCalledWith("/library");
    });

    it("should not call revalidatePath on error", async () => {
      const { revalidatePath } = await import("next/cache");
      vi.mocked(revalidatePath).mockClear();

      await updateLibraryStatusAction({
        libraryItemId: 999999,
        status: LibraryItemStatus.PLAYING,
      });

      expect(revalidatePath).not.toHaveBeenCalled();
    });
  });
});
