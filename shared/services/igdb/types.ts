import type { FullGameInfoResponse, SearchResponse } from "@/shared/types";

import type { BaseService, ServiceResponse } from "../types";

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

export interface IGameSearchService extends BaseService {
  searchGames(
    params: GameSearchParams
  ): Promise<ServiceResponse<GameSearchResult>>;
}

export interface IIgdbService extends BaseService {
  searchGames(
    params: GameSearchParams
  ): Promise<ServiceResponse<GameSearchResult>>;

  getGameDetails(
    params: GameDetailsParams
  ): Promise<ServiceResponse<GameDetailsResult>>;

  getPlatforms(): Promise<ServiceResponse<PlatformsResult>>;
}
