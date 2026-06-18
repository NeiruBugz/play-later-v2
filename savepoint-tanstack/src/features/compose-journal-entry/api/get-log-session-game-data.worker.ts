import { z } from "zod";

import { getPlaythroughsBySlug } from "@/entities/playthrough/api/get-playthroughs-by-slug.server";
import type { PlaythroughWithEntries } from "@/entities/playthrough/model/types";
import { UnauthorizedError } from "@/shared/lib/errors";

export const GET_LOG_SESSION_GAME_DATA_INPUT = z.object({
  slug: z.string().min(1),
});

export type GetLogSessionGameDataInput = z.infer<
  typeof GET_LOG_SESSION_GAME_DATA_INPUT
>;

export type GetLogSessionGameDataResult = {
  gameId: string;
  playthroughs: PlaythroughWithEntries[];
  preselectedPlaythroughId: string;
};

function pickPreselected(playthroughs: PlaythroughWithEntries[]): string {
  if (playthroughs.length === 0) return "";
  // Prefer the actively-playing run; fall back to the most recent (ordinal desc).
  const playing = playthroughs.find((pt) => pt.status === "PLAYING");
  return (playing ?? playthroughs[0]).id;
}

/**
 * Worker for getLogSessionGameDataFn — plain async, no TanStack Start runtime.
 * Returns the numeric gameId + the user's playthroughs for the given slug,
 * plus a sensible preselectedPlaythroughId (active run or most recent).
 * Integration tests import this directly (foot-gun #8).
 */
export async function getLogSessionGameDataWorker(
  userId: string | undefined,
  data: unknown
): Promise<GetLogSessionGameDataResult> {
  if (!userId) {
    throw new UnauthorizedError("Sign in required");
  }

  const { slug } = GET_LOG_SESSION_GAME_DATA_INPUT.parse(data);
  const { gameId, playthroughs } = await getPlaythroughsBySlug(userId, slug);

  return {
    gameId,
    playthroughs,
    preselectedPlaythroughId: pickPreselected(playthroughs),
  };
}
