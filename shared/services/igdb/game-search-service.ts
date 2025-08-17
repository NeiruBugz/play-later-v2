import igdbApi from "@/shared/lib/igdb";
import { BaseService } from "../types";
import type { GameSearchParams, GameSearchResult, IIgdbService } from "./types";
import type { ServiceResponse } from "../types";

export class GameSearchService extends BaseService implements IIgdbService {
  async searchGames(params: GameSearchParams): Promise<ServiceResponse<GameSearchResult>> {
    try {
      // Validate input
      if (!params.name || params.name.trim() === "" || params.name === "undefined") {
        return this.createErrorResponse({
          message: "Search query is required and cannot be empty",
          code: "INVALID_INPUT",
        });
      }

      // Call IGDB API with the search parameters
      const response = await igdbApi.search({
        name: params.name,
        fields: {
          platforms: params.fields?.platforms ?? "",
        },
      });

      // Handle no results
      if (!response || response.length === 0) {
        return this.createSuccessResponse({
          games: [],
          count: 0,
        });
      }

      return this.createSuccessResponse({
        games: response,
        count: response.length,
      });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to search games",
        code: "SEARCH_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}