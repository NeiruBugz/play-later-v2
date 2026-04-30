import "server-only";

import {
  findImportedGameById,
  findImportedGamesByUserId,
  updateImportedGameStatus,
} from "@/data-access-layer/repository";
import type { IgdbMatchStatus, ImportedGame } from "@prisma/client";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

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
  ): Promise<FindImportedGamesByUserIdResult> {
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

    return findImportedGamesByUserId(userId, {
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
  }

  async dismissImportedGame(input: DismissImportedGameInput): Promise<void> {
    const { importedGameId, userId } = input;
    await updateImportedGameStatus(importedGameId, userId, "IGNORED");
  }

  async findById(
    input: FindImportedGameByIdInput
  ): Promise<ImportedGame | null> {
    const { id, userId } = input;
    return findImportedGameById(id, userId);
  }

  async updateStatus(
    input: UpdateImportedGameStatusInput
  ): Promise<ImportedGame> {
    const { id, userId, status } = input;
    return updateImportedGameStatus(id, userId, status);
  }
}
