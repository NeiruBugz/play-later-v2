import "server-only";

import {
  findImportedGameById,
  findImportedGamesByUserId,
  updateImportedGameStatus,
} from "@/data-access-layer/repository";
import type { IgdbMatchStatus, ImportedGame } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";
import type {
  DismissImportedGameInput,
  FindImportedGameByIdInput,
  FindImportedGamesByUserIdInput,
  FindImportedGamesByUserIdResult,
  UpdateImportedGameStatusInput,
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

      if (
        playtimeStatus &&
        playtimeStatus !== "all" &&
        playtimeRange &&
        playtimeRange !== "all"
      ) {
        this.logger.warn(
          { playtimeStatus, playtimeRange },
          "Both playtimeStatus and playtimeRange filters provided - playtimeRange takes precedence"
        );
      }

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

  async findById(
    input: FindImportedGameByIdInput
  ): Promise<ServiceResult<ImportedGame | null>> {
    try {
      const { id, userId } = input;

      this.logger.info({ id, userId }, "Finding imported game by ID");

      const result = await findImportedGameById(id, userId);

      if (!result.success) {
        this.logger.error(
          { id, userId, error: result.error },
          "Failed to find imported game"
        );
        return this.error(
          "Failed to find imported game",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      return this.success(result.data);
    } catch (error) {
      return this.handleError(error, "Failed to find imported game");
    }
  }

  async updateStatus(
    input: UpdateImportedGameStatusInput
  ): Promise<ServiceResult<ImportedGame>> {
    try {
      const { id, userId, status } = input;

      this.logger.info({ id, userId, status }, "Updating imported game status");

      const result = await updateImportedGameStatus(id, userId, status);

      if (!result.success) {
        this.logger.error(
          { id, userId, status, error: result.error },
          "Failed to update imported game status"
        );

        if (result.error.code === "NOT_FOUND") {
          return this.error(
            "Imported game not found or access denied",
            ServiceErrorCode.NOT_FOUND
          );
        }

        return this.error(
          "Failed to update imported game status",
          ServiceErrorCode.INTERNAL_ERROR
        );
      }

      this.logger.info(
        { id, userId, status },
        "Successfully updated imported game status"
      );

      return this.success(result.data);
    } catch (error) {
      return this.handleError(error, "Failed to update imported game status");
    }
  }
}
