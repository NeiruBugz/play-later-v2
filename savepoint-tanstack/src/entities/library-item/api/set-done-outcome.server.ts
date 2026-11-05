import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type {
  DoneOutcome,
  LibraryItem,
} from "../../../../shared/lib/prisma/client.ts";

export type SetDoneOutcomeResult = { item: LibraryItem };

export async function setDoneOutcome(
  userId: string,
  id: number,
  outcome: DoneOutcome | null
): Promise<SetDoneOutcomeResult> {
  const owned = await prisma.libraryItem.findFirst({
    where: { id, userId },
    select: { status: true },
  });
  if (!owned) {
    throw new NotFoundError("Library item not found", { itemId: id });
  }
  if (owned.status !== "DONE") {
    throw new ValidationError("Only a Done game has an outcome", {
      itemId: id,
    });
  }

  const item = await prisma.libraryItem.update({
    where: { id },
    data: { doneOutcome: outcome },
  });
  return { item };
}
