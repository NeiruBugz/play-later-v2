import {
  AcquisitionType,
  LibraryItemStatus,
} from "@/data-access-layer/domain/library";
import {
  findGameByIgdbId,
  findImportedGameById,
  RepositoryErrorCode,
  updateImportedGameStatus,
} from "@/data-access-layer/repository";
import {
  GameDetailService,
  IgdbService,
  LibraryService,
  ServiceErrorCode,
} from "@/data-access-layer/services";
import { matchSteamGameToIgdb } from "@/data-access-layer/services/igdb/igdb-matcher";
import {
  createDatabaseGameFixture,
  createFullGameFixture,
  createLibraryItemFixture,
} from "@/test/fixtures";
import type { ImportedGame } from "@prisma/client";

import { importGameToLibrary } from "./import-game-to-library";

vi.mock("@/data-access-layer/repository");
vi.mock("@/data-access-layer/services/game-detail/game-detail-service");
vi.mock("@/data-access-layer/services/igdb/igdb-service");
vi.mock("@/data-access-layer/services/library/library-service");
vi.mock("@/data-access-layer/services/igdb/igdb-matcher");

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

  const validUserId = "clx123abc456def";
  const validImportedGameId = "imported-game-123";
  const validIgdbId = 12345;
  const validSteamAppId = "570";

  const mockImportedGame: ImportedGame = {
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
    status: LibraryItemStatus.WANT_TO_PLAY,
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
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
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

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.libraryItem).toEqual(mockLibraryItem);
        expect(result.data.gameSlug).toBe("dota-2");
      }

      expect(findImportedGameById).toHaveBeenCalledWith(
        validImportedGameId,
        validUserId
      );
      expect(findGameByIgdbId).toHaveBeenCalledWith(validIgdbId);
      expect(matchSteamGameToIgdb).not.toHaveBeenCalled();
      expect(mockLibraryService.createLibraryItem).toHaveBeenCalledWith({
        userId: validUserId,
        gameId: mockGame.id,
        libraryItem: {
          status: LibraryItemStatus.WANT_TO_PLAY,
          acquisitionType: AcquisitionType.DIGITAL,
          platform: "PC (Microsoft Windows)",
        },
      });
      expect(updateImportedGameStatus).toHaveBeenCalledWith(
        validImportedGameId,
        validUserId,
        "MATCHED"
      );
    });

    it("should successfully import game with auto-matching from Steam", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
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

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
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
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue({
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

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(true);

      expect(mockGameDetailService.populateGameInDatabase).toHaveBeenCalledWith(
        mockIgdbGame
      );
    });

    it("should fetch and populate game from IGDB when not in database (manual IGDB ID)", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue({
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

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
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

    it("should create library item with OWNED status when status is 'owned'", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [],
      });

      const ownedLibraryItem = {
        ...mockLibraryItem,
        status: LibraryItemStatus.OWNED,
      };
      mockLibraryService.createLibraryItem.mockResolvedValue({
        success: true,
        data: ownedLibraryItem,
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "owned",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);

      expect(mockLibraryService.createLibraryItem).toHaveBeenCalledWith({
        userId: validUserId,
        gameId: mockGame.id,
        libraryItem: {
          status: LibraryItemStatus.OWNED,
          acquisitionType: AcquisitionType.DIGITAL,
          platform: "PC (Microsoft Windows)",
        },
      });
    });
  });

  describe("error scenarios - NOT_FOUND", () => {
    it("should return NOT_FOUND when imported game fetch fails", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Database error",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NOT_FOUND");
        expect(result.error).toBe("Failed to fetch imported game");
      }

      expect(findGameByIgdbId).not.toHaveBeenCalled();
      expect(mockLibraryService.createLibraryItem).not.toHaveBeenCalled();
    });

    it("should return NOT_FOUND when imported game does not exist", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NOT_FOUND");
        expect(result.error).toBe("Imported game not found or access denied");
      }
    });
  });

  describe("error scenarios - NO_MATCH", () => {
    it("should return NO_MATCH when storefrontGameId is missing for auto-match", async () => {
      const importedGameWithoutAppId = {
        ...mockImportedGame,
        storefrontGameId: null,
      };

      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: importedGameWithoutAppId,
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...importedGameWithoutAppId, igdbMatchStatus: "UNMATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NO_MATCH");
        expect(result.error).toBe("Cannot match game without Steam App ID");
      }

      expect(updateImportedGameStatus).toHaveBeenCalledWith(
        validImportedGameId,
        validUserId,
        "UNMATCHED"
      );
    });

    it("should return NO_MATCH when Steam to IGDB matching returns no game", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: true,
        data: { game: null },
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "UNMATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NO_MATCH");
        expect(result.error).toBe("No IGDB match found for this Steam game");
      }

      expect(updateImportedGameStatus).toHaveBeenCalledWith(
        validImportedGameId,
        validUserId,
        "UNMATCHED"
      );
    });
  });

  describe("error scenarios - IGDB_ERROR", () => {
    it("should return NETWORK_ERROR on network errors and NOT update status", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: false,
        error: "Network connection failed",
        code: ServiceErrorCode.EXTERNAL_SERVICE_ERROR,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NETWORK_ERROR");
        expect(result.error).toBe("Network connection failed");
      }

      expect(updateImportedGameStatus).not.toHaveBeenCalled();
    });

    it("should return NETWORK_ERROR on rate limit errors and NOT update status", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: false,
        error: "IGDB API rate limit exceeded. Please try again in a moment.",
        code: ServiceErrorCode.IGDB_RATE_LIMITED,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NETWORK_ERROR");
        expect(result.error).toContain("rate limit");
      }

      expect(updateImportedGameStatus).not.toHaveBeenCalled();
    });

    it("should return IGDB_ERROR when Steam to IGDB matching fails (non-network error)", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(matchSteamGameToIgdb).mockResolvedValue({
        success: false,
        error: "Invalid Steam App ID format",
        code: ServiceErrorCode.VALIDATION_ERROR,
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "UNMATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Invalid Steam App ID format");
      }

      expect(updateImportedGameStatus).toHaveBeenCalledWith(
        validImportedGameId,
        validUserId,
        "UNMATCHED"
      );
    });

    it("should return IGDB_ERROR when findGameByIgdbId fails", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Database connection error",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Failed to check game existence");
      }
    });

    it("should return IGDB_ERROR when IGDB getGameDetails fails (manual IGDB ID)", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: false,
        error: "IGDB API error",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Failed to fetch game details from IGDB");
      }
    });

    it("should return IGDB_ERROR when IGDB returns no game data", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: null },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Game not found in IGDB");
      }
    });

    it("should return IGDB_ERROR when IGDB returns invalid data structure", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: {} as any,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Game not found in IGDB");
      }
    });

    it("should return IGDB_ERROR when populateGameInDatabase fails", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue({
        success: false,
        error: "Database constraint violation",
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Failed to create game record");
      }
    });

    it("should return IGDB_ERROR when populateGameInDatabase returns no data", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: null,
      });

      mockIgdbService.getGameDetails.mockResolvedValue({
        success: true,
        data: { game: mockIgdbGame },
      });

      mockGameDetailService.populateGameInDatabase.mockResolvedValue({
        success: true,
        data: null,
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Failed to create game record");
      }
    });

    it("should return IGDB_ERROR when library item creation fails", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
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

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("IGDB_ERROR");
        expect(result.error).toBe("Database constraint violation");
      }
    });
  });

  describe("error scenarios - DUPLICATE", () => {
    it("should return DUPLICATE when game already exists in user's library", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [mockLibraryItem],
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("DUPLICATE");
        expect(result.error).toBe("Game already in library");
      }

      expect(mockLibraryService.createLibraryItem).not.toHaveBeenCalled();
      expect(updateImportedGameStatus).toHaveBeenCalledWith(
        validImportedGameId,
        validUserId,
        "MATCHED"
      );
    });

    it("should return DUPLICATE when multiple library items exist for the game", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: mockGame,
      });

      const multipleItems = [
        mockLibraryItem,
        { ...mockLibraryItem, id: 2, platform: "PC" },
      ];

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: multipleItems,
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: true,
        data: { ...mockImportedGame, igdbMatchStatus: "MATCHED" },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("DUPLICATE");
        expect(result.error).toBe("Game already in library");
      }
    });
  });

  describe("edge cases", () => {
    it("should handle failure to update imported game status after UNMATCHED gracefully", async () => {
      const importedGameWithoutAppId = {
        ...mockImportedGame,
        storefrontGameId: null,
      };

      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: importedGameWithoutAppId,
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Database error",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("NO_MATCH");
      }
    });

    it("should handle failure to update imported game status after successful import gracefully", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
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

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Database error",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(true);
    });

    it("should handle failure to update imported game status after DUPLICATE gracefully", async () => {
      vi.mocked(findImportedGameById).mockResolvedValue({
        success: true,
        data: mockImportedGame,
      });

      vi.mocked(findGameByIgdbId).mockResolvedValue({
        success: true,
        data: mockGame,
      });

      mockLibraryService.findAllLibraryItemsByGameId.mockResolvedValue({
        success: true,
        data: [mockLibraryItem],
      });

      vi.mocked(updateImportedGameStatus).mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Database error",
        },
      });

      const result = await importGameToLibrary({
        importedGameId: validImportedGameId,
        userId: validUserId,
        status: "want_to_play",
        manualIgdbId: validIgdbId,
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.errorCode).toBe("DUPLICATE");
      }
    });
  });
});
