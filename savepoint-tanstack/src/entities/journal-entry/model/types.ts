import type { Prisma } from "../../../../shared/lib/prisma/client.ts";

export const JOURNAL_ENTRY_GAME_SELECT = {
  id: true,
  title: true,
  slug: true,
  coverImage: true,
} as const satisfies Prisma.GameSelect;

export const JOURNAL_ENTRY_OMIT = {
  kind: true,
  title: true,
  mood: true,
} as const satisfies Prisma.JournalEntryOmit;

export const JOURNAL_ENTRY_READ_ARGS = {
  omit: JOURNAL_ENTRY_OMIT,
  include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
} as const satisfies Prisma.JournalEntryDefaultArgs;

/**
 * A note with its (optional) related game projected down to the fields the
 * UI needs. Reads and mutations return this shape: kind, title and mood are
 * never exposed.
 */
export type JournalTimelineEntry = Prisma.JournalEntryGetPayload<
  typeof JOURNAL_ENTRY_READ_ARGS
>;

export const JOURNAL_NO_GAME_FILTER = "none";

export type JournalGameFilter = string | typeof JOURNAL_NO_GAME_FILTER;
