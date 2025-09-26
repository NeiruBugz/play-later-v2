import "server-only";

import {
  buildCollectionFilter,
  findGamesWithBacklogItemsPaginated,
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
      const userId = await this.getCurrentUserId();

      const { gameFilter } = buildCollectionFilter({
        userId: userId,
        platform: params.platform,
        status: params.status,
        search: params.search,
      });

      const [games, totalGames] = await findGamesWithBacklogItemsPaginated({
        where: gameFilter,
        page: params.page ?? DEFAULT_PAGE,
        itemsPerPage: ITEMS_PER_PAGE,
      });

      const collection = games.map((game) => ({
        game,
        backlogItems: game.backlogItems,
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
