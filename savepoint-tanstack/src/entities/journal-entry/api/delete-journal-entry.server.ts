import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";

export async function deleteJournalEntry(
  userId: string,
  entryId: string
): Promise<void> {
  const existing = await prisma.journalEntry.findUnique({
    where: { id: entryId },
  });

  if (!existing) {
    throw new NotFoundError("Journal entry not found", { entryId });
  }

  if (existing.userId !== userId) {
    throw new UnauthorizedError("Not the owner of this journal entry", {
      entryId,
    });
  }

  try {
    await prisma.journalEntry.delete({
      where: { id: entryId },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Journal entry not found", { entryId });
    }
    throw error;
  }
}
