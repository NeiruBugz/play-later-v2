import {
  buildCollectionFilter,
  findGamesWithLibraryItemsPaginated,
} from "@/shared/lib/repository";

import { BaseService, type ServiceResponse } from "../types";
import type {
  CollectionParams,
  CollectionResult,
  CollectionService as CollectionServiceInterface,
} from "./types";

const ITEMS_PER_PAGE = 24;
const DEFAULT_PAGE = 1;

export class CollectionService
  extends BaseService
  implements CollectionServiceInterface
{
  async getCollection(
    params: CollectionParams
  ): Promise<ServiceResponse<CollectionResult>> {
    try {
      // Validate required parameters
      if (!params.userId) {
        return this.createErrorResponse({
          message: "User ID is required",
          code: "INVALID_INPUT",
        });
      }

      // Build collection filter using existing repository logic
      const { gameFilter } = buildCollectionFilter({
        userId: params.userId,
        platform: params.platform,
        status: params.status,
        search: params.search,
      });

      // Fetch paginated games with backlog items
      const [games, totalGames] = await findGamesWithLibraryItemsPaginated({
        where: gameFilter,
        page: params.page ?? DEFAULT_PAGE,
        itemsPerPage: ITEMS_PER_PAGE,
      });

      // Transform the data to match the expected format
      const collection = games.map((game) => ({
        game,
        libraryItems: game.libraryItems,
      }));

      return this.createSuccessResponse({
        collection,
        count: totalGames,
      });
    } catch (error) {
      const serviceError = this.handleError(error);
      return this.createErrorResponse({
        message: "Failed to fetch user game collection",
        code: "FETCH_FAILED",
        cause: serviceError.cause,
      });
    }
  }
}
