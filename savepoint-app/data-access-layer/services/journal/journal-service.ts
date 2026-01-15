import "server-only";

import {
  JournalEntryMapper,
  JournalMood,
  type JournalEntryDomain,
} from "@/data-access-layer/domain/journal";
import {
  createJournalEntry,
  deleteJournalEntry,
  findJournalEntriesByGameId,
  findJournalEntriesByUserId,
  findJournalEntryById,
  updateJournalEntry,
} from "@/data-access-layer/repository";

import { createLogger, LOGGER_CONTEXT } from "@/shared/lib";

import { BaseService, type ServiceResult } from "../types";

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
      if (!result.success) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to find journal entries"
        );
        return this.error("Failed to find journal entries");
      }
      const domainEntries = JournalEntryMapper.toDomainList(result.data);
      return this.success(domainEntries);
    } catch (error) {
      return this.handleError(
        error,
        "Failed to find journal entries by game ID"
      );
    }
  }

  private generateAutoTitle(timezone?: string): string {
    const options: Intl.DateTimeFormatOptions = {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone: timezone ?? "UTC",
    };
    return new Date().toLocaleDateString("en-US", options);
  }

  async createJournalEntry(params: {
    userId: string;
    gameId: string;
    title?: string;
    content: string;
    mood?: JournalMood;
    playSession?: number;
    libraryItemId?: number;
    timezone?: string;
  }): Promise<ServiceResult<JournalEntryDomain>> {
    try {
      this.logger.info(params, "Creating journal entry");

      const finalTitle =
        params.title?.trim() || this.generateAutoTitle(params.timezone);

      const result = await createJournalEntry({
        ...params,
        title: finalTitle,
      });
      if (!result.success) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to create journal entry"
        );
        return this.error(result.error.message);
      }
      const domainEntry = JournalEntryMapper.toDomain(result.data);
      this.logger.info(
        { entryId: domainEntry.id, ...params },
        "Journal entry created successfully"
      );
      return this.success(domainEntry);
    } catch (error) {
      return this.handleError(error, "Failed to create journal entry");
    }
  }

  async findJournalEntryById(params: {
    entryId: string;
    userId: string;
  }): Promise<ServiceResult<JournalEntryDomain>> {
    try {
      this.logger.info(params, "Finding journal entry by ID");
      const result = await findJournalEntryById(params);
      if (!result.success) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to find journal entry"
        );
        return this.error(result.error.message);
      }
      const domainEntry = JournalEntryMapper.toDomain(result.data);
      this.logger.info({ ...params }, "Journal entry found successfully");
      return this.success(domainEntry);
    } catch (error) {
      return this.handleError(error, "Failed to find journal entry by ID");
    }
  }

  async findJournalEntriesByUserId(params: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<ServiceResult<JournalEntryDomain[]>> {
    try {
      const { userId, limit = 20, cursor } = params;

      this.logger.info(
        { userId, limit, cursor },
        "Finding journal entries for user"
      );

      const result = await findJournalEntriesByUserId({
        userId,
        limit,
        cursor,
      });

      if (!result.success) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to find journal entries for user"
        );
        return this.error(result.error.message);
      }

      const domainEntries = JournalEntryMapper.toDomainList(result.data);

      this.logger.info(
        { userId, count: domainEntries.length },
        "Journal entries found successfully"
      );

      return this.success(domainEntries);
    } catch (error) {
      return this.handleError(
        error,
        "Failed to find journal entries by user ID"
      );
    }
  }

  async updateJournalEntry(params: {
    userId: string;
    entryId: string;
    updates: {
      title?: string;
      content?: string;
      mood?: JournalMood | null;
      playSession?: number | null;
      libraryItemId?: number | null;
    };
  }): Promise<ServiceResult<JournalEntryDomain>> {
    try {
      const { userId, entryId, updates } = params;

      this.logger.info({ userId, entryId }, "Updating journal entry");

      const result = await updateJournalEntry({
        entryId,
        userId,
        updates,
      });

      if (!result.success) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to update journal entry"
        );
        return this.error(result.error.message);
      }

      const domainEntry = JournalEntryMapper.toDomain(result.data);

      this.logger.info(
        { userId, entryId },
        "Journal entry updated successfully"
      );

      return this.success(domainEntry);
    } catch (error) {
      return this.handleError(error, "Failed to update journal entry");
    }
  }

  async deleteJournalEntry(params: {
    userId: string;
    entryId: string;
  }): Promise<ServiceResult<void>> {
    try {
      const { userId, entryId } = params;

      this.logger.info({ userId, entryId }, "Deleting journal entry");

      const result = await deleteJournalEntry({ entryId, userId });

      if (!result.success) {
        this.logger.error(
          { error: result.error, ...params },
          "Failed to delete journal entry"
        );
        return this.error(result.error.message);
      }

      this.logger.info(
        { userId, entryId },
        "Journal entry deleted successfully"
      );

      return this.success(undefined);
    } catch (error) {
      return this.handleError(error, "Failed to delete journal entry");
    }
  }
}
