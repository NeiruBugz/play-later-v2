import igdbApi from "@/shared/lib/igdb";

import { BaseService, type ServiceResponse } from "../types";
import type {
  GameDetailsParams,
  GameDetailsResult,
  GameSearchParams,
  GameSearchResult,
  IgdbService as IgdbServiceInterface,
  PlatformsResult,
} from "./types";

export class IgdbService extends BaseService implements IgdbServiceInterface {
  async searchGames(
    params: GameSearchParams
  ): Promise<ServiceResponse<GameSearchResult>> {
    try {
      if (!params.name || params.name.trim() === "") {
        return this.createErrorResponse({
          message: "Game name is required for search",
          code: "INVALID_INPUT",
        });
      }

      const games = await igdbApi.search({
        name: params.name,
        fields: params.fields,
      });

      if (!games) {
        return this.createErrorResponse({
          message: "Failed to search games",
          code: "SEARCH_FAILED",
        });
      }

      return this.createSuccessResponse({
        games,
        count: games.length,
      });
    } catch (error) {
      return this.createErrorResponse({
        message: "Failed to search games",
        code: "SEARCH_FAILED",
        cause: this.handleError(error).cause,
      });
    }
  }

  async getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResponse<GameDetailsResult>> {
    try {
      if (!params.gameId || params.gameId <= 0) {
        return this.createErrorResponse({
          message: "Valid game ID is required",
          code: "INVALID_INPUT",
        });
      }

      const game = await igdbApi.getGameById(params.gameId);

      return this.createSuccessResponse({
        game: game || null,
      });
    } catch (error) {
      return this.createErrorResponse({
        message: "Failed to fetch game details",
        code: "FETCH_FAILED",
        cause: this.handleError(error).cause,
      });
    }
  }

  async getPlatforms(): Promise<ServiceResponse<PlatformsResult>> {
    try {
      const platforms = await igdbApi.getPlatforms();

      if (!platforms) {
        return this.createErrorResponse({
          message: "Failed to fetch platforms",
          code: "FETCH_FAILED",
        });
      }

      return this.createSuccessResponse({
        platforms: platforms as Array<{ id: number; name: string }>,
      });
    } catch (error) {
      return this.createErrorResponse({
        message: "Failed to fetch platforms",
        code: "FETCH_FAILED",
        cause: this.handleError(error).cause,
      });
    }
  }
}
