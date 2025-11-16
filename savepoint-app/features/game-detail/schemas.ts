import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

/**
 * Schema for adding a game to the library
 * Uses IGDB ID because the frontend only has IGDB game data
 */
export const AddToLibrarySchema = z.object({
  igdbId: z.number().int().positive(),
  status: z.nativeEnum(LibraryItemStatus),
  platform: z.string().min(1, "Platform is required"),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

/**
 * Schema for updating library status (uses database game ID)
 */
export const UpdateLibraryStatusSchema = z.object({
  gameId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus),
});

/**
 * Schema for updating a library entry (uses library item ID)
 * Note: Platform is intentionally excluded as it cannot be changed after creation
 */
export const UpdateLibraryEntrySchema = z.object({
  libraryItemId: z.number().int().positive(),
  status: z.nativeEnum(LibraryItemStatus),
  startedAt: z.date().optional(),
  completedAt: z.date().optional(),
});

/**
 * Schema for updating library status by IGDB ID
 * Used by quick action buttons on game detail page
 */
export const UpdateLibraryStatusByIgdbSchema = z.object({
  igdbId: z.number().int().positive(),
  status: z.nativeEnum(LibraryItemStatus),
});

// Export TypeScript types
export type AddToLibraryInput = z.infer<typeof AddToLibrarySchema>;
export type UpdateLibraryStatusInput = z.infer<
  typeof UpdateLibraryStatusSchema
>;
export type UpdateLibraryEntryInput = z.infer<typeof UpdateLibraryEntrySchema>;
export type UpdateLibraryStatusByIgdbInput = z.infer<
  typeof UpdateLibraryStatusByIgdbSchema
>;
