import { ALLOWED_GAME_CATEGORIES, SEARCH_RESULTS_LIMIT } from "./constants";
import { QueryBuilder } from "./query-builder";

export const TIMES_TO_BEAT_FIELDS = ["hastily", "completely"] as const;

export function buildTimesToBeatQuery(igdbId: number): string {
  return new QueryBuilder()
    .fields([...TIMES_TO_BEAT_FIELDS])
    .where(`game_id = ${igdbId}`)
    .limit(1)
    .build();
}

export function buildTimesToBeatBatchQuery(igdbIds: number[]): string {
  return new QueryBuilder()
    .fields(["game_id", ...TIMES_TO_BEAT_FIELDS])
    .where(`game_id = (${igdbIds.join(",")})`)
    .limit(igdbIds.length)
    .build();
}

export const RELATED_COLLECTIONS_FIELDS = [
  "collections.id",
  "collections.name",
  "collections.games.id",
  "collections.games.name",
  "collections.games.slug",
  "collections.games.cover.image_id",
  "collections.games.game_type",
  "collections.games.first_release_date",
] as const;

export function buildRelatedCollectionsQuery(igdbId: number): string {
  return new QueryBuilder()
    .fields([...RELATED_COLLECTIONS_FIELDS])
    .where(`id = ${igdbId}`)
    .limit(1)
    .build();
}

export const GAME_SEARCH_FIELDS = [
  "name",
  "slug",
  "platforms.name",
  "release_dates.human",
  "release_dates.date",
  "release_dates.date_format",
  "release_dates.y",
  "release_dates.m",
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
