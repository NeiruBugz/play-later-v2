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

export class GameService extends BaseService {
  private igdbService: IgdbService;

  constructor() {
    super();
    this.igdbService = new IgdbService();
  }

  async getGame(input: GetGameInput): Promise<GetGameResult> {
    try {
      const game = await findGameById({ id: input.gameId });

      if (!game) {
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }

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

  async createGameFromIgdb(
    input: CreateGameFromIgdbInput
  ): Promise<CreateGameResult> {
    try {
      const exists = await isGameExisting({ igdbId: input.igdbId });

      if (exists) {
        const game = await findGameByIgdbId({ igdbId: input.igdbId });
        return this.success({ game, created: false });
      }

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

      const game = await createGame({ game: gameInput });

      return this.success({ game, created: true });
    } catch (error) {
      return this.handleError(error, "Failed to create game from IGDB");
    }
  }

  async updateGame(
    id: string,
    input: UpdateGameInput
  ): Promise<UpdateGameResult> {
    try {
      const existingGame = await findGameById({ id });

      if (!existingGame) {
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }
      const game = await updateGameRepo({
        id,
        data: input,
      });

      return this.success({ game });
    } catch (error) {
      if (error instanceof Error && error.message === "Game not found") {
        return this.error("Game not found", ServiceErrorCode.NOT_FOUND);
      }

      return this.handleError(error, "Failed to update game");
    }
  }

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
