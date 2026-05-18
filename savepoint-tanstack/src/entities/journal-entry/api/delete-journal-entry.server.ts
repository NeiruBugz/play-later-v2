/**
 * deleteJournalEntry — remove a single JournalEntry owned by `userId`.
 *
 * Behavior locked by integration test:
 * `test/integration/delete-journal-entry.integration.test.ts`.
 *
 *   1. Two-step existence-then-ownership check (mirrors `deleteLibraryItem`
 *      and `updateJournalEntry`):
 *        a. `findUnique({ where: { id: entryId } })` → if null, throw
 *           `NotFoundError`.
 *        b. If `entry.userId !== userId`, throw `UnauthorizedError`.
 *        c. Otherwise, proceed with the delete.
 *
 *   2. Returns `Promise<void>` — the deleted row is intentionally NOT
 *      returned. Callers that need pre-delete state must read it first.
 *
 *   3. Not idempotent. A second delete of the same entryId throws
 *      `NotFoundError` (the existence check fails on the second call).
 *
 *   4. P2025 translation — if a concurrent delete races between the
 *      existence check and the delete call, Prisma raises P2025; we
 *      re-throw as `NotFoundError`.
 *
 *   5. No cascade considerations — JournalEntry has no children that
 *      cascade. (LibraryItem cascades the OTHER direction via SetNull on
 *      `JournalEntry.libraryItemId`.)
 */
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
