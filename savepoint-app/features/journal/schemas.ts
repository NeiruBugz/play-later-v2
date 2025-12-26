import { JournalMood } from "@/data-access-layer/domain/journal";
import { z } from "zod";

import { MAX_CHARACTERS } from "@/shared/lib/rich-text";

export const CreateJournalEntrySchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  title: z.string().max(200).optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(
      MAX_CHARACTERS,
      `Content must not exceed ${MAX_CHARACTERS} characters`
    ),
  mood: z.enum(JournalMood).optional(),
  playSession: z.number().int().positive().optional(),
  libraryItemId: z.number().int().positive().optional(),
  timezone: z.string().optional(),
});

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;

export const UpdateJournalEntrySchema = z.object({
  entryId: z.string().min(1, "Entry ID is required"),
  title: z.string().max(200).optional(),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(MAX_CHARACTERS, `Content must not exceed ${MAX_CHARACTERS} characters`)
    .optional(),
  mood: z.enum(JournalMood).nullable().optional(),
  playSession: z
    .number()
    .int()
    .positive("Play session must be positive")
    .nullable()
    .optional(),
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
