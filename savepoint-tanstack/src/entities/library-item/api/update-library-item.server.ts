import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

import {
  Prisma,
  type LibraryItem,
} from "../../../../shared/lib/prisma/client.ts";

export type UpdateLibraryItemInput = {
  rating?: number | null;
  platform?: string | null;
};

export async function updateLibraryItem(
  userId: string,
  itemId: number,
  input: UpdateLibraryItemInput
): Promise<LibraryItem> {
  const existing = await prisma.libraryItem.findUnique({
    where: { id: itemId },
  });

  if (!existing) {
    throw new NotFoundError("Library item not found", { itemId });
  }

  if (existing.userId !== userId) {
    throw new UnauthorizedError("Not the owner of this library item", {
      itemId,
    });
  }

  const data: Prisma.LibraryItemUpdateInput = {};
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.platform !== undefined) data.platform = input.platform;

  try {
    return await prisma.libraryItem.update({
      where: { id: itemId },
      data,
    });
  } catch (error) {
    mapP2025ToNotFound(error, "Library item not found", { itemId });
  }
}
