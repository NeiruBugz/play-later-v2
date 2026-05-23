import { z } from "zod";

import { igdbFetch } from "@/shared/api/igdb/fetch";
import { buildGameCollectionsByIdQuery } from "@/shared/api/igdb/queries";
import {
  GameCollectionsResponseItemSchema,
  type CollectionRef,
} from "@/shared/api/igdb/schemas";
import { createLogger } from "@/shared/lib";
import { UpstreamError } from "@/shared/lib/errors";

const logger = createLogger({ service: "get-game-collections" });

export interface GameCollectionRef {
  id: number;
  name: string;
}

export async function getGameCollectionsByIgdbId(params: {
  igdbId: number;
}): Promise<GameCollectionRef[]> {
  const { igdbId } = params;
  const query = buildGameCollectionsByIdQuery(igdbId);

  let response: unknown;
  try {
    response = await igdbFetch("/games", query);
  } catch (cause) {
    logger.error(
      { error: cause, igdbId },
      "IGDB get-game-collections transport failure"
    );
    throw new UpstreamError("IGDB get-game-collections failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      igdbId,
    });
  }

  const parsed = z.array(GameCollectionsResponseItemSchema).safeParse(response);
  if (!parsed.success) {
    logger.error(
      { issues: parsed.error.issues, igdbId },
      "IGDB get-game-collections returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-game-collections returned malformed response",
      { igdbId }
    );
  }

  const item = parsed.data[0];
  const refs = item?.collections ?? [];
  return refs.map((c: CollectionRef) => ({ id: c.id, name: c.name }));
}
