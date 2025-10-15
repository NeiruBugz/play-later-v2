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
}
