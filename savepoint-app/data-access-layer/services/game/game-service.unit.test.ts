import {
  createGame,
  findGameById,
  findGameByIgdbId,
  isGameExisting,
  updateGame,
} from "@/data-access-layer/repository/game/game-repository";
import { beforeEach, describe, expect, it, vi } from "vitest";

import igdbApi from "@/shared/lib/igdb";
import type { FullGameInfoResponse, SearchResponse } from "@/shared/types/igdb";

import { ServiceErrorCode } from "../types";
import { GameService } from "./game-service";
import type { GameWithLibraryItems } from "./types";

// Mock the repository functions and IGDB API
vi.mock("@/data-access-layer/repository/game/game-repository", () => ({
  createGame: vi.fn(),
  findGameById: vi.fn(),
  findGameByIgdbId: vi.fn(),
  isGameExisting: vi.fn(),
  updateGame: vi.fn(),
}));

vi.mock("@/shared/lib/igdb", () => ({
  default: {
    getGameById: vi.fn(),
    search: vi.fn(),
  },
}));

vi.mock("@/shared/lib/date-functions", () => ({
  convertReleaseDateToIsoStringDate: vi.fn((date: string | undefined) => date),
}));

describe("GameService", () => {
  let service: GameService;
  let mockCreateGame: ReturnType<typeof vi.fn>;
  let mockFindGameById: ReturnType<typeof vi.fn>;
  let mockFindGameByIgdbId: ReturnType<typeof vi.fn>;
  let mockIsGameExisting: ReturnType<typeof vi.fn>;
  let mockUpdateGame: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new GameService();
    mockCreateGame = vi.mocked(createGame);
    mockFindGameById = vi.mocked(findGameById);
    mockFindGameByIgdbId = vi.mocked(findGameByIgdbId);
    mockIsGameExisting = vi.mocked(isGameExisting);
    mockUpdateGame = vi.mocked(updateGame);
  });

  describe("getGame", () => {
    it("should return game without library items when userId not provided", async () => {
      const mockGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        libraryItems: [],
        Review: [],
      };

      mockFindGameById.mockResolvedValue(mockGame);

      const result = await service.getGame({ gameId: "game-123" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockGame);
      }

      expect(mockFindGameById).toHaveBeenCalledWith({ id: "game-123" });
    });

    it("should filter library items by userId when provided", async () => {
      const mockGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        libraryItems: [
          {
            id: 1,
            userId: "user-123",
            gameId: "game-123",
            status: "CURIOUS_ABOUT" as const,
            platform: "PC",
            acquisitionType: "DIGITAL" as const,
            startedAt: null,
            completedAt: null,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
          {
            id: 2,
            userId: "user-456",
            gameId: "game-123",
            status: "EXPERIENCED" as const,
            platform: "PlayStation 5",
            acquisitionType: "DIGITAL" as const,
            startedAt: null,
            completedAt: new Date(),
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        ],
        Review: [],
      };

      mockFindGameById.mockResolvedValue(mockGame);

      const result = await service.getGame({
        gameId: "game-123",
        userId: "user-123",
      });

      expect(result.success).toBe(true);
      if (result.success) {
        const gameWithItems = result.data.game as GameWithLibraryItems;
        expect(gameWithItems.libraryItems).toHaveLength(1);
        expect(gameWithItems.libraryItems?.[0].userId).toBe("user-123");
      }
    });

    it("should return NOT_FOUND error when game does not exist", async () => {
      mockFindGameById.mockResolvedValue(null);

      const result = await service.getGame({ gameId: "nonexistent" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockFindGameById.mockRejectedValue(repositoryError);

      const result = await service.getGame({ gameId: "game-123" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("searchGames", () => {
    it("should search games with default limit", async () => {
      const mockGames: Partial<SearchResponse>[] = [
        {
          id: 1942,
          name: "The Witcher 3",
          cover: { id: 1, image_id: "cover-123" },
        },
        {
          id: 1943,
          name: "The Witcher 2",
          cover: { id: 2, image_id: "cover-456" },
        },
      ];

      vi.mocked(igdbApi.search).mockResolvedValue(
        mockGames as SearchResponse[]
      );

      const result = await service.searchGames({ query: "Witcher" });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.games).toHaveLength(2);
        expect(result.data.total).toBe(2);
      }

      expect(igdbApi.search).toHaveBeenCalledWith({
        name: "Witcher",
        fields: undefined,
      });
    });

    it("should apply limit and offset", async () => {
      const mockGames: Partial<SearchResponse>[] = Array.from(
        { length: 20 },
        (_, i) => ({
          id: i + 1,
          name: `Game ${i + 1}`,
          cover: { id: i + 1, image_id: `cover-${i}` },
        })
      );

      vi.mocked(igdbApi.search).mockResolvedValue(
        mockGames as SearchResponse[]
      );

      const result = await service.searchGames({
        query: "Game",
        limit: 5,
        offset: 10,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.games).toHaveLength(5);
        expect(result.data.games[0].id).toBe(11); // offset 10, so starts at 11
        expect(result.data.total).toBe(20);
      }
    });

    it("should pass filters to IGDB search", async () => {
      const mockGames: Partial<SearchResponse>[] = [
        {
          id: 1942,
          name: "The Witcher 3",
          cover: { id: 1, image_id: "cover-123" },
        },
      ];

      vi.mocked(igdbApi.search).mockResolvedValue(
        mockGames as SearchResponse[]
      );

      const result = await service.searchGames({
        query: "Witcher",
        filters: { platforms: "6" },
      });

      expect(result.success).toBe(true);
      expect(igdbApi.search).toHaveBeenCalledWith({
        name: "Witcher",
        fields: { platforms: "6" },
      });
    });

    it("should return EXTERNAL_SERVICE_ERROR when IGDB returns undefined", async () => {
      vi.mocked(igdbApi.search).mockResolvedValue(undefined);

      const result = await service.searchGames({ query: "Witcher" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Failed to search games");
        expect(result.code).toBe(ServiceErrorCode.EXTERNAL_SERVICE_ERROR);
      }
    });

    it("should handle IGDB errors", async () => {
      const igdbError = new Error("IGDB API error");
      vi.mocked(igdbApi.search).mockRejectedValue(igdbError);

      const result = await service.searchGames({ query: "Witcher" });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("IGDB API error");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("createGameFromIgdb", () => {
    it("should return existing game when already exists", async () => {
      const mockGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIsGameExisting.mockResolvedValue(true);
      mockFindGameByIgdbId.mockResolvedValue(mockGame);

      const result = await service.createGameFromIgdb({ igdbId: 1942 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockGame);
        expect(result.data.created).toBe(false);
      }

      expect(mockIsGameExisting).toHaveBeenCalledWith({ igdbId: 1942 });
      expect(mockFindGameByIgdbId).toHaveBeenCalledWith({ igdbId: 1942 });
      expect(igdbApi.getGameById).not.toHaveBeenCalled();
    });

    it("should create new game from IGDB when not exists", async () => {
      const mockIgdbGame: Partial<FullGameInfoResponse> = {
        id: 1942,
        name: "The Witcher 3",
        cover: { id: 1, image_id: "cover-123" },
        summary: "A great RPG",
        release_dates: [
          {
            id: 1,
            human: "May 19, 2015",
            platform: { id: 6, name: "PC (Microsoft Windows)", human: "PC" },
          },
        ],
      };

      const mockCreatedGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIsGameExisting.mockResolvedValue(false);
      vi.mocked(igdbApi.getGameById).mockResolvedValue(
        mockIgdbGame as FullGameInfoResponse
      );
      mockCreateGame.mockResolvedValue(mockCreatedGame);

      const result = await service.createGameFromIgdb({ igdbId: 1942 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockCreatedGame);
        expect(result.data.created).toBe(true);
      }

      expect(mockIsGameExisting).toHaveBeenCalledWith({ igdbId: 1942 });
      expect(igdbApi.getGameById).toHaveBeenCalledWith(1942);
      expect(mockCreateGame).toHaveBeenCalledWith({
        game: {
          igdbId: "1942",
          title: "The Witcher 3",
          coverImage: "cover-123",
          description: "A great RPG",
          releaseDate: "May 19, 2015",
        },
      });
    });

    it("should handle missing IGDB data fields", async () => {
      const mockIgdbGame: Partial<FullGameInfoResponse> = {
        id: 1942,
        name: "The Witcher 3",
      };

      const mockCreatedGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: null,
        description: null,
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: null,
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockIsGameExisting.mockResolvedValue(false);
      vi.mocked(igdbApi.getGameById).mockResolvedValue(
        mockIgdbGame as FullGameInfoResponse
      );
      mockCreateGame.mockResolvedValue(mockCreatedGame);

      const result = await service.createGameFromIgdb({ igdbId: 1942 });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.created).toBe(true);
      }

      expect(mockCreateGame).toHaveBeenCalledWith({
        game: {
          igdbId: "1942",
          title: "The Witcher 3",
          coverImage: null,
          description: null,
          releaseDate: null,
        },
      });
    });

    it("should return NOT_FOUND error when IGDB returns undefined", async () => {
      mockIsGameExisting.mockResolvedValue(false);
      vi.mocked(igdbApi.getGameById).mockResolvedValue(undefined);

      const result = await service.createGameFromIgdb({ igdbId: 1942 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game with IGDB ID 1942 not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle repository errors", async () => {
      const repositoryError = new Error("Database connection failed");
      mockIsGameExisting.mockRejectedValue(repositoryError);

      const result = await service.createGameFromIgdb({ igdbId: 1942 });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("updateGame", () => {
    it("should update game successfully", async () => {
      const mockExistingGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        libraryItems: [],
        Review: [],
      };

      const mockUpdatedGame = {
        ...mockExistingGame,
        title: "The Witcher 3: Wild Hunt",
        mainStory: 50,
      };

      mockFindGameById.mockResolvedValue(mockExistingGame);
      mockUpdateGame.mockResolvedValue(mockUpdatedGame);

      const result = await service.updateGame("game-123", {
        title: "The Witcher 3: Wild Hunt",
        mainStory: 50,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game.title).toBe("The Witcher 3: Wild Hunt");
        expect(result.data.game.mainStory).toBe(50);
      }

      expect(mockFindGameById).toHaveBeenCalledWith({ id: "game-123" });
      expect(mockUpdateGame).toHaveBeenCalledWith({
        id: "game-123",
        data: {
          title: "The Witcher 3: Wild Hunt",
          mainStory: 50,
        },
      });
    });

    it("should update multiple fields", async () => {
      const mockExistingGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        libraryItems: [],
        Review: [],
      };

      const mockUpdatedGame = {
        ...mockExistingGame,
        coverImage: "new-cover",
        mainStory: 50,
        mainExtra: 100,
        completionist: 200,
      };

      mockFindGameById.mockResolvedValue(mockExistingGame);
      mockUpdateGame.mockResolvedValue(mockUpdatedGame);

      const result = await service.updateGame("game-123", {
        coverImage: "new-cover",
        mainStory: 50,
        mainExtra: 100,
        completionist: 200,
      });

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game.coverImage).toBe("new-cover");
        expect(result.data.game.mainStory).toBe(50);
        expect(result.data.game.mainExtra).toBe(100);
        expect(result.data.game.completionist).toBe(200);
      }
    });

    it("should return NOT_FOUND error when game does not exist", async () => {
      mockFindGameById.mockResolvedValue(null);

      const result = await service.updateGame("nonexistent", {
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }

      expect(mockUpdateGame).not.toHaveBeenCalled();
    });

    it("should handle update errors with NOT_FOUND code", async () => {
      const mockExistingGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        libraryItems: [],
        Review: [],
      };

      mockFindGameById.mockResolvedValue(mockExistingGame);
      mockUpdateGame.mockRejectedValue(new Error("Game not found"));

      const result = await service.updateGame("game-123", {
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle other repository errors", async () => {
      const mockExistingGame = {
        id: "game-123",
        igdbId: 1942,
        title: "The Witcher 3",
        coverImage: "cover-123",
        description: "A great RPG",
        hltbId: null,
        mainStory: null,
        mainExtra: null,
        completionist: null,
        releaseDate: new Date("2015-05-19"),
        steamAppId: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        libraryItems: [],
        Review: [],
      };

      mockFindGameById.mockResolvedValue(mockExistingGame);
      mockUpdateGame.mockRejectedValue(new Error("Database connection failed"));

      const result = await service.updateGame("game-123", {
        title: "Updated Title",
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Database connection failed");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });

  describe("getIgdbGameDetails", () => {
    it("should return IGDB game details", async () => {
      const mockGameDetails: Partial<FullGameInfoResponse> = {
        id: 1942,
        name: "The Witcher 3",
        summary: "A great RPG",
        cover: { id: 1, image_id: "cover-123" },
        screenshots: [{ id: 1, image_id: "screenshot-1" }],
        genres: [{ id: 1, name: "RPG" }],
        release_dates: [
          {
            id: 1,
            human: "May 19, 2015",
            platform: { id: 6, name: "PC (Microsoft Windows)", human: "PC" },
          },
        ],
        similar_games: [
          {
            id: 1943,
            name: "The Witcher 2",
            cover: { id: 2, image_id: "cover-456" },
            release_dates: [],
            first_release_date: 1305072000,
          },
        ],
      };

      vi.mocked(igdbApi.getGameById).mockResolvedValue(
        mockGameDetails as FullGameInfoResponse
      );

      const result = await service.getIgdbGameDetails(1942);

      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.game).toEqual(mockGameDetails);
      }

      expect(igdbApi.getGameById).toHaveBeenCalledWith(1942);
    });

    it("should return NOT_FOUND error when IGDB returns undefined", async () => {
      vi.mocked(igdbApi.getGameById).mockResolvedValue(undefined);

      const result = await service.getIgdbGameDetails(1942);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("Game with IGDB ID 1942 not found");
        expect(result.code).toBe(ServiceErrorCode.NOT_FOUND);
      }
    });

    it("should handle IGDB errors", async () => {
      const igdbError = new Error("IGDB API error");
      vi.mocked(igdbApi.getGameById).mockRejectedValue(igdbError);

      const result = await service.getIgdbGameDetails(1942);

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe("IGDB API error");
        expect(result.code).toBe(ServiceErrorCode.INTERNAL_ERROR);
      }
    });
  });
});
