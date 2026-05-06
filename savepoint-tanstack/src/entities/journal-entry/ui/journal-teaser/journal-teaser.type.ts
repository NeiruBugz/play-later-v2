import type { JournalEntry } from "../../../../../shared/lib/prisma/client.ts";

export type JournalTeaserProps = {
  entries: JournalEntry[];
};
