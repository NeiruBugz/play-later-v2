import { z } from "zod";

import { LibraryItemStatus } from "@/shared/types";

export const AddToLibrarySchema = z.object({
  igdbId: z.number().int().positive(),
  status: z.enum(LibraryItemStatus),
  platform: z.string().min(1, "Platform is required"),
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
});

export const UpdateLibraryStatusByIgdbSchema = z.object({
  igdbId: z.number().int().positive(),
  status: z.enum(LibraryItemStatus),
});

export type AddToLibraryInput = z.infer<typeof AddToLibrarySchema>;
export type UpdateLibraryStatusInput = z.infer<
  typeof UpdateLibraryStatusSchema
>;
export type UpdateLibraryEntryInput = z.infer<typeof UpdateLibraryEntrySchema>;
export type UpdateLibraryStatusByIgdbInput = z.infer<
  typeof UpdateLibraryStatusByIgdbSchema
>;
