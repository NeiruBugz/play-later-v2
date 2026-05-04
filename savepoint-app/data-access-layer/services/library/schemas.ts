import { LibraryItemStatus } from "@prisma/client";
import { z } from "zod";

export const LibrarySortBySchema = z.enum([
  "updatedAt",
  "createdAt",
  "releaseDate",
  "startedAt",
  "completedAt",
  "title",
  "rating-desc",
  "rating-asc",
]);

export const LibrarySortOrderSchema = z.enum(["asc", "desc"]);

export const GetLibraryItemsBaseSchema = z.object({
  userId: z.string().min(1),
  status: z.nativeEnum(LibraryItemStatus).optional(),
  platform: z.string().optional(),
  search: z.string().optional(),
  sortBy: LibrarySortBySchema.optional(),
  sortOrder: LibrarySortOrderSchema.optional(),
  minRating: z.number().int().min(1).max(10).optional(),
  unratedOnly: z.boolean().optional(),
  offset: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(100).optional(),
});

export const GetLibraryItemsServiceSchema = GetLibraryItemsBaseSchema.extend({
  distinctByGame: z.boolean().optional(),
});

export const GetStatusCountsSchema = z.object({
  userId: z.string().min(1),
  platform: z.string().optional(),
  search: z.string().optional(),
});

export const DeleteLibraryItemSchema = z.object({
  libraryItemId: z.number().int().positive(),
  userId: z.string().min(1),
});

export const SetRatingSchema = z.object({
  libraryItemId: z.number().int().positive(),
  userId: z.string(),
  rating: z.number().int().min(1).max(10).nullable(),
});
