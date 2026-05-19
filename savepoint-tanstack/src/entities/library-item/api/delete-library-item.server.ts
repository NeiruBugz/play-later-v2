import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Library item not found", { itemId });
    }
    throw error;
  }
}
