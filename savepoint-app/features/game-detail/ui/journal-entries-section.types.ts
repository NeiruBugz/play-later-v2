import type { JournalEntry } from "@prisma/client";

export interface JournalEntriesSectionProps {
  journalEntries: JournalEntry[];
}

export interface JournalEntryCardProps {
  entry: JournalEntry;
}
