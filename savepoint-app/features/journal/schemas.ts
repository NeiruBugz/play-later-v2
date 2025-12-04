import { z } from "zod";

import { JournalMood } from "@/data-access-layer/domain/journal";

export const CreateJournalEntrySchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  title: z.string().min(1, "Title is required"),
  content: z.string().min(1, "Content is required"),
  mood: z.nativeEnum(JournalMood).optional(),
  playSession: z.number().int().positive().optional(),
  libraryItemId: z.number().int().positive().optional(),
});

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;

