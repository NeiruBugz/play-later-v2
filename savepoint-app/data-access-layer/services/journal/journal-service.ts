import "server-only";

import {
  JournalEntryMapper,
  JournalMood,
  type JournalEntryDomain,
} from "@/data-access-layer/domain/journal";
import {
  createJournalEntry,
  findJournalEntriesByGameId,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, ServiceErrorCode, type ServiceResult } from "../types";

export class JournalService extends BaseService {
  private logger = createLogger({ [LOGGER_CONTEXT.SERVICE]: "JournalService" });
  async findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }) {
    try {
      this.logger.info(params, "Finding journal entries for game");
      const result = await findJournalEntriesByGameId(params);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to find journal entries"
        );
        return this.error("Failed to find journal entries");
      }
      const domainEntries = JournalEntryMapper.toDomainList(result.data);
      return this.success(domainEntries);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in findJournalEntriesByGameId"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred"
      );
    }
  }

  async createJournalEntry(params: {
    userId: string;
    gameId: string;
    title: string;
    content: string;
    mood?: JournalMood;
    playSession?: number;
    libraryItemId?: number;
  }): Promise<ServiceResult<JournalEntryDomain>> {
    try {
      this.logger.info(params, "Creating journal entry");
      const result = await createJournalEntry(params);
      if (!result.ok) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to create journal entry"
        );
        return this.error("Failed to create journal entry");
      }
      const domainEntry = JournalEntryMapper.toDomain(result.data);
      this.logger.info(
        { entryId: domainEntry.id, ...params },
        "Journal entry created successfully"
      );
      return this.success(domainEntry);
    } catch (error) {
      this.logger.error(
        { error, ...params },
        "Unexpected error in createJournalEntry"
      );
      return this.error(
        error instanceof Error ? error.message : "An unexpected error occurred",
        ServiceErrorCode.INTERNAL_ERROR
      );
    }
  }
}
