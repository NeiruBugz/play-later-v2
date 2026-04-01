import { IGDB_SINGLE_RESULT_LIMIT } from "@/shared/constants";

import {
  ALLOWED_FRANCHISE_GAME_CATEGORIES,
  ALLOWED_GAME_CATEGORIES,
  SEARCH_RESULTS_LIMIT,
} from "./constants";
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

export const GAME_DETAILS_FIELDS = [
  "name",
  "slug",
  "summary",
  "aggregated_rating",
  "first_release_date",
  "cover.image_id",
  "genres.name",
  "platforms.name",
  "platforms.slug",
  "platforms.abbreviation",
  "platforms.alternative_name",
  "platforms.generation",
  "platforms.platform_family",
  "platforms.platform_type",
  "screenshots.image_id",
  "release_dates.platform.name",
  "release_dates.human",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "game_modes.name",
  "game_engines.name",
  "player_perspectives.name",
  "themes.name",
  "external_games.category",
  "external_games.name",
  "external_games.url",
  "similar_games.name",
  "similar_games.cover.image_id",
  "similar_games.release_dates.human",
  "similar_games.first_release_date",
  "websites.url",
  "websites.category",
  "websites.trusted",
  "franchise",
  "franchises",
  "game_type",
  "game_type.type",
] as const;

export const GAME_DETAILS_BY_SLUG_FIELDS = [
  "name",
  "slug",
  "summary",
  "aggregated_rating",
  "first_release_date",
  "cover.image_id",
  "genres.name",
  "platforms.name",
  "screenshots.image_id",
  "release_dates.platform.name",
  "release_dates.human",
  "involved_companies.developer",
  "involved_companies.publisher",
  "involved_companies.company.name",
  "themes.name",
  "franchise.id",
  "franchise.name",
  "franchises",
  "game_type",
  "collections.id",
  "collections.name",
] as const;

export const FRANCHISE_GAMES_FIELDS = [
  "id",
  "name",
  "slug",
  "cover.image_id",
] as const;

export const FRANCHISE_DETAILS_FIELDS = ["id", "name"] as const;

export const TIMES_TO_BEAT_FIELDS = ["normally", "completely"] as const;

export const COLLECTION_GAMES_FIELDS = [
  "id",
  "name",
  "games.id",
  "games.name",
  "games.slug",
  "games.cover.image_id",
  "games.game_type",
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

export function buildGameDetailsByIdQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...GAME_DETAILS_FIELDS])
    .where(`id = (${gameId})`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildGameDetailsBySlugQuery(slug: string): string {
  const escapedSlug = slug.replace(/\\/g, "\\\\").replace(/"/g, '\\"');
  return new QueryBuilder()
    .fields([...GAME_DETAILS_BY_SLUG_FIELDS])
    .where(`slug = "${escapedSlug}"`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildPlatformsQuery(): string {
  return new QueryBuilder().fields(["id", "name", "abbreviation"]).build();
}

export function buildFranchiseGamesQuery(params: {
  franchiseId: number;
  currentGameId: number;
  limit: number;
  offset: number;
}): string {
  const gameTypeFilter = `game_type = (${ALLOWED_FRANCHISE_GAME_CATEGORIES.join(",")})`;
  const whereClause = `franchise = ${params.franchiseId} & id != ${params.currentGameId} & ${gameTypeFilter}`;

  return new QueryBuilder()
    .fields([...FRANCHISE_GAMES_FIELDS])
    .where(whereClause)
    .limit(params.limit)
    .offset(params.offset)
    .sort("first_release_date", "asc")
    .build();
}

export function buildFranchiseGamesCountQuery(params: {
  franchiseId: number;
  currentGameId: number;
}): string {
  const gameTypeFilter = `game_type = (${ALLOWED_FRANCHISE_GAME_CATEGORIES.join(",")})`;
  const whereClause = `franchise = ${params.franchiseId} & id != ${params.currentGameId} & ${gameTypeFilter}`;

  return new QueryBuilder().fields(["id"]).where(whereClause).build();
}

export function buildFranchiseDetailsQuery(franchiseId: number): string {
  return new QueryBuilder()
    .fields([...FRANCHISE_DETAILS_FIELDS])
    .where(`id = ${franchiseId}`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildTimesToBeatQuery(igdbId: number): string {
  return new QueryBuilder()
    .fields([...TIMES_TO_BEAT_FIELDS])
    .where(`game_id = ${igdbId}`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildCollectionGamesQuery(collectionId: number): string {
  return new QueryBuilder()
    .fields([...COLLECTION_GAMES_FIELDS])
    .where(`id = ${collectionId}`)
    .sort("games.first_release_date", "asc")
    .build();
}
