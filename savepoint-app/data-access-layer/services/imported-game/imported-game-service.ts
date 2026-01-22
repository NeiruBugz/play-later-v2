import "server-only";

import {
  findImportedGamesByUserId,
  updateImportedGameStatus,
} from "@/data-access-layer/repository";
import type { IgdbMatchStatus } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import type {
  DismissImportedGameInput,
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
        showAlreadyImported = false,
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
          showAlreadyImported,
        },
        "Finding imported games by user ID"
      );

      const matchStatus: IgdbMatchStatus[] = showAlreadyImported
        ? ["PENDING", "UNMATCHED", "MATCHED"]
        : ["PENDING", "UNMATCHED"];

      const result = await findImportedGamesByUserId(userId, {
        search,
        page,
        limit,
        playtimeStatus,
        playtimeRange,
        platform,
        lastPlayed,
        sortBy,
        matchStatus,
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

  async dismissImportedGame(
    input: DismissImportedGameInput
  ): Promise<ServiceResult<void>> {
    try {
      const { importedGameId, userId } = input;

      this.logger.info({ importedGameId, userId }, "Dismissing imported game");

      const result = await updateImportedGameStatus(
        importedGameId,
        userId,
        "IGNORED"
      );

      if (!result.success) {
        this.logger.error(
          { importedGameId, userId, error: result.error },
          "Failed to dismiss imported game"
        );

        if (result.error.code === "NOT_FOUND") {
          return this.error(
            "Imported game not found or access denied",
            ServiceErrorCode.NOT_FOUND
          );
        }

        return this.error(
          "Failed to dismiss imported game",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      this.logger.info(
        { importedGameId, userId },
        "Successfully dismissed imported game"
      );

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, "Failed to dismiss imported game");
    }
  }
}
