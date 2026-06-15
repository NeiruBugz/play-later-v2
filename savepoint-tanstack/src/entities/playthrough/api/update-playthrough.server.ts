import { prisma } from "@/shared/lib/db.server";
import {
  ConflictError,
  NotFoundError,
  ValidationError,
} from "@/shared/lib/errors";

import type {
  Playthrough,
  PlaythroughKind,
  PlaythroughStatus,
} from "../../../../shared/lib/prisma/client.ts";
import { syncLibraryStatusFromRuns } from "./sync-library-status.server";

export type UpdatePlaythroughInput = {
  id: string;
  ordinal?: number;
  kind?: PlaythroughKind;
  platform?: string | null;
  status?: PlaythroughStatus;
  startedAt?: Date | null;
  finishedAt?: Date | null;
  playtimeMinutes?: number;
  rating?: number | null;
  completion?: string | null;
  notes?: string | null;
};

function isOrdinalUniqueConflict(error: unknown): boolean {
  if (
    typeof error !== "object" ||
    error === null ||
    !("code" in error) ||
    (error as { code: unknown }).code !== "P2002"
  ) {
    return false;
  }
  const meta = (error as { meta?: unknown }).meta;
  if (typeof meta !== "object" || meta === null || !("target" in meta)) {
    return false;
  }
  const target = (meta as { target: unknown }).target;
  return (
    Array.isArray(target) &&
    (target as string[]).includes("ordinal") &&
    (target as string[]).includes("libraryItemId")
  );
}

/**
 * Partially updates a playthrough by id.
 *
 * Ownership two-step (inside the transaction): loads the run with its
 * `libraryItem.userId`, then checks against `userId`. Both "missing" and
 * "not-yours" produce `NotFoundError` (anti-enumeration).
 *
 * Runs inside a `$transaction` alongside `syncLibraryStatusFromRuns` so
 * `LibraryItem.status` + `hasBeenPlayed` never drift after a status change.
 *
 * This is the single seam that maps the `@@unique([libraryItemId, ordinal])`
 * constraint to `ConflictError`. No other file maps it.
 */
export async function updatePlaythrough(
  userId: string,
  input: UpdatePlaythroughInput
): Promise<Playthrough> {
  const { id, ...fields } = input;

  if (
    fields.rating !== undefined &&
    fields.rating !== null &&
    (!Number.isInteger(fields.rating) ||
      fields.rating < 1 ||
      fields.rating > 10)
  ) {
    throw new ValidationError("Rating must be an integer between 1 and 10", {
      rating: fields.rating,
    });
  }

  try {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.playthrough.findUnique({
        where: { id },
        select: {
          id: true,
          libraryItem: { select: { id: true, userId: true } },
        },
      });

      if (!existing || existing.libraryItem.userId !== userId) {
        throw new NotFoundError("Playthrough not found", { id });
      }

      const libraryItemId = existing.libraryItem.id;

      const updated = await tx.playthrough.update({
        where: { id },
        data: {
          ...(fields.ordinal !== undefined && { ordinal: fields.ordinal }),
          ...(fields.kind !== undefined && { kind: fields.kind }),
          ...(fields.platform !== undefined && { platform: fields.platform }),
          ...(fields.status !== undefined && { status: fields.status }),
          ...(fields.startedAt !== undefined && {
            startedAt: fields.startedAt,
          }),
          ...(fields.finishedAt !== undefined && {
            finishedAt: fields.finishedAt,
          }),
          ...(fields.playtimeMinutes !== undefined && {
            playtimeMinutes: fields.playtimeMinutes,
          }),
          ...(fields.rating !== undefined && { rating: fields.rating }),
          ...(fields.completion !== undefined && {
            completion: fields.completion,
          }),
          ...(fields.notes !== undefined && { notes: fields.notes }),
        },
      });

      await syncLibraryStatusFromRuns(tx, libraryItemId);

      return updated;
    });
  } catch (error) {
    if (error instanceof NotFoundError) throw error;
    if (isOrdinalUniqueConflict(error)) {
      throw new ConflictError(
        "A playthrough with this ordinal already exists for this library item",
        { id }
      );
    }
    throw error;
  }
}
