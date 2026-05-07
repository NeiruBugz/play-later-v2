import { ALLOWED_GAME_CATEGORIES, SEARCH_RESULTS_LIMIT } from "./constants";
import { QueryBuilder } from "./query-builder";

/**
 * Fields requested from IGDB `/game_time_to_beats`. Mirrors the canonical
 * `savepoint-app/data-access-layer/services/igdb/queries.ts` `TIMES_TO_BEAT_FIELDS`.
 * Hours are derived in the UI; raw seconds are returned by IGDB.
 */
export const TIMES_TO_BEAT_FIELDS = ["normally", "completely"] as const;

/**
 * Build the IGDB apicalypse query for `POST /game_time_to_beats`. Mirrors the
 * canonical `buildTimesToBeatQuery` exactly.
 */
export function buildTimesToBeatQuery(igdbId: number): string {
  return new QueryBuilder()
    .fields([...TIMES_TO_BEAT_FIELDS])
    .where(`game_id = ${igdbId}`)
    .limit(1)
    .build();
}

/**
 * Fields requested from IGDB `/games` for the game-collections look-up.
 * Returns only `collections.id` and `collections.name` — the consumer
 * (`getGameCollectionsByIgdbId`) feeds these into the related-games paginator.
 */
export const GAME_COLLECTIONS_FIELDS = [
  "collections.id",
  "collections.name",
] as const;

/**
 * Build the IGDB apicalypse query for `POST /games` to fetch a game's
 * collection refs by IGDB id. Used by the deferred related-games phase
 * (Slice 14 phase-2 rework) — collections are no longer kept on the
 * primary `getGameDetails` payload, so this is always a fresh re-fetch.
 */
export function buildGameCollectionsByIdQuery(igdbId: number): string {
  return new QueryBuilder()
    .fields([...GAME_COLLECTIONS_FIELDS])
    .where(`id = ${igdbId}`)
    .limit(1)
    .build();
}

export const COLLECTION_GAMES_FIELDS = [
  "id",
  "name",
  "games.id",
  "games.name",
  "games.slug",
  "games.cover.image_id",
  "games.game_type",
] as const;

/**
 * Build the IGDB apicalypse query for `POST /collections` to fetch a collection
 * with its games. Mirrors the canonical
 * `savepoint-app/data-access-layer/services/igdb/queries.ts buildCollectionGamesQuery`
 * exactly (sort by `games.first_release_date asc`).
 */
export function buildCollectionGamesQuery(collectionId: number): string {
  return new QueryBuilder()
    .fields([...COLLECTION_GAMES_FIELDS])
    .where(`id = ${collectionId}`)
    .sort("games.first_release_date", "asc")
    .build();
}

export const GAME_SEARCH_FIELDS = [
  "name",
  "slug",
  "platforms.name",
  "release_dates.human",
  "first_release_date",
  "game_type",
  "cover.image_id",
] as const;

export function buildGameSearchQuery(params: {
  searchQuery: string;
  filterConditions: string;
  offset?: number;
}): string {
  const gameTypeFilter = `game_type = (${ALLOWED_GAME_CATEGORIES.join(",")})`;
  const baseConditions = `cover.image_id != null & ${gameTypeFilter}`;
  const whereClause = params.filterConditions
    ? `${baseConditions} & ${params.filterConditions}`
    : baseConditions;

  const qb = new QueryBuilder()
    .fields([...GAME_SEARCH_FIELDS])
    .where(whereClause)
    .search(params.searchQuery)
    .limit(SEARCH_RESULTS_LIMIT);

  if (params.offset && params.offset > 0) {
    qb.offset(params.offset);
  }

  return qb.build();
}

export function buildSearchFilterConditions(
  fields: Record<string, string | undefined>
): string {
  return Object.entries(fields)
    .filter(([, value]) => Boolean(value))
    .map(([key, value]) => {
      const fieldName = key === "platform" ? "platforms" : key;
      return `${fieldName} = (${value})`;
    })
    .join(" & ");
}
