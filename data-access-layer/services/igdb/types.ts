import { Screenshot } from "igdb-api-types";

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

export interface GetScreenshotsParams {
  gameId: number;
}

export interface ScreenshotsResult {
  id: number;
  screenshots: Screenshot[];
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

export interface IgdbService extends BaseService {
  searchGamesByName(
    params: GameSearchParams
  ): Promise<ServiceResult<GameSearchResult>>;

  getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>>;

  getPlatforms(): Promise<ServiceResult<PlatformsResult>>;
}
