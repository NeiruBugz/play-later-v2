import { RepositoryErrorCode } from "@/data-access-layer/repository/types";
import { ServiceErrorCode } from "@/data-access-layer/services/types";
import type { Game } from "@prisma/client";

import type { FullGameInfoResponse } from "@/shared/types";

import * as repository from "../../repository/game/game-repository";
import * as genreRepository from "../../repository/genre/genre-repository";
import * as platformRepository from "../../repository/platform/platform-repository";
import { GameDetailService } from "./game-detail-service";

vi.mock("../../repository/game/game-repository");
vi.mock("../../repository/genre/genre-repository");
vi.mock("../../repository/platform/platform-repository");

describe("GameDetailService - Unit Tests", () => {
  let service: GameDetailService;
  const mockGameExistsByIgdbId = vi.mocked(repository.gameExistsByIgdbId);
  const mockUpsertGenres = vi.mocked(genreRepository.upsertGenres);
  const mockUpsertPlatforms = vi.mocked(platformRepository.upsertPlatforms);
  const mockCreateGameWithRelations = vi.mocked(
    repository.createGameWithRelations
  );

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GameDetailService();
  });

  const createMockIgdbGame = (
    overrides: Partial<FullGameInfoResponse> = {}
  ): FullGameInfoResponse => ({
    id: 12345,
    name: "Test Game",
    slug: "test-game",
    cover: { image_id: "co_test" },
    game_type: 0,
    aggregated_rating: 85,
    external_games: [],
    game_engines: [],
    game_modes: [],
    involved_companies: [],
    player_perspectives: [],
    release_dates: [],
    screenshots: [],
    similar_games: [],
    themes: [],
    websites: [],
    franchises: [],
    collections: [],
    genres: [],
    platforms: [],
    ...overrides,
  });

  describe("populateGameInDatabase", () => {
    it("should return success with game data when population succeeds", async () => {
      const mockGame: Game = {
        id: "game-uuid",
        title: "Test Game",
        slug: "test-game",
        igdbId: 12345,
        hltbId: null,
        description: null,
        coverImage: "co_test",
        releaseDate: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        steamAppId: null,
        franchiseId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: true,
        data: [],
      });
      mockUpsertPlatforms.mockResolvedValue({
        success: true,
        data: [],
      });
      mockCreateGameWithRelations.mockResolvedValue({
        success: true,
        data: mockGame,
      });

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toEqual(mockGame);
        expect(result.data?.title).toBe("Test Game");
        expect(result.data?.igdbId).toBe(12345);
      }
    });

    it("should return success with null when game already exists", async () => {
      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: true,
      });

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data).toBeNull();
      }

      expect(mockUpsertGenres).not.toHaveBeenCalled();
      expect(mockUpsertPlatforms).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).not.toHaveBeenCalled();
    });

    it("should return error when genre upsert fails", async () => {
      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Failed to upsert genres",
        },
      });

      const igdbGame = createMockIgdbGame({
        genres: [{ id: 1, name: "Action", slug: "action" }],
      });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to upsert genres");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }

      expect(mockUpsertPlatforms).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).not.toHaveBeenCalled();
    });

    it("should return error when platform upsert fails", async () => {
      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: true,
        data: [],
      });
      mockUpsertPlatforms.mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Failed to upsert platforms",
        },
      });

      const igdbGame = createMockIgdbGame({
        platforms: [{ id: 1, name: "PC", slug: "pc" }],
      });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to upsert platforms");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }

      expect(mockCreateGameWithRelations).not.toHaveBeenCalled();
    });

    it("should return error when game creation fails", async () => {
      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: true,
        data: [],
      });
      mockUpsertPlatforms.mockResolvedValue({
        success: true,
        data: [],
      });
      mockCreateGameWithRelations.mockResolvedValue({
        success: false,
        error: {
          code: RepositoryErrorCode.DATABASE_ERROR,
          message: "Failed to create game",
        },
      });

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toContain("Failed to create game");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle unexpected errors gracefully", async () => {
      mockGameExistsByIgdbId.mockRejectedValue(
        new Error("Database connection lost")
      );

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection lost");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should handle errors without messages gracefully", async () => {
      mockGameExistsByIgdbId.mockRejectedValue("Unknown error");

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Unknown error");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });

    it("should process genres when provided", async () => {
      const mockGenre = {
        id: "genre-uuid",
        name: "Action",
        slug: "action",
        igdbId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        checksum: null,
      };

      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: true,
        data: [mockGenre],
      });
      mockUpsertPlatforms.mockResolvedValue({
        success: true,
        data: [],
      });
      mockCreateGameWithRelations.mockResolvedValue({
        success: true,
        data: {
          id: "game-uuid",
          title: "Test Game",
          slug: "test-game",
          igdbId: 12345,
          hltbId: null,
          description: null,
          coverImage: "co_test",
          releaseDate: null,
          mainStory: null,
          mainExtra: null,
          completionist: null,
          steamAppId: null,
          franchiseId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const igdbGame = createMockIgdbGame({
        genres: [{ id: 1, name: "Action", slug: "action" }],
      });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(true);
      expect(mockUpsertGenres).toHaveBeenCalledWith([
        { id: 1, name: "Action", slug: "action" },
      ]);
      expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          genreIds: ["genre-uuid"],
        })
      );
    });

    it("should process platforms when provided", async () => {
      const mockPlatform = {
        id: "platform-uuid",
        name: "PC",
        slug: "pc",
        igdbId: 6,
        createdAt: new Date(),
        updatedAt: new Date(),
        checksum: null,
        abbreviation: null,
        alternativeName: null,
        generation: null,
        platformFamily: null,
        platformType: null,
      };

      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: true,
        data: [],
      });
      mockUpsertPlatforms.mockResolvedValue({
        success: true,
        data: [mockPlatform],
      });
      mockCreateGameWithRelations.mockResolvedValue({
        success: true,
        data: {
          id: "game-uuid",
          title: "Test Game",
          slug: "test-game",
          igdbId: 12345,
          hltbId: null,
          description: null,
          coverImage: "co_test",
          releaseDate: null,
          mainStory: null,
          mainExtra: null,
          completionist: null,
          steamAppId: null,
          franchiseId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const igdbGame = createMockIgdbGame({
        platforms: [{ id: 6, name: "PC", slug: "pc" }],
      });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(true);
      expect(mockUpsertPlatforms).toHaveBeenCalledWith([
        expect.objectContaining({
          id: 6,
          name: "PC",
          slug: "pc",
        }),
      ]);
      expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          platformIds: ["platform-uuid"],
        })
      );
    });

    it("should skip genre processing when genres array is empty", async () => {
      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertPlatforms.mockResolvedValue({
        success: true,
        data: [],
      });
      mockCreateGameWithRelations.mockResolvedValue({
        success: true,
        data: {
          id: "game-uuid",
          title: "Test Game",
          slug: "test-game",
          igdbId: 12345,
          hltbId: null,
          description: null,
          coverImage: "co_test",
          releaseDate: null,
          mainStory: null,
          mainExtra: null,
          completionist: null,
          steamAppId: null,
          franchiseId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const igdbGame = createMockIgdbGame({ genres: [] });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(true);
      expect(mockUpsertGenres).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          genreIds: [],
        })
      );
    });

    it("should skip platform processing when platforms array is empty", async () => {
      mockGameExistsByIgdbId.mockResolvedValue({
        success: true,
        data: false,
      });
      mockUpsertGenres.mockResolvedValue({
        success: true,
        data: [],
      });
      mockCreateGameWithRelations.mockResolvedValue({
        success: true,
        data: {
          id: "game-uuid",
          title: "Test Game",
          slug: "test-game",
          igdbId: 12345,
          hltbId: null,
          description: null,
          coverImage: "co_test",
          releaseDate: null,
          mainStory: null,
          mainExtra: null,
          completionist: null,
          steamAppId: null,
          franchiseId: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });

      const igdbGame = createMockIgdbGame({ platforms: [] });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result.success).toBe(true);
      expect(mockUpsertPlatforms).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          platformIds: [],
        })
      );
    });
  });
});
