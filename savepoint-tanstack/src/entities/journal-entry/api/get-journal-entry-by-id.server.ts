import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  JOURNAL_ENTRY_READ_ARGS,
  type JournalTimelineEntry,
} from "../model/types";

export type { JournalTimelineEntry } from "../model/types";

/**
 * Returns the single note identified by `entryId`, scoped to `userId`.
 *
 * Privacy invariant (errors.md): throws `NotFoundError` for BOTH "entry does
 * not exist" AND "entry belongs to another user". The two cases are not
 * distinguished so callers can't enumerate other users' entry ids.
 */
export async function getJournalEntryById(
  userId: string,
  entryId: string
): Promise<JournalTimelineEntry> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    ...JOURNAL_ENTRY_READ_ARGS,
  });

  if (!entry || entry.userId !== userId) {
    throw new NotFoundError("Journal entry not found", { entryId });
  }

  return entry;
}
