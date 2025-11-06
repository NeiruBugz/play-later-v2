import "server-only";

import { findJournalEntriesByGameId } from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService } from "../types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "JournalService" });

export class JournalService extends BaseService {
  /**
   * Find journal entries for a game
   */
  async findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }) {
    try {
      logger.info(params, "Finding journal entries for game");
      const result = await findJournalEntriesByGameId(params);

      if (!result.ok) {
        logger.error(
          { error: result.error, ...params },
          "Failed to find journal entries"
        );
        return this.error("Failed to find journal entries");
      }

      return this.success(result.data);
    } catch (error) {
      logger.error(
        { error, ...params },
        "Unexpected error in findJournalEntriesByGameId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }
}
