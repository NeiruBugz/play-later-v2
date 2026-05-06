import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { getLibrary, type GetLibraryResult } from "@/entities/library-item/api";
import { requireUserId } from "@/entities/session/api/require-user-id";

const libraryStatusSchema = z.enum([
  "PLAYING",
  "PLAYED",
  "UP_NEXT",
  "SHELF",
  "WISHLIST",
]);

const sortBySchema = z.enum(["title", "createdAt", "updatedAt"]);
const sortOrderSchema = z.enum(["asc", "desc"]);

const inputSchema = z.object({
  status: libraryStatusSchema.optional(),
  platform: z.string().min(1).optional(),
  minRating: z.number().int().min(1).max(10).optional(),
  sortBy: sortBySchema.optional(),
  sortOrder: sortOrderSchema.optional(),
});

export type GetLibraryPageDataInput = z.infer<typeof inputSchema>;

export const getLibraryPageDataFn = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => inputSchema.parse(input))
  .handler(async ({ data }): Promise<GetLibraryResult> => {
    const filters = inputSchema.parse(data);
    const userId = await requireUserId();
    return getLibrary(userId, filters);
  });
