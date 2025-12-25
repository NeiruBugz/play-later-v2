import { type JournalEntry } from "@prisma/client";

import { getTestDatabase } from "../database";
import { faker, seedFaker } from "../faker";

export type JournalEntryFactoryOptions = {
  userId: string;
  gameId: string;
  libraryItemId?: number | null;
  title?: string | null;
  content?: string;
  mood?:
    | "EXCITED"
    | "RELAXED"
    | "FRUSTRATED"
    | "ACCOMPLISHED"
    | "CURIOUS"
    | "NOSTALGIC"
    | null;
  playSession?: number | null;
  visibility?: "PRIVATE" | "FRIENDS_ONLY" | "PUBLIC";
  publishedAt?: Date | null;
};

export const createJournalEntryData = (
  overrides: Partial<Omit<JournalEntryFactoryOptions, "userId" | "gameId">> = {}
) => {
  const timestamp = Date.now();

  return {
    title: overrides.title ?? null,
    content: overrides.content ?? `Test journal entry created at ${timestamp}`,
    mood: overrides.mood ?? null,
    playSession: overrides.playSession ?? null,
    visibility: overrides.visibility ?? ("PRIVATE" as const),
    publishedAt: overrides.publishedAt ?? null,
    libraryItemId: overrides.libraryItemId ?? null,
  };
};

export const createSeededJournalEntryData = (
  seed: number = 12345,
  overrides?: Partial<Omit<JournalEntryFactoryOptions, "userId" | "gameId">>
) => {
  seedFaker(seed);
  return createJournalEntryData(overrides);
};

export const createJournalEntry = async (
  options: JournalEntryFactoryOptions
): Promise<JournalEntry> => {
  const { userId, gameId, ...overrides } = options;
  const entryData = createJournalEntryData(overrides);

  return getTestDatabase().journalEntry.create({
    data: {
      ...entryData,
      userId,
      gameId,
    },
  });
};
