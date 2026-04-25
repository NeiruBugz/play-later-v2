import { z } from "zod";

import { LibraryItemStatus } from "@/shared/types";

const BaseIgdbStatusSchema = z.object({
  igdbId: z.number().int().positive(),
  status: z.enum(LibraryItemStatus),
});

export const AddToLibrarySchema = BaseIgdbStatusSchema.extend({
  platform: z.string().optional(),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

export const UpdateLibraryStatusSchema = z.object({
  gameId: z.cuid(),
  status: z.enum(LibraryItemStatus),
});

export const UpdateLibraryEntrySchema = z.object({
  libraryItemId: z.number().int().positive(),
  status: z.enum(LibraryItemStatus),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
  platform: z.string().nullable().optional(),
});

export const UpdateLibraryStatusByIgdbSchema = BaseIgdbStatusSchema;

export const GetLibraryStatusForGamesSchema = z.object({
  igdbIds: z.array(z.number().int().positive()).min(1).max(100),
});

export const QuickAddToLibrarySchema = z.object({
  igdbId: z.number().int().positive(),
  status: z.enum(LibraryItemStatus).optional(),
});

export const SetLibraryRatingSchema = z.object({
  libraryItemId: z.number().int().positive(),
  rating: z.number().int().min(1).max(10).nullable(),
});

export type AddToLibraryInput = z.infer<typeof AddToLibrarySchema>;
export type UpdateLibraryStatusInput = z.infer<
  typeof UpdateLibraryStatusSchema
>;
export type UpdateLibraryEntryInput = z.infer<typeof UpdateLibraryEntrySchema>;
export type UpdateLibraryStatusByIgdbInput = z.infer<
  typeof UpdateLibraryStatusByIgdbSchema
>;
export type GetLibraryStatusForGamesInput = z.infer<
  typeof GetLibraryStatusForGamesSchema
>;
export type QuickAddToLibraryInput = z.infer<typeof QuickAddToLibrarySchema>;
export type SetLibraryRatingInput = z.infer<typeof SetLibraryRatingSchema>;
