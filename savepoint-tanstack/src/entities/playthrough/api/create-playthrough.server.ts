import { prisma } from "@/shared/lib/db.server";
import { NotFoundError, ValidationError } from "@/shared/lib/errors";

import type {
  Playthrough,
  PlaythroughKind,
  PlaythroughStatus,
} from "../../../../shared/lib/prisma/client.ts";
import { syncLibraryStatusFromRuns } from "./sync-library-status.server";

export type CreatePlaythroughInput = {
  libraryItemId: number;
  kind?: PlaythroughKind;
  platform?: string | null;
  status: PlaythroughStatus;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  playtimeMinutes?: number;
  rating?: number | null;
  completion?: string | null;
  notes?: string | null;
};

/**
 * Creates a new playthrough for the given library item.
 *
 * Ownership two-step: `findUnique` + userId check → `NotFoundError` for
 * missing-or-not-yours (anti-enumeration).
 *
 * Kind coercion (server-enforced):
 * - Zero existing runs → `kind = FIRST`, `ordinal = 1`.
 * - One or more existing runs → `kind = REPLAY`, `ordinal = max + 1`.
 *   A caller passing `FIRST` on a subsequent run gets silently coerced to
 *   `REPLAY`.
 *
 * Status sync (`syncLibraryStatusFromRuns`) runs in the same transaction
 * so `LibraryItem.status` + `hasBeenPlayed` are never stale.
 */
export async function createPlaythrough(
  userId: string,
  input: CreatePlaythroughInput
): Promise<Playthrough> {
  if (
    input.rating !== undefined &&
    input.rating !== null &&
    (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 10)
  ) {
    throw new ValidationError("Rating must be an integer between 1 and 10", {
      rating: input.rating,
    });
  }

  const item = await prisma.libraryItem.findUnique({
    where: { id: input.libraryItemId },
  });

  if (!item || item.userId !== userId) {
    throw new NotFoundError("Library item not found", {
      libraryItemId: input.libraryItemId,
    });
  }

  return prisma.$transaction(async (tx) => {
    const existing = await tx.playthrough.findMany({
      where: { libraryItemId: input.libraryItemId },
      select: { ordinal: true },
    });

    const isFirst = existing.length === 0;
    const maxOrdinal = isFirst
      ? 0
      : Math.max(...existing.map((r) => r.ordinal));
    const ordinal = maxOrdinal + 1;
    const kind: PlaythroughKind = isFirst ? "FIRST" : "REPLAY";

    const run = await tx.playthrough.create({
      data: {
        libraryItemId: input.libraryItemId,
        ordinal,
        kind,
        status: input.status,
        platform: input.platform ?? null,
        startedAt: input.startedAt ?? null,
        finishedAt: input.finishedAt ?? null,
        playtimeMinutes: input.playtimeMinutes ?? 0,
        rating: input.rating ?? null,
        completion: input.completion ?? null,
        notes: input.notes ?? null,
      },
    });

    await syncLibraryStatusFromRuns(tx, input.libraryItemId);

    return run;
  });
}
