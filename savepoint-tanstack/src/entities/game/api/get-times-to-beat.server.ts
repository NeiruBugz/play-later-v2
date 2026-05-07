/**
 * Phase-2 entity query: fetch IGDB community times-to-beat by IGDB id.
 *
 * Slice 14 phase-2 rework — times-to-beat is always re-fetched fresh, never
 * persisted on the Game row. Returns raw seconds; UI converts to hours.
 *
 * Behavior:
 *   - Empty IGDB result → `null` (game has no community time-to-beat data).
 *   - Both `normally` and `completely` undefined on the first item → `null`.
 *   - Transport / non-2xx / malformed → `UpstreamError`.
 */
import { z } from "zod";

import { igdbFetch } from "@/shared/api/igdb/fetch";
import { buildTimesToBeatQuery } from "@/shared/api/igdb/queries";
import { TimesToBeatItemSchema } from "@/shared/api/igdb/schemas";
import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

const logger = createLogger({ service: "get-times-to-beat" });

/**
 * Times-to-beat values returned by IGDB. Both fields are seconds; the UI
 * layer rounds to one decimal hour. `null` field = IGDB has no data for that
 * dimension.
 */
export interface TimesToBeat {
  mainStory: number | null;
  completionist: number | null;
}

export async function getTimesToBeat(params: {
  igdbId: number;
}): Promise<TimesToBeat | null> {
  const { igdbId } = params;
  const query = buildTimesToBeatQuery(igdbId);

  let response: unknown;
  try {
    response = await igdbFetch("/game_time_to_beats", query);
  } catch (cause) {
    logger.error(
      { error: cause, igdbId },
      "IGDB get-times-to-beat transport failure"
    );
    throw new UpstreamError("IGDB get-times-to-beat failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      igdbId,
    });
  }

  const parsed = z.array(TimesToBeatItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, igdbId },
      "IGDB get-times-to-beat returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-times-to-beat returned malformed response",
      { igdbId }
    );
  }

  const first = parsed.data[0];
  if (!first) return null;

  const mainStory = first.normally ?? null;
  const completionist = first.completely ?? null;
  if (mainStory === null && completionist === null) return null;

  return { mainStory, completionist };
}
