import "server-only";

import {
  createJournalEntry,
  deleteJournalEntry,
  findJournalEntriesByGameId,
  findJournalEntriesByUserId,
  findJournalEntryById,
  findLatestJournalDateByGameId,
  updateJournalEntry,
} from "@/data-access-layer/repository";
import {
  JournalEntryKind,
  JournalMood,
  type JournalEntry,
} from "@prisma/client";

import {
  handleServiceError,
  serviceSuccess,
  type ServiceResult,
} from "../types";

export class JournalService {
  async findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }) {
    try {
      const data = await findJournalEntriesByGameId(params);
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(
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
    kind?: JournalEntryKind;
    title?: string;
    content: string;
    playedMinutes?: number;
    tags?: string[];
    mood?: JournalMood;
    playSession?: number;
    libraryItemId?: number;
    timezone?: string;
  }): Promise<ServiceResult<JournalEntry>> {
    try {
      const finalTitle =
        params.title?.trim() || this.generateAutoTitle(params.timezone);

      const data = await createJournalEntry({
        ...params,
        title: finalTitle,
      });
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to create journal entry");
    }
  }

  async findJournalEntryById(params: {
    entryId: string;
    userId: string;
  }): Promise<ServiceResult<JournalEntry>> {
    try {
      const data = await findJournalEntryById(params);
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to find journal entry by ID");
    }
  }

  async findJournalEntriesByUserId(params: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<ServiceResult<JournalEntry[]>> {
    try {
      const { userId, limit = 20, cursor } = params;

      const data = await findJournalEntriesByUserId({
        userId,
        limit,
        cursor,
      });

      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(
        error,
        "Failed to find journal entries by user ID"
      );
    }
  }

  async updateJournalEntry(params: {
    userId: string;
    entryId: string;
    updates: {
      kind?: JournalEntryKind;
      title?: string;
      content?: string;
      playedMinutes?: number | null;
      tags?: string[];
      mood?: JournalMood | null;
      playSession?: number | null;
      libraryItemId?: number | null;
    };
  }): Promise<ServiceResult<JournalEntry>> {
    try {
      const { userId, entryId, updates } = params;

      const data = await updateJournalEntry({
        entryId,
        userId,
        updates,
      });

      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(error, "Failed to update journal entry");
    }
  }

  async getLatestEntryDatePerGame(
    userId: string,
    gameIds: string[]
  ): Promise<ServiceResult<Map<string, Date>>> {
    try {
      const data = await findLatestJournalDateByGameId({ userId, gameIds });
      return serviceSuccess(data);
    } catch (error) {
      return handleServiceError(
        error,
        "Failed to get latest journal entry dates per game"
      );
    }
  }

  async deleteJournalEntry(params: {
    userId: string;
    entryId: string;
  }): Promise<ServiceResult<void>> {
    try {
      const { userId, entryId } = params;

      await deleteJournalEntry({ entryId, userId });

      return serviceSuccess(undefined);
    } catch (error) {
      return handleServiceError(error, "Failed to delete journal entry");
    }
  }
}
