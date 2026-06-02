import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

import {
  Prisma,
  type LibraryItem,
  type LibraryItemStatus,
} from "../../../../shared/lib/prisma/client.ts";

export type UpdateLibraryItemInput = {
  status?: LibraryItemStatus;
  rating?: number | null;
  platform?: string | null;
  startedAt?: Date | null;
  completedAt?: Date | null;
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
  if (input.status !== undefined) data.status = input.status;
  if (input.rating !== undefined) data.rating = input.rating;
  if (input.platform !== undefined) data.platform = input.platform;
  if (input.startedAt !== undefined) data.startedAt = input.startedAt;
  if (input.completedAt !== undefined) data.completedAt = input.completedAt;

  try {
    return await prisma.libraryItem.update({
      where: { id: itemId },
      data,
    });
  } catch (error) {
    mapP2025ToNotFound(error, "Library item not found", { itemId });
  }
}
