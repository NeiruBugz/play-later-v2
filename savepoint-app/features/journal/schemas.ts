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

export const UpdateJournalEntrySchema = z.object({
  entryId: z.string().min(1, "Entry ID is required"),
  title: z.string().min(1, "Title cannot be empty").optional(),
  content: z.string().min(1, "Content cannot be empty").optional(),
  mood: z.nativeEnum(JournalMood).nullable().optional(),
  playSession: z.number().int().positive("Play session must be positive").nullable().optional(),
  libraryItemId: z
    .number()
    .int()
    .positive("Library item ID must be positive")
    .nullable()
    .optional(),
});

export type UpdateJournalEntryInput = z.infer<typeof UpdateJournalEntrySchema>;

export const DeleteJournalEntrySchema = z.object({
  entryId: z.string().min(1, "Entry ID is required"),
});

export type DeleteJournalEntryInput = z.infer<typeof DeleteJournalEntrySchema>;

