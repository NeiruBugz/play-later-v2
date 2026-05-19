import { z } from "zod";

import { ALLOWED_GAME_CATEGORIES } from "@/shared/api/igdb/constants";
import { igdbFetch } from "@/shared/api/igdb/fetch";
import { buildCollectionGamesQuery } from "@/shared/api/igdb/queries";
import { CollectionWithGamesSchema } from "@/shared/api/igdb/schemas";
import { createLogger } from "@/shared/lib";
import {
  NotFoundError,
  UpstreamError,
  ValidationError,
} from "@/shared/lib/errors";

const logger = createLogger({ service: "game-related-games" });

export interface RelatedGame {
  igdbId: number;
  slug: string;
  title: string;
  coverImageId: string | null;
}

export interface GetRelatedGamesParams {
  collectionId: number;
  page?: number;
  pageSize?: number;
}

export interface GetRelatedGamesResult {
  games: RelatedGame[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

const ParamsSchema = z.object({
  collectionId: z.number().int().positive(),
  page: z.number().int().min(1).default(1),
  pageSize: z.number().int().min(1).max(50).default(20),
});

const ALLOWED_TYPES: ReadonlySet<number> = new Set<number>(
  ALLOWED_GAME_CATEGORIES
);

export async function getRelatedGames(
  params: GetRelatedGamesParams
): Promise<GetRelatedGamesResult> {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new ValidationError("Invalid getRelatedGames params", {
      issues: parsed.error.issues,
    });
  }
  const { collectionId, page, pageSize } = parsed.data;

  const query = buildCollectionGamesQuery(collectionId);

  let response: unknown;
  try {
    response = await igdbFetch("/collections", query);
  } catch (cause) {
    logger.error(
      { error: cause, collectionId },
      "IGDB get-related-games transport failure"
    );
    throw new UpstreamError("IGDB get-related-games failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      collectionId,
    });
  }

  const validated = z.array(CollectionWithGamesSchema).safeParse(response);
  if (!validated.success) {
    logger.error(
      { issues: validated.error.issues, collectionId },
      "IGDB get-related-games returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-related-games returned malformed response",
      { collectionId }
    );
  }

  if (validated.data.length === 0) {
    throw new NotFoundError("Collection not found", { collectionId });
  }

  const collection = validated.data[0]!;

  // game_type === undefined is treated as MAIN_GAME (allowed).
  const filtered = collection.games.filter(
    (game) => game.game_type === undefined || ALLOWED_TYPES.has(game.game_type)
  );

  const total = filtered.length;
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const slice = filtered.slice(start, end);

  const games: RelatedGame[] = slice.map((game) => ({
    igdbId: game.id,
    slug: game.slug,
    title: game.name,
    coverImageId: game.cover?.image_id ?? null,
  }));

  return {
    games,
    total,
    page,
    pageSize,
    hasMore: end < total,
  };
}
