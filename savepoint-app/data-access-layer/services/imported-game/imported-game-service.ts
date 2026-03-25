import "server-only";

import {
  findImportedGameById,
  findImportedGamesByUserId,
  NotFoundError,
  updateImportedGameStatus,
} from "@/data-access-layer/repository";
import type { IgdbMatchStatus, ImportedGame } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import {
  handleServiceError,
  serviceError,
  ServiceErrorCode,
  serviceSuccess,
  type ServiceResult,
} from "../types";
import type {
  DismissImportedGameInput,
  FindImportedGameByIdInput,
  FindImportedGamesByUserIdInput,
  FindImportedGamesByUserIdResult,
  UpdateImportedGameStatusInput,
} from "./types";

export class ImportedGameService {
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

      const data = await findImportedGamesByUserId(userId, {
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

      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to find imported games");
    }
  }

  async dismissImportedGame(
    input: DismissImportedGameInput
  ): Promise<ServiceResult<void>> {
    try {
      const { importedGameId, userId } = input;

      try {
        await updateImportedGameStatus(importedGameId, userId, "IGNORED");
      } catch (error) {
        if (error instanceof NotFoundError) {
          return serviceError(
            "Imported game not found or access denied",
            ServiceErrorCode.NOT_FOUND
          );
        }
        throw error;
      }

      return serviceSuccess(undefined);
    } catch (error) {
      return handleServiceError(error, "Failed to dismiss imported game");
    }
  }

  async findById(
    input: FindImportedGameByIdInput
  ): Promise<ServiceResult<ImportedGame | null>> {
    try {
      const { id, userId } = input;

      const data = await findImportedGameById(id, userId);

      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to find imported game");
    }
  }

  async updateStatus(
    input: UpdateImportedGameStatusInput
  ): Promise<ServiceResult<ImportedGame>> {
    try {
      const { id, userId, status } = input;

      try {
        const data = await updateImportedGameStatus(id, userId, status);

        return serviceSuccess(data);
      } catch (error) {
        if (error instanceof NotFoundError) {
          return serviceError(
            "Imported game not found or access denied",
            ServiceErrorCode.NOT_FOUND
          );
        }
        throw error;
      }
    } catch (error) {
      return handleServiceError(error, "Failed to update imported game status");
    }
  }
}
