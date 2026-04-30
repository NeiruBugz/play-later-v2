import type { ImportedGameDto } from "@/data-access-layer/domain/imported-game";
import {
  GameDetailService,
  getGameByIgdbId,
  IgdbService,
  ImportedGameService,
  LibraryService,
  ServiceErrorCode,
} from "@/data-access-layer/services";
import { matchSteamGameToIgdb } from "@/data-access-layer/services/igdb/igdb-matcher";
import {
  createDatabaseGameFixture,
  createFullGameFixture,
  createLibraryItemFixture,
} from "@/test/fixtures";

import { AcquisitionType, LibraryItemStatus } from "@/shared/types";

import { importGameToLibrary } from "./import-game-to-library";

vi.mock("@/data-access-layer/services/game-detail/game-detail-service");
vi.mock("@/data-access-layer/services/igdb/igdb-service");
vi.mock("@/data-access-layer/services/library/library-service");
vi.mock("@/data-access-layer/services/igdb/igdb-matcher");
vi.mock("@/data-access-layer/services/imported-game/imported-game-service");

describe("importGameToLibrary", () => {
  let mockGameDetailService: {
    populateGameInDatabase: ReturnType<typeof vi.fn>;
  };
  let mockIgdbService: {
    getGameDetails: ReturnType<typeof vi.fn>;
  };
  let mockLibraryService: {
    findAllLibraryItemsByGameId: ReturnType<typeof vi.fn>;
    createLibraryItem: ReturnType<typeof vi.fn>;
  };
  let mockImportedGameService: {
    findById: ReturnType<typeof vi.fn>;
    updateStatus: ReturnType<typeof vi.fn>;
  };

  const validUserId = "clx123abc456def";
  const validImportedGameId = "imported-game-123";
  const validIgdbId = 12345;
  const validSteamAppId = "570";

  const mockImportedGameDto: ImportedGameDto = {
    id: validImportedGameId,
    userId: validUserId,
    name: "Dota 2",
    storefront: "STEAM",
    storefrontGameId: validSteamAppId,
    playtime: 12000,
    playtimeWindows: 12000,
    playtimeMac: 0,
    playtimeLinux: 0,
    lastPlayedAt: new Date("2025-01-01"),
    img_icon_url: "icon.jpg",
    img_logo_url: "logo.jpg",
    igdbMatchStatus: "PENDING",
    createdAt: new Date("2025-01-10"),
    updatedAt: new Date("2025-01-10"),
    deletedAt: null,
  };

  const mockGame = createDatabaseGameFixture({
    id: "game-456",
    igdbId: validIgdbId,
    slug: "dota-2",
    title: "Dota 2",
  });

  const mockIgdbGame = createFullGameFixture({
    id: validIgdbId,
    name: "Dota 2",
    slug: "dota-2",
    summary: "A multiplayer online battle arena game",
    cover: { id: 123, image_id: "cover123" },
  });

  const mockLibraryItem = createLibraryItemFixture({
    id: 1,
    userId: validUserId,
    gameId: mockGame.id,
    status: LibraryItemStatus.WISHLIST,
    platform: null,
    acquisitionType: AcquisitionType.DIGITAL,
    startedAt: null,
    completedAt: null,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
  });

  beforeEach(() => {
    vi.clearAllMocks();

    mockGameDetailService = {
      populateGameInDatabase: vi.fn(),
    };

    mockIgdbService = {
      getGameDetails: vi.fn(),
    };

    mockLibraryService = {
      findAllLibraryItemsByGameId: vi.fn(),
      createLibraryItem: vi.fn(),
    };

    mockImportedGameService = {
      findById: vi.fn(),
      updateStatus: vi.fn(),
    };

    vi.mocked(ImportedGameService).mockImplementation(function () {
      return mockImportedGameService as unknown as ImportedGameService;
    });

    vi.mocked(GameDetailService).mockImplementation(function () {
      return mockGameDetailService as unknown as GameDetailService;
    });

    vi.mocked(IgdbService).mockImplementation(function () {
      return mockIgdbService as unknown as IgdbService;
    });

    vi.mocked(LibraryService).mockImplementation(function () {
      return mockLibraryService as unknown as LibraryService;
    });
  });

  describe("success scenarios", () => {
    it("should successfully import game with manual IGDB ID when game exists in database", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockLibraryService.createLibraryItem.mockResolvedValue(mockLibraryItem);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryItem).toEqual(mockLibraryItem);
        expect(result.data.gameSlug).toBe("dota-2");
      }

      expect(mockImportedGameService.findById).toHaveBeenCalledWith({
        id: validImportedGameId,
        userId: validUserId,
      });
      expect(getGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
      expect(matchSteamGameToIgdb).not.toHaveBeenCalled();
      expect(mockLibraryService.createLibraryItem).toHaveBeenCalledWith({
        userId: validUserId,
        gameId: mockGame.id,
        libraryItem: {
          status: LibraryItemStatus.WISHLIST,
          acquisitionType: AcquisitionType.DIGITAL,
          platform: "PC (Microsoft Windows)",
        },
      });
      expect(mockImportedGameService.updateStatus).toHaveBeenCalledWith({
        id: validImportedGameId,
        userId: validUserId,
        status: "MATCHED",
      });
    });

    it("should successfully import game with auto-matching from Steam", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockLibraryService.createLibraryItem.mockResolvedValue(mockLibraryItem);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryItem).toEqual(mockLibraryItem);
        expect(result.data.gameSlug).toBe("dota-2");
      }

      expect(matchSteamGameToIgdb).toHaveBeenCalledWith({
        steamAppId: validSteamAppId,
      });
    });

    it("should fetch and populate game from IGDB when not in database (auto-match)", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockLibraryService.createLibraryItem.mockResolvedValue(mockLibraryItem);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(true);

      expect(mockGameDetailService.populateGameInDatabase).toHaveBeenCalledWith(
        mockIgdbGame
      );
    });

    it("should fetch and populate game from IGDB when not in database (manual IGDB ID)", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockLibraryService.createLibraryItem.mockResolvedValue(mockLibraryItem);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);

      expect(mockIgdbService.getGameDetails).toHaveBeenCalledWith({
        gameId: validIgdbId,
      });
      expect(mockGameDetailService.populateGameInDatabase).toHaveBeenCalledWith(
        mockIgdbGame
      );
    });

    it("should create library item with SHELF status when status is 'shelf'", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      const ownedLibraryItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.SHELF,
      };
      mockLibraryService.createLibraryItem.mockResolvedValue(ownedLibraryItem);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "shelf",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);

      expect(mockLibraryService.createLibraryItem).toHaveBeenCalledWith({
        userId: validUserId,
        gameId: mockGame.id,
        libraryItem: {
          status: LibraryItemStatus.SHELF,
          acquisitionType: AcquisitionType.DIGITAL,
          platform: "PC (Microsoft Windows)",
        },
      });
    });
  });

  describe("error scenarios - NOT_FOUND", () => {
    it("should return NOT_FOUND when imported game fetch fails", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: false,
        error: "Failed to find imported game",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch imported game");
      }

      expect(getGameByIgdbId).not.toHaveBeenCalled();
      expect(mockLibraryService.createLibraryItem).not.toHaveBeenCalled();
    });

    it("should return NOT_FOUND when imported game does not exist", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Imported game not found or access denied");
      }
    });
  });

  describe("error scenarios - NO_MATCH", () => {
    it("should return NO_MATCH when storefrontGameId is missing for auto-match", async () => {
      const importedGameWithoutAppId = {
        ...mockImportedGameDto,
        storefrontGameId: null,
      };

      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: importedGameWithoutAppId,
      });

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...importedGameWithoutAppId,
          igdbMatchStatus: "UNMATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Cannot match game without Steam App ID");
      }

      expect(mockImportedGameService.updateStatus).toHaveBeenCalledWith({
        id: validImportedGameId,
        userId: validUserId,
        status: "UNMATCHED",
      });
    });

    it("should return NO_MATCH when Steam to IGDB matching returns no game", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: true,
        data: { game: null },
      });

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "UNMATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("No IGDB match found for this Steam game");
      }

      expect(mockImportedGameService.updateStatus).toHaveBeenCalledWith({
        id: validImportedGameId,
        userId: validUserId,
        status: "UNMATCHED",
      });
    });
  });

  describe("error scenarios - IGDB_ERROR", () => {
    it("should return NETWORK_ERROR on network errors and NOT update status", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: false,
        error: "Network connection failed",
        code: ServiceErrorCode.EXTERNAL_SERVICE_ERROR,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Network connection failed");
      }

      expect(mockImportedGameService.updateStatus).not.toHaveBeenCalled();
    });

    it("should return NETWORK_ERROR on rate limit errors and NOT update status", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: false,
        error: "IGDB API rate limit exceeded. Please try again in a moment.",
        code: ServiceErrorCode.IGDB_RATE_LIMITED,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("rate limit");
      }

      expect(mockImportedGameService.updateStatus).not.toHaveBeenCalled();
    });

    it("should return IGDB_ERROR when Steam to IGDB matching fails (non-network error)", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: false,
        error: "Invalid Steam App ID format",
        code: ServiceErrorCode.VALIDATION_ERROR,
      });

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "UNMATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Invalid Steam App ID format");
      }

      expect(mockImportedGameService.updateStatus).toHaveBeenCalledWith({
        id: validImportedGameId,
        userId: validUserId,
        status: "UNMATCHED",
      });
    });

    it("should throw when getGameByIgdbId throws a database error", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockRejectedValue(
        new Error("Database connection error")
      );

      await expect(
        importGameToLibrary({
          importedGameId: validImportedGameId,
          userId: validUserId,
          status: "wishlist",
          manualIgdbId: validIgdbId,
        })
      ).rejects.toThrow("Database connection error");
    });

    it("should return IGDB_ERROR when IGDB getGameDetails fails (manual IGDB ID)", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: false,
        error: "IGDB API error",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to fetch game details from IGDB");
      }
    });

    it("should return IGDB_ERROR when IGDB returns no game data", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: null },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found in IGDB");
      }
    });

    it("should return IGDB_ERROR when IGDB returns invalid data structure", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: {} as any,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found in IGDB");
      }
    });

    it("should throw when populateGameInDatabase throws", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockGameDetailService.populateGameInDatabase.mockRejectedValue(
        new Error("Database constraint violation")
      );

      await expect(
        importGameToLibrary({
          importedGameId: validImportedGameId,
          userId: validUserId,
          status: "wishlist",
          manualIgdbId: validIgdbId,
        })
      ).rejects.toThrow("Database constraint violation");
    });

    it("should return error when populateGameInDatabase returns null (concurrent race)", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(null);

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue(null);

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to create game record");
      }
    });

    it("should return IGDB_ERROR when library item creation fails", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockLibraryService.createLibraryItem.mockRejectedValue(
        new Error("Database constraint violation")
      );

      await expect(
        importGameToLibrary({
          importedGameId: validImportedGameId,
          userId: validUserId,
          status: "wishlist",
          manualIgdbId: validIgdbId,
        })
      ).rejects.toThrow("Database constraint violation");
    });
  });

  describe("error scenarios - DUPLICATE", () => {
    it("should return DUPLICATE when game already exists in user's library", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([
        mockLibraryItem,
      ]);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game already in library");
      }

      expect(mockLibraryService.createLibraryItem).not.toHaveBeenCalled();
      expect(mockImportedGameService.updateStatus).toHaveBeenCalledWith({
        id: validImportedGameId,
        userId: validUserId,
        status: "MATCHED",
      });
    });

    it("should return DUPLICATE when multiple library items exist for the game", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      const multipleItems = [
        mockLibraryItem,
        { ...mockLibraryItem, id: 2, platform: "PC" },
      ];

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue(
        multipleItems
      );

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: true,
        data: {
          ...mockImportedGameDto,
          igdbMatchStatus: "MATCHED",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game already in library");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle failure to update imported game status after UNMATCHED gracefully", async () => {
      const importedGameWithoutAppId = {
        ...mockImportedGameDto,
        storefrontGameId: null,
      };

      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: importedGameWithoutAppId,
      });

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
      }
    });

    it("should handle failure to update imported game status after successful import gracefully", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([]);

      mockLibraryService.createLibraryItem.mockResolvedValue(mockLibraryItem);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);
    });

    it("should handle failure to update imported game status after DUPLICATE gracefully", async () => {
      mockImportedGameService.findById.mockResolvedValue({
        success: true,
        data: mockImportedGameDto,
      });

      vi.mocked(getGameByIgdbId).mockResolvedValue(mockGame);

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue([
        mockLibraryItem,
      ]);

      mockImportedGameService.updateStatus.mockResolvedValue({
        success: false,
        error: "Database error",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "wishlist",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
      }
    });
  });
});
