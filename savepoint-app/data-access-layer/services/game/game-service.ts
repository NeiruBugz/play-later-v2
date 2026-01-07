import "server-only";

import {
  findGameById,
  findGamesByIds,
  type GameBasicInfo,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";

const logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "GameService" });

export class GameService extends BaseService {
  async getGamesByIds(params: {
    ids: string[];
  }): Promise<ServiceResult<GameBasicInfo[]>> {
    const { ids } = params;

    logger.info({ count: ids.length }, "Fetching games by IDs");

    if (ids.length === 0) {
      return this.success([]);
    }

    const result = await findGamesByIds(ids);

    if (!result.success) {
      logger.error({ error: result.error }, "Failed to fetch games by IDs");
      return this.error(result.error.message, ServiceErrorCode.INTERNAL_ERROR);
    }

    logger.info(
      { requested: ids.length, found: result.data.length },
      "Games fetched successfully"
    );
    return this.success(result.data);
  }

  async getGameById(params: {
    id: string;
  }): Promise<ServiceResult<GameBasicInfo | null>> {
    const { id } = params;

    logger.info({ gameId: id }, "Fetching game by ID");

    const result = await findGameById(id);

    if (!result.success) {
      logger.error({ error: result.error }, "Failed to fetch game by ID");
      return this.error(result.error.message, ServiceErrorCode.INTERNAL_ERROR);
    }

    if (!result.data) {
      logger.info({ gameId: id }, "Game not found");
      return this.success(null);
    }

    return this.success(result.data);
  }
}
