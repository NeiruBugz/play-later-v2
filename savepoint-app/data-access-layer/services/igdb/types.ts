import type { z } from "zod";

import type { FullGameInfoResponse, SearchResponse } from "@/shared/types";

import type { BaseService, ServiceResult } from "../types";
import type {
  CollectionGamesByIdSchema,
  EventLogoSchema,
  FranchiseDetailsSchema,
  FranchiseGamesSchema,
  GameAggregatedRatingSchema,
  GameArtworksSchema,
  GameDetailsBySlugSchema,
  GameDetailsSchema,
  GameExpansionsSchema,
  GameGenresSchema,
  GameScreenshotsSchema,
  GameSearchSchema,
  GetGameBySteamAppIdSchema,
  GetGameCompletionTimesSchema,
  PlatformSearchSchema,
  SimilarGamesSchema,
  TimesToBeatSchema,
  UpcomingReleasesByIdsSchema,
} from "./schemas";

export type GameSearchParams = z.infer<typeof GameSearchSchema>;
export type GameDetailsParams = z.infer<typeof GameDetailsSchema>;
export type GetGameDetailsBySlugParams = z.infer<
  typeof GameDetailsBySlugSchema
>;
export type GetGameBySteamAppIdParams = z.infer<
  typeof GetGameBySteamAppIdSchema
>;
export type SearchPlatformByNameParams = z.infer<typeof PlatformSearchSchema>;
export type GetGameScreenshotsParams = z.infer<typeof GameScreenshotsSchema>;
export type GetGameAggregatedRatingParams = z.infer<
  typeof GameAggregatedRatingSchema
>;
export type GetSimilarGamesParams = z.infer<typeof SimilarGamesSchema>;
export type GetGameGenresParams = z.infer<typeof GameGenresSchema>;
export type GetGameCompletionTimesParams = z.infer<
  typeof GetGameCompletionTimesSchema
>;
export type GetGameExpansionsParams = z.infer<typeof GameExpansionsSchema>;
export type GetFranchiseGamesParams = z.infer<typeof FranchiseGamesSchema>;
export type GetFranchiseDetailsParams = z.infer<typeof FranchiseDetailsSchema>;
export type GetGameArtworksParams = z.infer<typeof GameArtworksSchema>;
export type GetUpcomingReleasesByIdsParams = z.infer<
  typeof UpcomingReleasesByIdsSchema
>;
export type GetEventLogoParams = z.infer<typeof EventLogoSchema>;
export type GetTimesToBeatParams = z.infer<typeof TimesToBeatSchema>;
export type GetCollectionGamesByIdParams = z.infer<
  typeof CollectionGamesByIdSchema
>;

export interface GameSearchResult {
  games: SearchResponse[];
  count: number;
}

export interface GameDetailsResult {
  game: FullGameInfoResponse | null;
}

export interface GameDetailsBySlugResult {
  game: FullGameInfoResponse;
}

export interface PlatformsResult {
  platforms: Array<{ id: number; name: string }>;
}

export interface GameScreenshotsResult {
  screenshots: Array<{
    id: number;
    game: number;
    image_id: string;
    url?: string;
    width?: number;
    height?: number;
  }>;
}

export interface SearchGamesByNameResult {
  games: Array<{
    id: number;
    name: string;
    version_title?: string;
    cover?: {
      id: number;
      image_id: string;
      url: string;
    };
  }>;
}

export interface GameBySteamAppIdResult {
  game: {
    id: number;
    name: string;
  };
}

export interface TopRatedGamesResult {
  games: Array<{
    id: number;
    name: string;
    aggregated_rating?: number;
    cover?: {
      image_id: string;
    };
  }>;
}

export interface PlatformSearchResult {
  platforms: Array<{
    id: number;
    name: string;
    abbreviation?: string;
  }>;
}

export interface GameAggregatedRatingResult {
  gameId: number;
  rating?: number;
  count?: number;
}

export interface SimilarGamesResult {
  similarGames: number[];
}

export interface GameGenresResult {
  genres: Array<{ id: number; name: string }>;
}

export interface GameCompletionTimesResult {
  completionTimes: GameCompletionTimes | null;
}

export interface GameCompletionTimes {
  id: number;
  game_id?: number;
  gameplay_main?: number;
  gameplay_main_extra?: number;
  gameplay_completionist?: number;
  completeness?: number;
  created_at?: number;
}

