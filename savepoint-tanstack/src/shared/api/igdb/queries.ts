import { ALLOWED_GAME_CATEGORIES, SEARCH_RESULTS_LIMIT } from "./constants";
import { QueryBuilder } from "./query-builder";

export const TIMES_TO_BEAT_FIELDS = ["normally", "completely"] as const;

export function buildTimesToBeatQuery(igdbId: number): string {
  return new QueryBuilder()
    .fields([...TIMES_TO_BEAT_FIELDS])
    .where(`game_id = ${igdbId}`)
    .limit(1)
    .build();
}

export const GAME_COLLECTIONS_FIELDS = [
  "collections.id",
  "collections.name",
] as const;

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
