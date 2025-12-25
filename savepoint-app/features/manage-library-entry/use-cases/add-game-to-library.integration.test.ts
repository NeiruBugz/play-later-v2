import {
  AcquisitionType,
  LibraryItemStatus,
} from "@/data-access-layer/domain/library";
import { setupDatabase } from "@/test/setup/database";
import { createGame, createUser } from "@/test/setup/db-factories";

import { prisma } from "@/shared/lib/app/db";

import { addGameToLibrary } from "./add-game-to-library";

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

describe("addGameToLibrary - Use Case Integration Tests", () => {
  let testUser: Awaited<ReturnType<typeof createUser>>;
  let testGame: Awaited<ReturnType<typeof createGame>>;

  beforeAll(async () => {
    await setupDatabase();
  });

  beforeEach(async () => {
    vi.clearAllMocks();

    mockGetGameDetails.mockResolvedValue({
      success: true,
      data: {
        game: {
          id: 999,
          name: "Test Game from IGDB",
          slug: "test-game-from-igdb",
          summary: "A test game fetched from IGDB",
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
  });

  describe("when game exists in database", () => {
    it("should add game to library successfully", async () => {
      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
        platform: "PlayStation 5",
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.libraryItem.userId).toBe(testUser.id);
      expect(result.data.libraryItem.gameId).toBe(testGame.id);
      expect(result.data.libraryItem.status).toBe(
        LibraryItemStatus.WANT_TO_PLAY
      );
      expect(result.data.libraryItem.platform).toBe("PlayStation 5");
      expect(result.data.libraryItem.acquisitionType).toBe(
        AcquisitionType.DIGITAL
      );
      expect(result.data.gameSlug).toBe(testGame.slug);

      const libraryItem = await prisma.libraryItem.findUnique({
        where: { id: result.data.libraryItem.id },
      });
      expect(libraryItem).toBeTruthy();
      expect(libraryItem?.status).toBe(LibraryItemStatus.WANT_TO_PLAY);
    });

    it("should add game with dates when provided", async () => {
      const startedAt = new Date("2024-01-01");
      const completedAt = new Date("2024-02-01");

      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.PLAYED,
        platform: "PC",
        startedAt,
        completedAt,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.libraryItem.startedAt?.toISOString()).toBe(
        startedAt.toISOString()
      );
      expect(result.data.libraryItem.completedAt?.toISOString()).toBe(
        completedAt.toISOString()
      );
    });

    it("should return error when adding duplicate library item", async () => {
      await addGameToLibrary({
        userId: testUser.id,
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain("already in your library");
    });
  });

  describe("when game does not exist in database", () => {
    it("should fetch from IGDB and populate database", async () => {
      const newIgdbId = 999;

      const gameBeforeFetch = await prisma.game.findUnique({
        where: { igdbId: newIgdbId },
      });
      expect(gameBeforeFetch).toBeNull();

      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: newIgdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      const gameAfterFetch = await prisma.game.findUnique({
        where: { igdbId: newIgdbId },
      });
      expect(gameAfterFetch).toBeTruthy();
      expect(gameAfterFetch?.title).toBe("Test Game from IGDB");
      expect(gameAfterFetch?.slug).toBe("test-game-from-igdb");

      expect(result.data.libraryItem.gameId).toBe(gameAfterFetch?.id);
      expect(result.data.gameSlug).toBe("test-game-from-igdb");
    });

    it("should return error when IGDB fetch fails", async () => {
      mockGetGameDetails.mockResolvedValueOnce({
        success: false,
        error: "IGDB API error",
      });

      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: 888,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain("Failed to fetch game details from IGDB");
    });

    it("should return error when game not found in IGDB", async () => {
      mockGetGameDetails.mockResolvedValueOnce({
        success: true,
        data: { game: null },
      });

      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: 777,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain("Game not found in IGDB");
    });
  });

  describe("when user does not exist", () => {
    it("should return error", async () => {
      const result = await addGameToLibrary({
        userId: "non-existent-user-id",
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(false);
      if (result.success) return;

      expect(result.error).toContain("User account not found");
    });
  });

  describe("edge cases", () => {
    it("should handle platform as undefined", async () => {
      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.libraryItem.platform).toBeNull();
    });

    it("should handle dates as undefined", async () => {
      const result = await addGameToLibrary({
        userId: testUser.id,
        igdbId: testGame.igdbId,
        status: LibraryItemStatus.WANT_TO_PLAY,
      });

      expect(result.success).toBe(true);
      if (!result.success) return;

      expect(result.data.libraryItem.startedAt).toBeNull();
      expect(result.data.libraryItem.completedAt).toBeNull();
    });

    it("should work with all library statuses", async () => {
      const statuses = [
        LibraryItemStatus.WANT_TO_PLAY,
        LibraryItemStatus.OWNED,
        LibraryItemStatus.PLAYING,
        LibraryItemStatus.PLAYED,
      ];

      for (const status of statuses) {
        const game = await createGame({
          title: `Game for ${status}`,
          igdbId: Math.floor(Math.random() * 1000000),
        });

        const result = await addGameToLibrary({
          userId: testUser.id,
          igdbId: game.igdbId,
          status,
        });

        expect(result.success).toBe(true);
        if (!result.success) continue;

        expect(result.data.libraryItem.status).toBe(status);
      }
    });
  });
});
