import { z } from "zod";

import { MAX_CHARACTERS } from "@/shared/lib/rich-text";
import { JournalEntryKind, JournalMood } from "@/shared/types/journal";

const MAX_TAG_LENGTH = 30;
const MAX_TAGS_PER_ENTRY = 10;
const MAX_PLAYED_MINUTES = 60 * 24 * 7; // one week sanity bound

const tagsSchema = z
  .array(z.string().min(1).max(MAX_TAG_LENGTH))
  .max(MAX_TAGS_PER_ENTRY)
  .optional();

const playedMinutesSchema = z
  .number()
  .int()
  .positive("Played minutes must be positive")
  .max(MAX_PLAYED_MINUTES)
  .optional();

export const CreateJournalEntrySchema = z.object({
  gameId: z.string().min(1, "Game ID is required"),
  kind: z.enum(JournalEntryKind).optional(),
  title: z.string().max(200).optional(),
  content: z
    .string()
    .min(1, "Content is required")
    .max(
      MAX_CHARACTERS,
      `Content must not exceed ${MAX_CHARACTERS} characters`
    ),
  playedMinutes: playedMinutesSchema,
  tags: tagsSchema,
  mood: z.enum(JournalMood).optional(),
  playSession: z.number().int().positive().optional(),
  libraryItemId: z.number().int().positive().optional(),
  timezone: z.string().optional(),
});

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;

export const UpdateJournalEntrySchema = z.object({
  entryId: z.string().min(1, "Entry ID is required"),
  kind: z.enum(JournalEntryKind).optional(),
  title: z.string().max(200).optional(),
  content: z
    .string()
    .min(1, "Content cannot be empty")
    .max(MAX_CHARACTERS, `Content must not exceed ${MAX_CHARACTERS} characters`)
    .optional(),
  playedMinutes: playedMinutesSchema.or(z.null()),
  tags: tagsSchema,
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
