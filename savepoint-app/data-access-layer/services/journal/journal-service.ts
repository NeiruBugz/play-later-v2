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

export class JournalService {
  async findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }): Promise<JournalEntry[]> {
    return findJournalEntriesByGameId(params);
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
  }): Promise<JournalEntry> {
    const finalTitle =
      params.title?.trim() || this.generateAutoTitle(params.timezone);

    return createJournalEntry({
      ...params,
      title: finalTitle,
    });
  }

  async findJournalEntryById(params: {
    entryId: string;
    userId: string;
  }): Promise<JournalEntry> {
    return findJournalEntryById(params);
  }

  async findJournalEntriesByUserId(params: {
    userId: string;
    limit?: number;
    cursor?: string;
  }): Promise<JournalEntry[]> {
    const { userId, limit = 20, cursor } = params;
    return findJournalEntriesByUserId({ userId, limit, cursor });
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
  }): Promise<JournalEntry> {
    const { userId, entryId, updates } = params;
    return updateJournalEntry({ entryId, userId, updates });
  }

  async getLatestEntryDatePerGame(
    userId: string,
    gameIds: string[]
  ): Promise<Map<string, Date>> {
    return findLatestJournalDateByGameId({ userId, gameIds });
  }

  async deleteJournalEntry(params: {
    userId: string;
    entryId: string;
  }): Promise<void> {
    const { userId, entryId } = params;
    await deleteJournalEntry({ entryId, userId });
  }
}
