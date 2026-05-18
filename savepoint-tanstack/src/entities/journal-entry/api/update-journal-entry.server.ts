/**
 * updateJournalEntry — partial-update mutation for a single JournalEntry.
 *
 * Behavior locked by integration test:
 * `test/integration/update-journal-entry.integration.test.ts`.
 *
 *   1. Two-step existence-then-ownership check (mirrors `updateLibraryItem`):
 *        a. `findUnique({ where: { id: entryId } })` → if null, throw
 *           `NotFoundError`.
 *        b. If `entry.userId !== userId`, throw `UnauthorizedError`.
 *        c. Otherwise, proceed with the update.
 *      NotFoundError is always thrown BEFORE UnauthorizedError — a missing
 *      entry yields NotFoundError regardless of which userId is supplied.
 *
 *   2. Direct passthrough — only keys explicitly present in `input` are
 *      forwarded to Prisma. `gameId: undefined` leaves the existing FK
 *      untouched; `gameId: null` clears the association. Empty `{}` is
 *      accepted and runs `update({ data: {} })` — Prisma's `@updatedAt`
 *      still bumps the timestamp, which the contract permits.
 *
 *   3. P2003 translation — if `gameId` references a non-existent Game,
 *      Prisma raises `PrismaClientKnownRequestError` with `code === "P2003"`.
 *      We narrow on `error.meta?.field_name` / `constraint` and re-throw as
 *      `NotFoundError`. Same single-seam rule as `createJournalEntry`.
 *
 *   4. P2025 translation — if a concurrent delete races between the
 *      existence check and the update, Prisma raises P2025. We re-throw as
 *      `NotFoundError`.
 *
 *   5. Returns `JournalTimelineEntry` — same shape as `getJournalTimeline`
 *      so callers can render the result without a second fetch.
 */
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, UnauthorizedError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import {
  JOURNAL_ENTRY_GAME_SELECT,
  type JournalTimelineEntry,
} from "../model/types";

export type UpdateJournalEntryInput = {
  content?: string;
  kind?: "QUICK" | "REFLECTION";
  gameId?: string | null;
};

export async function updateJournalEntry(
  userId: string,
  entryId: string,
  input: UpdateJournalEntryInput
): Promise<JournalTimelineEntry> {
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

  const data: Prisma.JournalEntryUncheckedUpdateInput = {};
  if (input.content !== undefined) data.content = input.content;
  if (input.kind !== undefined) data.kind = input.kind;
  if (input.gameId !== undefined) data.gameId = input.gameId;

  try {
    return await prisma.journalEntry.update({
      where: { id: entryId },
      data,
      include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
    });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        throw new NotFoundError("Journal entry not found", { entryId });
      }
      if (error.code === "P2003") {
        // See `createJournalEntry` for the meta-probe rationale. Prisma 7's
        // driver-adapter shape puts the constraint name deeper in `meta`.
        const probe = JSON.stringify(error.meta ?? {}).toLowerCase();

        if (probe.includes("game")) {
          throw new NotFoundError("Referenced game does not exist", {
            gameId: input.gameId ?? null,
          });
        }
      }
    }
    throw error;
  }
}
