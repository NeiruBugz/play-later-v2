import { LibraryItemStatus } from "@/data-access-layer/domain/library";
import { z } from "zod";

export const LibrarySortBySchema = z.enum([
  "createdAt",
  "releaseDate",
  "startedAt",
  "completedAt",
]);

export const LibrarySortOrderSchema = z.enum(["asc", "desc"]);

export const GetLibraryItemsBaseSchema = z.object({
  userId: z.string().cuid(),
  status: z.nativeEnum(LibraryItemStatus).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: LibrarySortBySchema.optional(),
  sortOrder: LibrarySortOrderSchema.optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const GetLibraryItemsServiceSchema = GetLibraryItemsBaseSchema.extend({
  distinctByGame: z.boolean().optional(),
});

export const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
  userId: z.string().cuid(),
});
