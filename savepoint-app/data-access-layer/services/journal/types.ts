import type { JournalEntry } from "@prisma/client";
import type { ServiceResult } from "../types";

export type FindJournalEntriesResult = ServiceResult<JournalEntry[]>;

export interface JournalService {
  findJournalEntriesByGameId(params: {
    userId: string;
    gameId: string;
    limit?: number;
  }): Promise<FindJournalEntriesResult>;
}
