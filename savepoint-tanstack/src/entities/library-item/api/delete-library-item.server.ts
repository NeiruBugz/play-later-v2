import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

export async function deleteLibraryItem(
  userId: string,
  itemId: number
): Promise<void> {
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

  try {
    await prisma.libraryItem.delete({
      where: { id: itemId },
    });
  } catch (error) {
    mapP2025ToNotFound(error, "Library item not found", { itemId });
  }
}
