import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import {
  JOURNAL_ENTRY_GAME_SELECT,
  type JournalTimelineEntry,
} from "../model/types";

export type { JournalTimelineEntry } from "../model/types";

/**
 * Returns the single journal entry identified by `entryId`, scoped to
 * `userId`, with the related game projected down to
 * {id, title, slug, coverImage}.
 *
 * Privacy invariant (errors.md): throws `NotFoundError` for BOTH "entry does
 * not exist" AND "entry belongs to another user". The two cases are not
 * distinguished so callers can't enumerate other users' entry ids. This is
 * the read-path equivalent of the two-step ownership check used by the
 * update/delete entity queries — but those throw `UnauthorizedError` on
 * cross-user mutation, whereas a read must not leak existence at all.
 */
export async function getJournalEntryById(
  userId: string,
  entryId: string
): Promise<JournalTimelineEntry> {
  const entry = await prisma.journalEntry.findUnique({
    where: { id: entryId },
    include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
  });

  if (!entry || entry.userId !== userId) {
    throw new NotFoundError("Journal entry not found", { entryId });
  }

  return entry;
}
