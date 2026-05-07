/**
 * Plain async worker for the browse-related-games feature.
 *
 * Read-through IGDB `/collections` query with application-side pagination and
 * `ALLOWED_GAME_CATEGORIES` filtering. Does NOT upsert into the local Game
 * table — pagination over a collection is a browsing operation; upsert happens
 * in the add-game flow when the user picks a specific game.
 *
 * Mirrors the canonical
 * `savepoint-app/data-access-layer/services/igdb/igdb-service.ts getCollectionGamesById`
 * filter semantics (allow when `game_type === undefined || ALLOWED.includes(...)`).
 *
 * The `createServerFn` wrapper at `./get-related-games.ts` delegates here.
 * Tests import this worker directly per CLAUDE.md foot-gun #8 (createServerFn
 * returns `undefined` when invoked programmatically in vitest).
 */
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

const logger = createLogger({ service: "browse-related-games-worker" });

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
  // Re-validate inputs ("validate twice" — handler may be called programmatically
  // by tests / loaders, bypassing the createServerFn inputValidator).
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

  // Filter by ALLOWED_GAME_CATEGORIES BEFORE computing total or slicing.
  // game_type === undefined is treated as MAIN_GAME (allowed) per canonical.
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
