import type { Game } from "@prisma/client";

import { ConflictError } from "@/shared/lib/errors";
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
    vi.resetAllMocks();
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
    it("should return game data when population succeeds", async () => {
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

      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([]);
      mockUpsertPlatforms.mockResolvedValue([]);
      mockCreateGameWithRelations.mockResolvedValue(mockGame);

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).toEqual(mockGame);
      expect(result?.title).toBe("Test Game");
      expect(result?.igdbId).toBe(12345);
    });

    it("should return null when game already exists", async () => {
      mockGameExistsByIgdbId.mockResolvedValue(true);

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).toBeNull();

      expect(mockUpsertGenres).not.toHaveBeenCalled();
      expect(mockUpsertPlatforms).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).not.toHaveBeenCalled();
    });

    it("should throw when genre upsert fails", async () => {
      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockRejectedValue(new Error("Failed to upsert genres"));

      const igdbGame = createMockIgdbGame({
        genres: [{ id: 1, name: "Action", slug: "action" }],
      });

      await expect(service.populateGameInDatabase(igdbGame)).rejects.toThrow(
        "Failed to upsert genres"
      );

      expect(mockUpsertPlatforms).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).not.toHaveBeenCalled();
    });

    it("should throw when platform upsert fails", async () => {
      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([]);
      mockUpsertPlatforms.mockRejectedValue(
        new Error("Failed to upsert platforms")
      );

      const igdbGame = createMockIgdbGame({
        platforms: [{ id: 1, name: "PC", slug: "pc" }],
      });

      await expect(service.populateGameInDatabase(igdbGame)).rejects.toThrow(
        "Failed to upsert platforms"
      );

      expect(mockCreateGameWithRelations).not.toHaveBeenCalled();
    });

    it("should throw when game creation fails with a non-conflict error", async () => {
      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([]);
      mockUpsertPlatforms.mockResolvedValue([]);
      mockCreateGameWithRelations.mockRejectedValue(
        new Error("Failed to create game")
      );

      const igdbGame = createMockIgdbGame();

      await expect(service.populateGameInDatabase(igdbGame)).rejects.toThrow(
        "Failed to create game"
      );
    });

    it("should return null when game creation throws ConflictError (concurrent request)", async () => {
      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([]);
      mockUpsertPlatforms.mockResolvedValue([]);
      mockCreateGameWithRelations.mockRejectedValue(
        new ConflictError("Game already exists", { igdbId: 12345 })
      );

      const igdbGame = createMockIgdbGame();
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).toBeNull();
    });

    it("should throw when gameExistsByIgdbId fails", async () => {
      mockGameExistsByIgdbId.mockRejectedValue(
        new Error("Database connection lost")
      );

      const igdbGame = createMockIgdbGame();

      await expect(service.populateGameInDatabase(igdbGame)).rejects.toThrow(
        "Database connection lost"
      );
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

      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([mockGenre]);
      mockUpsertPlatforms.mockResolvedValue([]);
      mockCreateGameWithRelations.mockResolvedValue({
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
      });

      const igdbGame = createMockIgdbGame({
        genres: [{ id: 1, name: "Action", slug: "action" }],
      });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).not.toBeNull();
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

      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([]);
      mockUpsertPlatforms.mockResolvedValue([mockPlatform]);
      mockCreateGameWithRelations.mockResolvedValue({
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
      });

      const igdbGame = createMockIgdbGame({
        platforms: [{ id: 6, name: "PC", slug: "pc" }],
      });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).not.toBeNull();
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
      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertPlatforms.mockResolvedValue([]);
      mockCreateGameWithRelations.mockResolvedValue({
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
      });

      const igdbGame = createMockIgdbGame({ genres: [] });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).not.toBeNull();
      expect(mockUpsertGenres).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          genreIds: [],
        })
      );
    });

    it("should skip platform processing when platforms array is empty", async () => {
      mockGameExistsByIgdbId.mockResolvedValue(false);
      mockUpsertGenres.mockResolvedValue([]);
      mockCreateGameWithRelations.mockResolvedValue({
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
      });

      const igdbGame = createMockIgdbGame({ platforms: [] });
      const result = await service.populateGameInDatabase(igdbGame);

      expect(result).not.toBeNull();
      expect(mockUpsertPlatforms).not.toHaveBeenCalled();
      expect(mockCreateGameWithRelations).toHaveBeenCalledWith(
        expect.objectContaining({
          platformIds: [],
        })
      );
    });
  });
});
