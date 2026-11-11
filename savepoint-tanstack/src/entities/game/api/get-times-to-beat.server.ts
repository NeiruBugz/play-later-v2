import { z } from "zod";

import { igdbFetch } from "@/shared/api/igdb/fetch";
import {
  buildTimesToBeatBatchQuery,
  buildTimesToBeatQuery,
} from "@/shared/api/igdb/queries";
import { TimesToBeatItemSchema } from "@/shared/api/igdb/schemas";
import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

const logger = createLogger({ service: "get-times-to-beat" });

export interface TimesToBeat {
  timeToCreditsSeconds: number | null;
  timeToCompleteSeconds: number | null;
}

type TimesToBeatItem = z.infer<typeof TimesToBeatItemSchema>;

async function fetchTimesToBeatItems(
  query: string,
  context: Record<string, unknown>
): Promise<TimesToBeatItem[]> {
  let response: unknown;
  try {
    response = await igdbFetch("/game_time_to_beats", query);
  } catch (cause) {
    logger.error(
      { error: cause, ...context },
      "IGDB get-times-to-beat transport failure"
    );
    throw new UpstreamError("IGDB get-times-to-beat failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      ...context,
    });
  }

  const parsed = z.array(TimesToBeatItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, ...context },
      "IGDB get-times-to-beat returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-times-to-beat returned malformed response",
      context
    );
  }
  return parsed.data;
}

function toTimesToBeat(item: TimesToBeatItem): TimesToBeat | null {
  const timeToCreditsSeconds = item.hastily ?? null;
  const timeToCompleteSeconds = item.completely ?? null;
  if (timeToCreditsSeconds === null && timeToCompleteSeconds === null) {
    return null;
  }
  return { timeToCreditsSeconds, timeToCompleteSeconds };
}

export async function getTimesToBeat(params: {
  igdbId: number;
}): Promise<TimesToBeat | null> {
  const { igdbId } = params;
  const items = await fetchTimesToBeatItems(buildTimesToBeatQuery(igdbId), {
    igdbId,
  });
  const first = items[0];
  return first ? toTimesToBeat(first) : null;
}

export async function getTimesToBeatForGames(
  igdbIds: number[]
): Promise<Map<number, TimesToBeat>> {
  const items = await fetchTimesToBeatItems(
    buildTimesToBeatBatchQuery(igdbIds),
    { igdbIds }
  );
  const timesByIgdbId = new Map<number, TimesToBeat>();
  for (const item of items) {
    if (item.game_id === undefined) continue;
    const times = toTimesToBeat(item);
    if (times) timesByIgdbId.set(item.game_id, times);
  }
  return timesByIgdbId;
}
