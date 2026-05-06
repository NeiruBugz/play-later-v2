import { prisma } from "@/shared/lib/db";

import type { Prisma } from "../../../../shared/lib/prisma/client.ts";
import type { GetLibraryFilters, GetLibraryResult } from "../model/types";

export type {
  GetLibraryFilters,
  GetLibraryResult,
  LibraryItemWithGame,
} from "../model/types";

export async function getLibrary(
  userId: string,
  filters: GetLibraryFilters
): Promise<GetLibraryResult> {
  const { status, platform, minRating, sortBy, sortOrder = "desc" } = filters;

  const where: Prisma.LibraryItemWhereInput = {
    userId,
    ...(status && { status }),
    ...(platform && { platform }),
    ...(minRating !== undefined && { rating: { gte: minRating } }),
  };

  const orderBy: Prisma.LibraryItemOrderByWithRelationInput =
    sortBy === "title"
      ? { game: { title: sortOrder } }
      : sortBy === "createdAt"
        ? { createdAt: sortOrder }
        : { updatedAt: sortOrder };

  const [items, total] = await Promise.all([
    prisma.libraryItem.findMany({
      where,
      orderBy,
      include: {
        game: {
          select: {
            id: true,
            igdbId: true,
            title: true,
            slug: true,
            coverImage: true,
            releaseDate: true,
          },
        },
      },
    }),
    prisma.libraryItem.count({ where }),
  ]);

  return { items, total };
}
