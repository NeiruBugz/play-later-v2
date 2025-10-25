import {
  buildCollectionFilter,
  findGamesWithLibraryItemsPaginated,
  getUniquePlatformsForUser,
} from "@/data-access-layer/repository";

import { createLogger } from "@/shared/lib";

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
  private logger = createLogger({ service: "CollectionService" });

  async getCollection(
    params: CollectionParams
  ): Promise<ServiceResponse<CollectionResult>> {
    this.logger.info({ userId: params.userId, params }, "Fetching collection");

    try {
      if (!params.userId) {
        this.logger.warn("Collection fetch attempted without userId");
        return this.createErrorResponse({
          message: "User ID is required",
          code: "INVALID_INPUT",
        });
      }

      const page = Math.max(params.page ?? DEFAULT_PAGE, 1);
      if (page > 1000) {
        this.logger.warn(
          { page, userId: params.userId },
          "Page number too large"
        );
        return this.createErrorResponse({
          message: "Page number exceeds maximum allowed value",
          code: "INVALID_INPUT",
        });
      }

      const { gameFilter } = buildCollectionFilter({
        userId: params.userId,
        platform: params.platform,
        status: params.status,
        search: params.search,
      });

      const [games, totalGames] = await findGamesWithLibraryItemsPaginated({
        where: gameFilter,
        page,
        itemsPerPage: ITEMS_PER_PAGE,
      });

      const collection = games.map((game) => ({
        game,
        libraryItems: game.libraryItems,
      }));

      this.logger.info(
        { userId: params.userId, count: totalGames, page },
        "Collection fetched successfully"
      );

      return this.createSuccessResponse({
        collection,
        count: totalGames,
      });
    } catch (error) {
      this.logger.error({ error, params }, "Failed to fetch collection");
      return this.handleError(error, "Failed to fetch user game collection");
    }
  }

  async getUserPlatforms(userId: string): Promise<ServiceResponse<string[]>> {
    try {
      if (!userId) {
        return this.createErrorResponse({
          message: "User ID is required",
          code: "INVALID_INPUT",
        });
      }

      const platforms = await getUniquePlatformsForUser({ userId });

      const sortedPlatforms = platforms.sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" })
      );

      this.logger.info(
        { userId, platformCount: sortedPlatforms.length },
        "User platforms fetched successfully"
      );

      return this.createSuccessResponse(sortedPlatforms);
    } catch (error) {
      this.logger.error({ error, userId }, "Failed to fetch user platforms");
      return this.handleError(error, "Failed to fetch user platforms");
    }
  }
}
