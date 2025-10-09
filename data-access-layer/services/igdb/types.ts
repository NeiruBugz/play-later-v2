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

export interface IgdbService extends BaseService {
  searchGamesByName(
    params: GameSearchParams
  ): Promise<ServiceResult<GameSearchResult>>;

  getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResult<GameDetailsResult>>;

  getPlatforms(): Promise<ServiceResult<PlatformsResult>>;
}
