import type {
  JournalEntry,
  LibraryItem,
  Playthrough,
} from "../../../../shared/lib/prisma/client.ts";

export type PlaythroughWithEntries = Playthrough & {
  journalEntries: JournalEntry[];
  libraryItem?: LibraryItem;
};
