import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

export async function getLibraryItemGameId(
  userId: string,
  id: number
): Promise<string> {
  const item = await prisma.libraryItem.findFirst({
    where: { id, userId },
    select: { gameId: true },
  });
  if (!item) {
    throw new NotFoundError("Library item not found", { itemId: id });
  }
  return item.gameId;
}
