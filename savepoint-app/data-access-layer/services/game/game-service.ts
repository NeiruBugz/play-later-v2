/**
 * GameService - Business logic layer for game operations
 *
 * This service handles all business logic for game management including:
 * - Fetching games from database with optional library items
 * - Searching games via IGDB
 * - Creating games from IGDB data (find or create pattern)
 * - Updating game details
 * - Fetching IGDB game details
 *
 * Input validation is handled at the server action layer via Zod.
 * This service focuses on:
 * - Business rule enforcement (find or create pattern)
 * - IGDB integration with error handling
 * - Data transformation
 * - Repository orchestration
 *
 * @module shared/services/game/game-service
 */

import "server-only";

import {
  createGame,
  findGameById,
  findGameByIgdbId,
  isGameExisting,
  updateGame as updateGameRepo,
} from "@/data-access-layer/repository/game/game-repository";
import type { GameInput } from "@/data-access-layer/repository/game/types";

import { convertReleaseDateToIsoStringDate } from "@/shared/lib";

import { IgdbService } from "../igdb/igdb-service";
import { BaseService, ServiceErrorCode } from "../types";
import type {
  CreateGameFromIgdbInput,
  CreateGameResult,
  GameSearchInput,
  GetGameDetailsResult,
  GetGameInput,
  GetGameResult,
  SearchGamesResult,
  UpdateGameInput,
  UpdateGameResult,
} from "./types";

/**
 * GameService class
 *
 * Provides business logic operations for managing games.
 * All methods return ServiceResult discriminated unions for type-safe error handling.
 *
 * @example
 * ```typescript
 * const service = new GameService();
 *
 * // Search for games
 * const searchResult = await service.searchGames({
 *   query: "The Last of Us",
 *   limit: 10
 * });
 *
 * if (searchResult.success) {
 *   console.log(searchResult.data.games); // TypeScript knows games exists
 * } else {
 *   console.error(searchResult.error); // TypeScript knows error exists
 * }
 *
 * // Create game from IGDB
 * const createResult = await service.createGameFromIgdb({
 *   igdbId: 1942
 * });
 *
 * if (createResult.success) {
 *   console.log(createResult.data.game);
 *   console.log(createResult.data.created); // true if newly created
 * }
 * ```
 */
export class GameService extends BaseService {
  private igdbService: IgdbService;

  constructor() {
    super();
    this.igdbService = new IgdbService();
  }

  /**
   * Get game by ID with optional user's library items.
   *
   * Fetches a game from the database. If userId is provided, includes
   * the user's library items for this game.
   *
   * @param input - Game ID and optional user ID
   * @returns ServiceResult with game (and library items if userId provided)
   *
   * @example
   * ```typescript
   * // Get game without library items
   * const result = await service.getGame({
   *   gameId: "game-123"
   * });
   *
   * // Get game with user's library items
   * const result = await service.getGame({
   *   gameId: "game-123",
   *   userId: "user-456"
   * });
   *
   * if (result.success) {
   *   console.log(result.data.game);
   *   if (result.data.game.libraryItems) {
   *     console.log(result.data.game.libraryItems);
   *   }
   * }
   * ```
   */
  async getGame(input: GetGameInput): Promise<GetGameResult> {
    try {
      const game = await findGameById({ id: input.gameId });

      if (!game) {
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }

      // If userId provided, filter library items to only show user's items
      if (input.userId && game.libraryItems) {
        const filteredLibraryItems = game.libraryItems.filter(
          (item) => item.userId === input.userId
        );
        return this.success({
          game: {
            ...game,
            libraryItems: filteredLibraryItems,
          },
        });
      }

      return this.success({ game });
    } catch (error) {
      return this.handleError(error, "Failed to fetch game");
    }
  }

  /**
   * Search games via IGDB.
   *
   * Searches for games using the IGDB API. Returns search results
   * with game metadata (name, cover, platforms, etc.).
   *
   * @param input - Search query, limit, offset, and optional filters
   * @returns ServiceResult with games array and total count
   *
   * @example
   * ```typescript
   * // Basic search
   * const result = await service.searchGames({
   *   query: "The Last of Us"
   * });
   *
   * // Search with filters and pagination
   * const result = await service.searchGames({
   *   query: "Zelda",
   *   limit: 20,
   *   offset: 0,
   *   filters: {
   *     platforms: ["6"] // PlayStation
   *   }
   * });
   *
   * if (result.success) {
   *   console.log(result.data.games);
   *   console.log(result.data.total);
   * }
   * ```
   */
  async searchGames(input: GameSearchInput): Promise<SearchGamesResult> {
    try {
      const result = await this.igdbService.searchGamesByName({
        name: input.query,
        fields: input.filters as Record<string, string> | undefined,
      });

      if (!result.success) {
        return this.error(
          "Failed to search games",
          ServiceErrorCode.EXTERNAL_SERVICE_ERROR
        );
      }

      const games = result.data.games;

      // Apply limit and offset
      const limit = input.limit ?? 10;
      const offset = input.offset ?? 0;
      const paginatedGames = games.slice(offset, offset + limit);

      return this.success({
        games: paginatedGames,
        total: games.length,
      });
    } catch (error) {
      return this.handleError(error, "Failed to search games via IGDB");
    }
  }