export interface GameExpansionsResult {
  expansions: Array<{
    id: number;
    name: string;
    cover: {
      id: number;
      image_id: string;
      url?: string;
    };
    release_dates: Array<{
      id: number;
      human: string;
      platform: {
        id: number;
        name: string;
        human: string;
      };
    }>;
  }>;
}

export interface FranchiseGamesResult {
  games: Array<{
    id: number;
    name: string;
    slug: string;
    cover?: {
      image_id: string;
    };
  }>;
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

export interface FranchiseDetailsResult {
  franchise: {
    id: number;
    name: string;
  };
}

export interface GameArtworksResult {
  artworks: Array<{
    id: number;
    alpha_channel?: boolean;
    animated?: boolean;
    checksum: string;
    game: number;
    height?: number;
    image_id: string;
    url?: string;
    width?: number;
  }>;
}

export interface UpcomingReleasesResult {
  releases: Array<{
    id: number;
    name: string;
    cover: {
      id: number;
      image_id: string;
    };
    first_release_date: number;
    release_dates: Array<{
      id: number;
      human: string;
      platform: {
        id: number;
        name: string;
        human: string;
      };
    }>;
  }>;
}

export interface UpcomingGamingEventsResult {
  events: Array<{
    id: number;
    name: string;
    checksum?: string;
    created_at?: number;
    description?: string;
    end_time?: number;
    event_logo?: number | { id: number };
    event_networks?: number[];
    games?: number[];
    live_stream_url?: string;
    slug?: string;
    start_time: number;
    time_zone?: string;
    updated_at?: number;
    videos?: number[];
  }>;
}

export interface EventLogoResult {
  logo: {
    id: number;
    width?: number;
    height?: number;
    image_id: string;
  };
}

export interface TimesToBeatData {
  mainStory?: number;
  completionist?: number;
}

export interface TimesToBeatResult {
  timesToBeat: TimesToBeatData;
}

export interface CollectionGame {
  id: number;
  name: string;
  slug: string;
  cover: { image_id: string };
  game_type: number;
}

export interface CollectionGamesResult {
  name: string;
  id: number;
  games: Array<CollectionGame>;
}

export interface IgdbService extends BaseService {
  searchGamesByName(
    params: GameSearchParams
  ): Promise<ServiceResult<GameSearchResult>>;
  getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>>;
  getGameDetailsBySlug(
    params: GetGameDetailsBySlugParams
  ): Promise<ServiceResult<GameDetailsBySlugResult>>;
  getPlatforms(): Promise<ServiceResult<PlatformsResult>>;
  getGameBySteamAppId(
    params: GetGameBySteamAppIdParams
  ): Promise<ServiceResult<GameBySteamAppIdResult>>;
  getTopRatedGames(): Promise<ServiceResult<TopRatedGamesResult>>;
  searchPlatformByName(
    params: SearchPlatformByNameParams
  ): Promise<ServiceResult<PlatformSearchResult>>;
  getGameScreenshots(
    params: GetGameScreenshotsParams
  ): Promise<ServiceResult<GameScreenshotsResult>>;
  getGameAggregatedRating(
    params: GetGameAggregatedRatingParams
  ): Promise<ServiceResult<GameAggregatedRatingResult>>;
  getSimilarGames(
    params: GetSimilarGamesParams
  ): Promise<ServiceResult<SimilarGamesResult>>;
  getGameGenres(
    params: GetGameGenresParams
  ): Promise<ServiceResult<GameGenresResult>>;
  getGameCompletionTimes(
    params: GetGameCompletionTimesParams
  ): Promise<ServiceResult<GameCompletionTimesResult>>;
  getGameExpansions(
    params: GetGameExpansionsParams
  ): Promise<ServiceResult<GameExpansionsResult>>;
  getFranchiseGames(
    params: GetFranchiseGamesParams
  ): Promise<ServiceResult<FranchiseGamesResult>>;
  getGameArtworks(
    params: GetGameArtworksParams
  ): Promise<ServiceResult<GameArtworksResult>>;
  getUpcomingReleasesByIds(
    params: GetUpcomingReleasesByIdsParams
  ): Promise<ServiceResult<UpcomingReleasesResult>>;
  getUpcomingGamingEvents(): Promise<ServiceResult<UpcomingGamingEventsResult>>;
  getEventLogo(
    params: GetEventLogoParams
  ): Promise<ServiceResult<EventLogoResult>>;
  getTimesToBeat(
    params: GetTimesToBeatParams
  ): Promise<ServiceResult<TimesToBeatResult>>;
  getCollectionGamesById(params: {
    collectionId: number;
  }): Promise<ServiceResult<CollectionGamesResult>>;
}
