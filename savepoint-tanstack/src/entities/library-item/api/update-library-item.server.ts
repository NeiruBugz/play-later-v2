/**
 * updateLibraryItem — partial-update mutation for a single LibraryItem.
 *
 * Behavior locked by integration test:
 * `test/integration/update-library-item.integration.test.ts`.
 *
 *   1. Two-step existence-then-ownership check (deliberately diverges from
 *      canonical savepoint-app, which collapses both into a single
 *      `findFirst({ where: { id, userId } })` + NotFoundError):
 *        a. `findUnique({ where: { id: itemId } })` → if null, throw
 *           `NotFoundError`.
 *        b. If `item.userId !== userId`, throw `UnauthorizedError`.
 *        c. Otherwise, proceed with the update.
 *      Rationale: distinguishing "missing" from "forbidden" lets the feature
 *      layer pick correct user-facing copy. The entity layer is already
 *      reachable only via authenticated server fns (`requireUserId()`), so
 *      revealing existence to authed callers is acceptable.
 *
 *   2. Direct passthrough — only keys explicitly present in `input` are
 *      forwarded to Prisma. `undefined` does NOT clear a field; explicit
 *      `null` DOES (for nullable columns). Empty `{}` is accepted and runs
 *      a no-op `update({ data: {} })` — Prisma's `@updatedAt` still bumps
 *      the timestamp, which the contract permits.
 *
 *   3. P2025 translation — if a concurrent delete races between the
 *      existence check and the update call, Prisma raises
 *      `PrismaClientKnownRequestError` with `code === "P2025"`. We re-throw
 *      that as `NotFoundError`. No other Prisma error codes are caught.
 */
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

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
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      throw new NotFoundError("Library item not found", { itemId });
    }
    throw error;
  }
}
