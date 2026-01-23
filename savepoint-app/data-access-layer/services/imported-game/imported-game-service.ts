import "server-only";

import { findImportedGamesByUserId } from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import type {
  FindImportedGamesByUserIdInput,
  FindImportedGamesByUserIdResult,
} from "./types";

export class ImportedGameService extends BaseService {
  private logger = createLogger({
    [LOGGER_CONTEXT.SERVICE]: "ImportedGameService",
  });

  async findByUserId(
    input: FindImportedGamesByUserIdInput
  ): Promise<ServiceResult<FindImportedGamesByUserIdResult>> {
    try {
      const {
        userId,
        search,
        page = 1,
        limit = 25,
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        sortBy,
      } = input;

      this.logger.info(
        {
          userId,
          page,
          limit,
          search,
          playtimeStatus,
          playtimeRange,
          platform,
          lastPlayed,
          sortBy,
        },
        "Finding imported games by user ID"
      );

      const result = await findImportedGamesByUserId(userId, {
        search,
        page,
        limit,
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        sortBy,
      });

      if (!result.success) {
        this.logger.error(
          { userId, error: result.error },
          "Failed to find imported games"
        );
        return this.error(
          "Failed to fetch imported games",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      this.logger.info(
        {
          userId,
          total: result.data.total,
          page: result.data.page,
          totalPages: result.data.totalPages,
        },
        "Successfully found imported games"
      );

      return this.success(result.data);
    } catch (error) {
      return this.handleError(error, "Failed to find imported games");
    }
  }
}
