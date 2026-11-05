import { prisma } from "@/shared/lib/db.server";

import {
  JOURNAL_ENTRY_READ_ARGS,
  JOURNAL_NO_GAME_FILTER,
  type JournalGameFilter,
  type JournalTimelineEntry,
} from "../model/types";

export type { JournalTimelineEntry } from "../model/types";

export type JournalGameOption = { id: string; title: string };

/**
 * Returns the notes owned by `userId`, newest first by `createdAt`.
 * `gameId` narrows to one game; `"none"` narrows to notes without a game.
 *
 * Empty result (no user, no entries) returns []; never throws.
 */
export async function getJournalTimeline(
  userId: string,
  filter: { gameId?: JournalGameFilter } = {}
): Promise<JournalTimelineEntry[]> {
  const { gameId } = filter;
  return prisma.journalEntry.findMany({
    where: {
      userId,
      ...(gameId === undefined
        ? {}
        : { gameId: gameId === JOURNAL_NO_GAME_FILTER ? null : gameId }),
    },
    orderBy: { createdAt: "desc" },
    ...JOURNAL_ENTRY_READ_ARGS,
  });
}

/**
 * The Journal filter options: the user's games that have notes, by title.
 */
export async function getJournalGameOptions(
  userId: string
): Promise<JournalGameOption[]> {
  return prisma.game.findMany({
    where: { JournalEntry: { some: { userId } } },
    select: { id: true, title: true },
    orderBy: { title: "asc" },
  });
}
