/**
 * createJournalEntry — create a single JournalEntry owned by `userId`.
 *
 * Behavior locked by integration test:
 * `test/integration/create-journal-entry.integration.test.ts`.
 *
 *   1. `userId` is a separate first argument — never read from the input
 *      struct. The feature server fn resolves it via `requireUserId()` and
 *      passes it here.
 *
 *   2. `kind` defaults to "QUICK" at the entity layer (the contract requires
 *      the returned row to reflect "QUICK" whether the entity or the Prisma
 *      `@default` set it — we don't rely on the schema default alone).
 *
 *   3. `gameId` is optional. Omitted or explicit `null` → no game association
 *      (returned `game` relation is `null`). Both spellings are supported.
 *
 *   4. P2003 translation — if `gameId` references a non-existent Game,
 *      Prisma raises `PrismaClientKnownRequestError` with `code === "P2003"`
 *      (foreign-key constraint violation). We narrow on `error.meta?.field_name`
 *      / `error.meta?.constraint` to confirm the violation is on a `game`
 *      column and re-throw as `NotFoundError`. Single-seam Prisma-error
 *      mapping rule (see `errors.md`).
 *
 *   5. Returns `JournalTimelineEntry` — the JournalEntry row with the `game`
 *      relation projected via `JOURNAL_ENTRY_GAME_SELECT`. Same shape as
 *      `getJournalTimeline` so callers never need a second fetch after a
 *      create.
 */
import { prisma } from "@/shared/lib/db.server";
import { NotFoundError } from "@/shared/lib/errors";

import { Prisma } from "../../../../shared/lib/prisma/client.ts";
import {
  JOURNAL_ENTRY_GAME_SELECT,
  type JournalTimelineEntry,
} from "../model/types";

export type CreateJournalEntryInput = {
  content: string;
  kind?: "QUICK" | "REFLECTION";
  gameId?: string | null;
};

export async function createJournalEntry(
  userId: string,
  input: CreateJournalEntryInput
): Promise<JournalTimelineEntry> {
  try {
    return await prisma.journalEntry.create({
      data: {
        userId,
        content: input.content,
        kind: input.kind ?? "QUICK",
        gameId: input.gameId ?? null,
      },
      include: { game: { select: JOURNAL_ENTRY_GAME_SELECT } },
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2003"
    ) {
      // FK violation. Narrow to the gameId column — never silently swallow
      // a FK violation on some other relation. The Prisma 7 driver-adapter
      // shape puts the constraint name under
      // `meta.driverAdapterError.cause.constraint.index`; older shapes use
      // `meta.field_name` / `meta.constraint`. Probe the entire meta blob
      // for "game" to cover both.
      const probe = JSON.stringify(error.meta ?? {}).toLowerCase();

      if (probe.includes("game")) {
        throw new NotFoundError("Referenced game does not exist", {
          gameId: input.gameId ?? null,
        });
      }
    }
    throw error;
  }
}
