import { JournalMood } from "@/data-access-layer/domain/journal";
import { z } from "zod";

import {
  isContentEmpty,
  MAX_CHARACTERS,
  stripHtmlTags,
} from "@/shared/lib/rich-text";

export const CreateJournalEntrySchema = z
  .object({
    gameId: z.string().min(1, "Game ID is required"),
    title: z.string().min(1, "Title is required"),
    content: z.string().min(1, "Content is required"),
    mood: z.enum(JournalMood).optional(),
    playSession: z.number().int().positive().optional(),
    libraryItemId: z.number().int().positive().optional(),
  })
  .refine((data) => stripHtmlTags(data.content).length <= MAX_CHARACTERS, {
    message: `Content must not exceed ${MAX_CHARACTERS} characters`,
    path: ["content"],
  })
  .refine((data) => !isContentEmpty(data.content), {
    message: "Content cannot be empty",
    path: ["content"],
  });

export type CreateJournalEntryInput = z.infer<typeof CreateJournalEntrySchema>;

export const UpdateJournalEntrySchema = z
  .object({
    entryId: z.string().min(1, "Entry ID is required"),
    title: z.string().min(1, "Title cannot be empty").optional(),
    content: z.string().min(1, "Content cannot be empty").optional(),
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
  })
  .refine(
    (data) => {
      if (data.content === undefined) return true;
      return stripHtmlTags(data.content).length <= MAX_CHARACTERS;
    },
    {
      message: `Content must not exceed ${MAX_CHARACTERS} characters`,
      path: ["content"],
    }
  )
  .refine(
    (data) => {
      if (data.content === undefined) return true;
      return !isContentEmpty(data.content);
    },
    {
      message: "Content cannot be empty",
      path: ["content"],
    }
  );

export type UpdateJournalEntryInput = z.infer<typeof UpdateJournalEntrySchema>;

export const DeleteJournalEntrySchema = z.object({
  entryId: z.string().min(1, "Entry ID is required"),
});

export type DeleteJournalEntryInput = z.infer<typeof DeleteJournalEntrySchema>;