  /**
   * Create game from IGDB data (find or create pattern).
   *
   * Checks if game exists in database by IGDB ID. If it exists, returns
   * the existing game. If not, fetches game details from IGDB and creates it.
   *
   * Business rules:
   * - Check database first to avoid duplicates
   * - Fetch from IGDB if not found
   * - Return created flag to indicate if new or existing
   *
   * @param input - IGDB game ID to fetch and create
   * @returns ServiceResult with game and created flag
   *
   * @example
   * ```typescript
   * const result = await service.createGameFromIgdb({
   *   igdbId: 1942 // The Witcher 3
   * });
   *
   * if (result.success) {
   *   if (result.data.created) {
   *     console.log("New game created:", result.data.game);
   *   } else {
   *     console.log("Game already existed:", result.data.game);
   *   }
   * }
   * ```
   */
  async createGameFromIgdb(
    input: CreateGameFromIgdbInput
  ): Promise<CreateGameResult> {
    try {
      // Check if game already exists
      const exists = await isGameExisting({ igdbId: input.igdbId });

      if (exists) {
        const game = await findGameByIgdbId({ igdbId: input.igdbId });
        return this.success({ game, created: false });
      }

      // Fetch game details from IGDB
      const result = await this.igdbService.getGameDetails({
        gameId: input.igdbId,
      });

      if (!result.success || !result.data.game) {
        return this.error(
          `Game with IGDB ID ${input.igdbId} not found`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      const gameInfo = result.data.game;

      // Transform IGDB data to game input
      const releaseDate = convertReleaseDateToIsoStringDate(
        gameInfo.release_dates?.[0]?.human
      );

      const gameInput: GameInput = {
        igdbId: String(input.igdbId),
        title: gameInfo.name,
        coverImage: gameInfo.cover?.image_id ?? null,
        description: gameInfo.summary ?? null,
        releaseDate: releaseDate ?? null,
      };

      // Create game in database
      const game = await createGame({ game: gameInput });

      return this.success({ game, created: true });
    } catch (error) {
      return this.handleError(error, "Failed to create game from IGDB");
    }
  }

  /**
   * Update game details.
   *
   * Updates game metadata in the database. All fields are optional.
   *
   * @param id - Game ID to update
   * @param input - Fields to update
   * @returns ServiceResult with updated game
   *
   * @example
   * ```typescript
   * // Update cover image
   * const result = await service.updateGame("game-123", {
   *   coverImage: "new-image-id"
   * });
   *
   * // Update multiple fields
   * const result = await service.updateGame("game-123", {
   *   title: "Updated Title",
   *   description: "Updated description",
   *   mainStory: 25,
   *   mainExtra: 40
   * });
   *
   * if (result.success) {
   *   console.log(result.data.game);
   * }
   * ```
   */
  async updateGame(
    id: string,
    input: UpdateGameInput
  ): Promise<UpdateGameResult> {
    try {
      // Verify game exists first
      const existingGame = await findGameById({ id });

      if (!existingGame) {
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }

      // Update game
      const game = await updateGameRepo({
        id,
        data: input,
      });

      return this.success({ game });
    } catch (error) {
      // Check if error is not found error
      if (error instanceof Error && error.message === "Game not found") {
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.handleError(error, "Failed to update game");
    }
  }

  /**
   * Get IGDB game details.
   *
   * Fetches full game details from IGDB including screenshots, genres,
   * similar games, release dates, companies, etc.
   *
   * @param igdbId - IGDB game ID
   * @returns ServiceResult with IGDB game details
   *
   * @example
   * ```typescript
   * const result = await service.getIgdbGameDetails(1942);
   *
   * if (result.success) {
   *   console.log(result.data.game.name);
   *   console.log(result.data.game.screenshots);
   *   console.log(result.data.game.genres);
   *   console.log(result.data.game.similar_games);
   * }
   * ```
   */
  async getIgdbGameDetails(igdbId: number): Promise<GetGameDetailsResult> {
    try {
      const result = await this.igdbService.getGameDetails({ gameId: igdbId });

      if (!result.success || !result.data.game) {
        return this.error(
          `Game with IGDB ID ${igdbId} not found`,
          ServiceErrorCode.NOT_FOUND
        );
      }

      return this.success({ game: result.data.game });
    } catch (error) {
      return this.handleError(error, "Failed to fetch IGDB game details");
    }
  }
}
