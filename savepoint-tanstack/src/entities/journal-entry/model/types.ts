import type { Prisma } from "../../../../shared/lib/prisma/client.ts";

export const JOURNAL_ENTRY_GAME_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
} as const satisfies Prisma.GameSelect;

/**
 * A journal entry with its (optional) related game projected down to the
 * fields the timeline UI needs.
 */
export type JournalTimelineEntry = Prisma.JournalEntryGetPayload<{
  include: { game: { select: typeof JOURNAL_ENTRY_GAME_SELECT } };
}>;
