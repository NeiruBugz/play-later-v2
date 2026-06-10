import type {
  JournalEntry,
  Playthrough,
} from "../../../../shared/lib/prisma/client.ts";

export type PlaythroughWithEntries = Playthrough & {
  journalEntries: JournalEntry[];
};
