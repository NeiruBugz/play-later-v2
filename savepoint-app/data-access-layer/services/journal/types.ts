import type { JournalEntryDomain } from "@/features/journal/types";

export type FindJournalEntriesResult = JournalEntryDomain[];

export interface JournalServiceContract {
  findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }): Promise<FindJournalEntriesResult>;
}
