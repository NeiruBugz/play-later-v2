import { prisma } from "@/shared/lib/db.server";

import {
  JOURNAL_ENTRY_GAME_SELECT,
  type JournalTimelineEntry,
} from "../model/types";

export type { JournalTimelineEntry } from "../model/types";

/**
 * Returns every journal entry owned by `userId`, newest first, with the
 * related game projected down to {id, title, slug, coverImage}.
 *
 * Empty result (no user, no entries) returns []; never throws.
 */
export async function getJournalTimeline(
  userId: string
): Promise<JournalTimelineEntry[]> {
  return prisma.journalEntry.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
  });
}

/**
 * Returns every journal entry owned by `userId` for the given `gameId`,
 * newest first. Ownership is enforced at the query level so another user's
 * entries for the same game are never returned. Empty result returns [].
 */
export async function getJournalEntriesForGame(
  userId: string,
  gameId: string
): Promise<JournalTimelineEntry[]> {
  return prisma.journalEntry.findMany({
    where: { userId, gameId },
    orderBy: { updatedAt: "desc" },
    include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
  });
}
