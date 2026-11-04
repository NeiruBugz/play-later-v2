import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

export const RATING_MIN = 1;
export const RATING_MAX = 10;

export type SetRatingResult = { item: LibraryItem };

export async function setRating(
  userId: string,
  id: number,
  rating: number | null
): Promise<SetRatingResult> {
  if (
    rating !== null &&
    (!Number.isInteger(rating) || rating < RATING_MIN || rating > RATING_MAX)
  ) {
    throw new ValidationError("Rating must be between 1 and 10", {
      itemId: id,
    });
  }

  const owned = await prisma.libraryItem.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Library item not found", { itemId: id });
  }

  const item = await prisma.libraryItem.update({
    where: { id },
    data: { rating },
  });
  return { item };
}
