import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";
import { mapP2025ToNotFound } from "@/shared/lib/prisma";

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
    mapP2025ToNotFound(error, "Journal entry not found", { entryId });
  }
}
