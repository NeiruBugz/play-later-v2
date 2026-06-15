import { createPlaythrough } from "@/entities/playthrough/api/create-playthrough.server";
import { UnauthorizedError } from "@/shared/lib/errors";

import type { Playthrough } from "../../../../shared/lib/prisma/client.ts";
import { playthroughFormSchema } from "../model/playthrough-form.schema";

export const CREATE_PLAYTHROUGH_INPUT = playthroughFormSchema;

/**
 * Worker for createPlaythroughFn — plain async, no TanStack Start runtime
 * dependency. Integration tests import this directly (foot-gun #8).
 *
 * Responsibilities:
 * - Auth gate: throw UnauthorizedError if userId is undefined.
 * - Re-parse input with the same schema (validate-twice rule).
 * - Convert playtimeHours × 60 → playtimeMinutes.
 * - Delegate to the entity query createPlaythrough.
 */
export async function createPlaythroughWorker(
  userId: string | undefined,
  data: unknown
): Promise<Playthrough> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const parsed = CREATE_PLAYTHROUGH_INPUT.parse(data);
  const { playtimeHours, kind, ...rest } = parsed;

  return createPlaythrough(userId, {
    ...rest,
    kind: kind ?? undefined,
    playtimeMinutes: Math.round(playtimeHours * 60),
  });
}
