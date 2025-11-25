import * as gameDetailService from "@/data-access-layer/services/game-detail/game-detail-service";
import { IgdbService } from "@/data-access-layer/services/igdb/igdb-service";
import { LibraryService } from "@/data-access-layer/services/library/library-service";
import { ProfileService } from "@/data-access-layer/services/profile/profile-service";
import {
  createDatabaseGameFixture,
  createFullGameFixture,
  createLibraryItemFixture,
} from "@/test/fixtures";
import {
  AcquisitionType,
  LibraryItemStatus,
  type LibraryItemStatus as LibraryItemStatusType,
} from "@/shared/types";

import { addGameToLibrary } from "./add-game-to-library";

vi.mock("@/data-access-layer/services/igdb/igdb-service", () => ({
  IgdbService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/library/library-service", () => ({
  LibraryService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/profile/profile-service", () => ({
  ProfileService: vi.fn(),
}));

vi.mock("@/data-access-layer/services/game-detail/game-detail-service", () => ({
  populateGameInDatabase: vi.fn(),
}));

describe("addGameToLibrary", () => {
  let mockProfileService: {
    verifyUserExists: ReturnType<typeof vi.fn>;
  };
  let mockLibraryService: {
    findGameByIgdbId: ReturnType<typeof vi.fn>;
    findAllLibraryItemsByGameId: ReturnType<typeof vi.fn>;
    createLibraryItem: ReturnType<typeof vi.fn>;
  };
  let mockIgdbService: {
    getGameDetails: ReturnType<typeof vi.fn>;
  };
  let mockPopulateGameInDatabase: ReturnType<typeof vi.fn>;

  const validUserId = "clx123abc456def";
  const validIgdbId = 12345;
  const validStatus: LibraryItemStatusType = LibraryItemStatus.CURIOUS_ABOUT;

  const mockGame = createDatabaseGameFixture({
    id: "game-456",
    igdbId: validIgdbId,
    slug: "test-game",
    title: "Test Game",
  });

  const mockIgdbGame = createFullGameFixture({
    id: validIgdbId,
    name: "Test Game",
    slug: "test-game",
    summary: "A test game",
    cover: { id: 123, image_id: "cover123" },
  });

  const mockLibraryItem = createLibraryItemFixture({
    id: 1,
    userId: validUserId,
    gameId: mockGame.id,
    status: validStatus,
    platform: null,
    acquisitionType: AcquisitionType.DIGITAL,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockProfileService = {
      verifyUserExists: vi.fn(),
    };

    mockLibraryService = {
      findGameByIgdbId: vi.fn(),
      findAllLibraryItemsByGameId: vi.fn(),
      createLibraryItem: vi.fn(),
    };

    mockIgdbService = {
      getGameDetails: vi.fn(),
    };

    mockPopulateGameInDatabase = vi.mocked(
      gameDetailService.populateGameInDatabase
    );

    vi.mocked(ProfileService).mockImplementation(
      () => mockProfileService as unknown as ProfileService
    );
    vi.mocked(LibraryService).mockImplementation(
      () => mockLibraryService as unknown as LibraryService
    );
    vi.mocked(IgdbService).mockImplementation(
      () => mockIgdbService as unknown as IgdbService
    );
  });

  describe("success scenarios", () => {
    it("should successfully add game to library when game exists in database", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [],
      });

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: mockLibraryItem,
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryItem).toEqual(mockLibraryItem);
        expect(result.data.gameSlug).toBe("test-game");
      }

      expect(mockProfileService.verifyUserExists).toHaveBeenCalledWith({
        userId: validUserId,
      });
      expect(mockLibraryService.findGameByIgdbId).toHaveBeenCalledWith(
        validIgdbId
      );
      expect(mockLibraryService.createLibraryItem).toHaveBeenCalledWith({
        userId: validUserId,
        gameId: mockGame.id,
        libraryItem: {
          status: validStatus,
          acquisitionType: AcquisitionType.DIGITAL,
          platform: undefined,
          startedAt: undefined,
          completedAt: undefined,
        },
      });
    });

    it("should add game with platform and dates", async () => {
      const startedAt = new Date("2025-01-01");
      const completedAt = new Date("2025-01-15");

      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [],
      });

      const itemWithDetails = {
        ...mockLibraryItem,
        platform: "PlayStation 5",
        startedAt,
        completedAt,
      };

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: itemWithDetails,
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: LibraryItemStatus.EXPERIENCED,
        platform: "PlayStation 5",
        startedAt,
        completedAt,
      });

      expect(result.success).toBe(true);

      expect(mockLibraryService.createLibraryItem).toHaveBeenCalledWith({
        userId: validUserId,
        gameId: mockGame.id,
        libraryItem: {
          status: LibraryItemStatus.EXPERIENCED,
          acquisitionType: AcquisitionType.DIGITAL,
          platform: "PlayStation 5",
          startedAt,
          completedAt,
        },
      });
    });

    it("should fetch and populate game from IGDB when not in database", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId
        .mockResolvedValueOnce({
          success: false,
          error: "Game not found",
        })
        .mockResolvedValueOnce({
          success: true,
          data: mockGame,
        });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockPopulateGameInDatabase.mockResolvedValue({ ok: true });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [],
      });

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: mockLibraryItem,
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(true);

      expect(mockIgdbService.getGameDetails).toHaveBeenCalledWith({
        gameId: validIgdbId,
      });
      expect(mockPopulateGameInDatabase).toHaveBeenCalledWith(mockIgdbGame);
      expect(mockLibraryService.findGameByIgdbId).toHaveBeenCalledTimes(2);
    });

    it("should allow adding same game with different platform", async () => {
      const existingItem = {
        ...mockLibraryItem,
        platform: "PlayStation 5",
      };

      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [existingItem],
      });

      const newItem = { ...mockLibraryItem, platform: "PC" };

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: newItem,
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
        platform: "PC",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryItem.platform).toBe("PC");
      }
    });

    it("should allow adding same game with different status", async () => {
      const existingItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.WISHLIST,
      };

      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [existingItem],
      });

      const newItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      };

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: newItem,
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: LibraryItemStatus.CURRENTLY_EXPLORING,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryItem.status).toBe("CURRENTLY_EXPLORING");
      }
    });

    it("should handle undefined platform as null in duplicate check", async () => {
      const existingItem = {
        ...mockLibraryItem,
        platform: null,
      };

      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [existingItem],
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("already in your library");
      }
    });
  });

  describe("error scenarios", () => {
    it("should return error when user verification fails", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: false,
        error: "User not found",
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("User not found");
      }

      expect(mockLibraryService.findGameByIgdbId).not.toHaveBeenCalled();
    });

    it("should return error when IGDB fetch fails", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: false,
        error: "Game not found",
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: false,
        error: "IGDB API error",
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch game details from IGDB");
      }
    });

    it("should return error when IGDB returns no game data", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: false,
        error: "Game not found",
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: null },
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found in IGDB");
      }
    });

    it("should return error when game not found after population", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: false,
        error: "Game not found",
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockPopulateGameInDatabase.mockResolvedValue({ ok: true });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to save game to database");
      }
    });

    it("should return error when exact duplicate exists", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [mockLibraryItem],
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("This game is already in your library");
      }

      expect(mockLibraryService.createLibraryItem).not.toHaveBeenCalled();
    });

    it("should return error when library item creation fails", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [],
      });

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: false,
        error: "Database constraint violation",
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database constraint violation");
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      mockProfileService.verifyUserExists.mockRejectedValue(
        new Error("Database connection lost")
      );

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection lost");
      }
    });

    it("should handle non-Error exceptions", async () => {
      mockProfileService.verifyUserExists.mockRejectedValue(
        "String error message"
      );

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("An unexpected error occurred");
      }
    });

    it("should handle existing items query failure gracefully", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: mockLibraryItem,
      });

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(true);
    });

    it("should return error when IGDB game data structure is missing", async () => {
      mockProfileService.verifyUserExists.mockResolvedValue({
        success: true,
        data: { exists: true },
      });

      mockLibraryService.findGameByIgdbId.mockResolvedValue({
        success: false,
        error: "Game not found",
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: {},
      } as any);

      const result = await addGameToLibrary({
        userId: validUserId,
        igdbId: validIgdbId,
        status: validStatus,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found in IGDB");
      }
    });
  });
});
