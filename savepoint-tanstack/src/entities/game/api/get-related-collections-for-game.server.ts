import { z } from "zod";

import { ALLOWED_GAME_CATEGORIES } from "@/shared/api/igdb/constants";
import { igdbFetch } from "@/shared/api/igdb/fetch";
import { buildRelatedCollectionsQuery } from "@/shared/api/igdb/queries";
import {
  RelatedCollectionsResponseItemSchema,
  type CollectionGameItem,
} from "@/shared/api/igdb/schemas";
import { createLogger } from "@/shared/lib";
import { UpstreamError, ValidationError } from "@/shared/lib/errors";

const logger = createLogger({ service: "game-related-collections" });

export interface RelatedGame {
  igdbId: number;
  slug: string;
  title: string;
  coverImageId: string | null;
}

export interface RelatedCollection {
  collectionId: number;
  collectionName: string;
  games: RelatedGame[];
}

const ParamsSchema = z.object({
  igdbId: z.number().int().positive(),
});

const ALLOWED_TYPES: ReadonlySet<number> = new Set<number>(
  ALLOWED_GAME_CATEGORIES
);

function byFirstReleaseDate(a: CollectionGameItem, b: CollectionGameItem) {
  return (
    (a.first_release_date ?? Number.POSITIVE_INFINITY) -
    (b.first_release_date ?? Number.POSITIVE_INFINITY)
  );
}

export async function getRelatedCollectionsForGame(params: {
  igdbId: number;
}): Promise<RelatedCollection[]> {
  const parsed = ParamsSchema.safeParse(params);
  if (!parsed.success) {
    throw new ValidationError("Invalid getRelatedCollectionsForGame params", {
      issues: parsed.error.issues,
    });
  }
  const { igdbId } = parsed.data;

  let response: unknown;
  try {
    response = await igdbFetch("/games", buildRelatedCollectionsQuery(igdbId));
  } catch (cause) {
    logger.error(
      { error: cause, igdbId },
      "IGDB get-related-collections transport failure"
    );
    throw new UpstreamError("IGDB get-related-collections failed", {
      cause: cause instanceof Error ? cause.message : String(cause),
      igdbId,
    });
  }

  const validated = z
    .array(RelatedCollectionsResponseItemSchema)
    .safeParse(response);
  if (!validated.success) {
    logger.error(
      { issues: validated.error.issues, igdbId },
      "IGDB get-related-collections returned malformed response"
    );
    throw new UpstreamError(
      "IGDB get-related-collections returned malformed response",
      { igdbId }
    );
  }

  const collections = validated.data[0]?.collections ?? [];

  return collections
    .map((collection) => ({
      collectionId: collection.id,
      collectionName: collection.name,
      games: (collection.games ?? [])
        .filter(
          (game) =>
            game.id !== igdbId &&
            (game.game_type === undefined || ALLOWED_TYPES.has(game.game_type))
        )
        .sort(byFirstReleaseDate)
        .map(
          (game): RelatedGame => ({
            igdbId: game.id,
            slug: game.slug,
            title: game.name,
            coverImageId: game.cover?.image_id ?? null,
          })
        ),
    }))
    .filter((collection) => collection.games.length > 0);
}
