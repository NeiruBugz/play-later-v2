import { type JournalEntry } from "@prisma/client";

import { getTestDatabase } from "../database";

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
export const createJournalEntry = async (
  options: JournalEntryFactoryOptions
): Promise<JournalEntry> => {
  const timestamp = Date.now();
  const defaultData = {
    title: null,
    content: `Test journal entry created at ${timestamp}`,
    mood: null,
    playSession: null,
    visibility: "PRIVATE" as const,
    publishedAt: null,
    ...options,
  };
  return getTestDatabase().journalEntry.create({
    data: defaultData,
  });
};
