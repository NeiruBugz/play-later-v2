import { ALLOWED_GAME_CATEGORIES, SEARCH_RESULTS_LIMIT } from "./constants";
import { QueryBuilder } from "./query-builder";

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
