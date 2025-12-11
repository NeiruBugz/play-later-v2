import {
  IGDB_ARTWORK_LIMIT,
  IGDB_PLATFORM_SEARCH_LIMIT,
  IGDB_SCREENSHOT_LIMIT,
  IGDB_SINGLE_RESULT_LIMIT,
} from "@/shared/constants";

import {
  ALLOWED_FRANCHISE_GAME_CATEGORIES,
  ALLOWED_GAME_CATEGORIES,
  SEARCH_RESULTS_LIMIT,
  TOP_RATED_GAMES_LIMIT,
  UPCOMING_EVENTS_LIMIT,
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
  "collections.name",
] as const;

export const TOP_RATED_GAMES_FIELDS = [
  "name",
  "cover.image_id",
  "aggregated_rating",
] as const;

export const PLATFORM_SEARCH_FIELDS = ["id", "name", "abbreviation"] as const;

export const SCREENSHOT_FIELDS = [
  "id",
  "game",
  "image_id",
  "url",
  "width",
  "height",
] as const;

export const AGGREGATED_RATING_FIELDS = [
  "id",
  "aggregated_rating",
  "aggregated_rating_count",
] as const;

export const GENRES_FIELDS = ["genres.id", "genres.name"] as const;

export const COMPLETION_TIMES_FIELDS = [
  "completeness",
  "created_at",
  "game",
  "gameplay_completionist",
  "gameplay_main",
  "gameplay_main_extra",
] as const;

export const EXPANSIONS_FIELDS = [
  "expansions",
  "expansions.name",
  "expansions.cover.url",
  "expansions.cover.image_id",
  "expansions.release_dates",
] as const;

export const FRANCHISE_GAMES_FIELDS = [
  "id",
  "name",
  "slug",
  "cover.image_id",
] as const;

export const FRANCHISE_DETAILS_FIELDS = ["id", "name"] as const;

export const ARTWORKS_FIELDS = [
  "alpha_channel",
  "animated",
  "checksum",
  "game",
  "height",
  "image_id",
  "url",
  "width",
] as const;

export const UPCOMING_RELEASES_FIELDS = [
  "name",
  "cover.image_id",
  "first_release_date",
  "release_dates.platform.name",
  "release_dates.human",
] as const;

export const UPCOMING_EVENTS_FIELDS = [
  "checksum",
  "created_at",
  "description",
  "end_time",
  "event_logo",
  "event_networks",
  "games",
  "live_stream_url",
  "name",
  "slug",
  "start_time",
  "time_zone",
  "updated_at",
  "videos",
] as const;

export const EVENT_LOGO_FIELDS = ["id", "width", "height", "image_id"] as const;

export const TIMES_TO_BEAT_FIELDS = ["normally", "completely"] as const;

export const COLLECTION_GAMES_FIELDS = [
  "id",
  "name",
  "games.id",
  "games.name",
  "games.slug",
  "games.cover.image_id",
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

export function buildGameBySteamAppIdQuery(steamAppId: number): string {
  const steamUrl = `https://store.steampowered.com/app/${steamAppId}`;
  return new QueryBuilder()
    .fields(["name"])
    .where(`external_games.category = 1 & external_games.url = "${steamUrl}"`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildTopRatedGamesQuery(): string {
  return new QueryBuilder()
    .fields([...TOP_RATED_GAMES_FIELDS])
    .where(
      "aggregated_rating_count > 20 & aggregated_rating != null & rating != null & category = 0"
    )
    .sort("aggregated_rating", "desc")
    .limit(TOP_RATED_GAMES_LIMIT)
    .build();
}

export function buildPlatformSearchQuery(platformName: string): string {
  return new QueryBuilder()
    .fields([...PLATFORM_SEARCH_FIELDS])
    .search(platformName)
    .limit(IGDB_PLATFORM_SEARCH_LIMIT)
    .build();
}

export function buildScreenshotsQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...SCREENSHOT_FIELDS])
    .where(`game = ${gameId}`)
    .limit(IGDB_SCREENSHOT_LIMIT)
    .build();
}

export function buildAggregatedRatingQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...AGGREGATED_RATING_FIELDS])
    .where(`id = ${gameId}`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildSimilarGamesQuery(gameId: number): string {
  return new QueryBuilder()
    .fields(["similar_games.*"])
    .where(`id = ${gameId}`)
    .build();
}

export function buildGameGenresQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...GENRES_FIELDS])
    .where(`id = ${gameId}`)
    .build();
}

export function buildCompletionTimesQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...COMPLETION_TIMES_FIELDS])
    .where(`game = ${gameId}`)
    .limit(IGDB_SINGLE_RESULT_LIMIT)
    .build();
}

export function buildExpansionsQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...EXPANSIONS_FIELDS])
    .where(`id = ${gameId}`)
    .build();
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

export function buildArtworksQuery(gameId: number): string {
  return new QueryBuilder()
    .fields([...ARTWORKS_FIELDS])
    .where(`game = ${gameId}`)
    .limit(IGDB_ARTWORK_LIMIT)
    .build();
}

export function buildUpcomingReleasesQuery(ids: number[]): string {
  return new QueryBuilder()
    .fields([...UPCOMING_RELEASES_FIELDS])
    .sort("first_release_date", "asc")
    .where(`id = (${ids.join(",")})`)
    .build();
}

export function buildUpcomingEventsQuery(): string {
  const currentTimestamp = Math.floor(Date.now() / 1000);
  return new QueryBuilder()
    .fields([...UPCOMING_EVENTS_FIELDS])
    .where(`start_time >= ${currentTimestamp}`)
    .sort("start_time", "asc")
    .limit(UPCOMING_EVENTS_LIMIT)
    .build();
}

export function buildEventLogoQuery(logoId: number): string {
  return new QueryBuilder()
    .fields([...EVENT_LOGO_FIELDS])
    .where(`id = ${logoId}`)
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
