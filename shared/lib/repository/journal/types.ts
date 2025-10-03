import type { JournalMood, JournalVisibility, Prisma } from "@prisma/client";

export type CreateJournalEntryInput = {
  userId: string;
  gameId: string;
  libraryItemId?: number;
  title?: string;
  content: string;
  mood?: JournalMood;
  playSession?: number;
  visibility?: JournalVisibility;
};

export type UpdateJournalEntryInput = {
  id: string;
  userId: string; // For authorization check
  title?: string;
  content?: string;
  mood?: JournalMood;
  playSession?: number;
  visibility?: JournalVisibility;
};

export type GetJournalEntriesInput = {
  userId?: string;
  gameId?: string;
  visibility?: JournalVisibility;
  limit?: number;
  offset?: number;
};

export type JournalEntryWithRelations = Prisma.JournalEntryGetPayload<{
  include: {
    game: true;
    libraryItem: true;
    user: true;
  };
}>;
