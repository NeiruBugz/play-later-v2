/**
 * deleteLibraryItem — remove a single LibraryItem owned by `userId`.
 *
 * Behavior locked by integration test:
 * `test/integration/delete-library-item.integration.test.ts`.
 *
 *   1. Two-step existence-then-ownership check (deliberately diverges from
 *      canonical savepoint-app, which collapses both into a single
 *      `findFirst({ where: { id, userId } })` + NotFoundError):
 *        a. `findUnique({ where: { id: itemId } })` → if null, throw
 *           `NotFoundError`.
 *        b. If `item.userId !== userId`, throw `UnauthorizedError`.
 *        c. Otherwise, proceed with the delete.
 *
 *   2. Returns `Promise<void>` — the deleted row is intentionally NOT
 *      returned. Callers that need pre-delete state must read it first.
 *
 *   3. P2025 translation — if a concurrent delete races between the
 *      existence check and the delete call, Prisma raises
 *      `PrismaClientKnownRequestError` with `code === "P2025"`. We re-throw
 *      that as `NotFoundError`. No other Prisma error codes are caught.
 *
 *   4. Cascade is schema-driven — `JournalEntry.libraryItemId` has
 *      `onDelete: SetNull` in the Prisma schema. No application logic is
 *      needed to nullify journal entries; the DB handles it.
 */
import { prisma } from "@/shared/lib/db";
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
