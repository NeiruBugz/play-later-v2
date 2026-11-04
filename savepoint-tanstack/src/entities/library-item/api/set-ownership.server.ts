import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import type { LibraryItem } from "../../../../shared/lib/prisma/client.ts";

export type SetOwnershipResult = { item: LibraryItem };

export async function setOwnership(
  userId: string,
  id: number,
  isOwned: boolean
): Promise<SetOwnershipResult> {
  const owned = await prisma.libraryItem.findFirst({
    where: { id, userId },
    select: { id: true },
  });
  if (!owned) {
    throw new NotFoundError("Library item not found", { itemId: id });
  }

  const item = await prisma.libraryItem.update({
    where: { id },
    data: { isOwned },
  });
  return { item };
}
