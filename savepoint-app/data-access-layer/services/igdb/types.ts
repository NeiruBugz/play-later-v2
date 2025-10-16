import type { FullGameInfoResponse, SearchResponse } from "@/shared/types";

import type { BaseService, ServiceResult } from "../types";

// IGDB Service specific types
export interface GameSearchParams {
  name: string;
  fields?: {
    platform?: string;
    platforms?: string;
  };
}

export interface GameSearchResult {
  games: SearchResponse[];
  count: number;
}

export interface GameDetailsParams {
  gameId: number;
}

export interface GameDetailsResult {
  game: FullGameInfoResponse | null;
}

export interface PlatformsResult {
  platforms: Array<{ id: number; name: string }>;
}

export interface GetGameScreenshotsParams {
  gameId: number;
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

export interface SearchGamesByNameParams {
  name: string;
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

export interface GetGameBySteamAppIdParams {
  steamAppId: number;
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

export interface SearchPlatformByNameParams {
  platformName: string;
}

export interface PlatformSearchResult {
  platforms: Array<{
    id: number;
    name: string;
    abbreviation?: string;
  }>;
}

export interface GetGameAggregatedRatingParams {
  gameId: number;
}

export interface GameAggregatedRatingResult {
  gameId: number;
  rating?: number;
  count?: number;
}

export interface GetSimilarGamesParams {
  gameId: number;
}

export interface SimilarGamesResult {
  similarGames: number[]; // Array of IGDB game IDs
}

export interface GetGameGenresParams {
  gameId: number;
}

export interface GameGenresResult {
  genres: Array<{ id: number; name: string }>;
}

export interface GetGameCompletionTimesParams {
  gameId: number;
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

export interface GetGameExpansionsParams {
  gameId: number;
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

export interface GetFranchiseGamesParams {
  franchiseId: number;
}

export interface FranchiseGamesResult {
  games: Array<{
    id: number;
    name: string;
    cover: {
      id: number;
      image_id: string;
    };
    game_type: number;
  }>;
}

export interface GetGameArtworksParams {
  gameId: number;
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

export interface GetUpcomingReleasesByIdsParams {
  ids: number[];
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

export interface IgdbService extends BaseService {
  searchGamesByName(
    params: GameSearchParams
  ): Promise<ServiceResult<GameSearchResult>>;

  getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>>;

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
}
