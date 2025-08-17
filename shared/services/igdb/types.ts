import type { SearchResponse } from "@/shared/types";

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

export interface IIgdbService extends BaseService {
  searchGames(
    params: GameSearchParams
  ): Promise<ServiceResponse<GameSearchResult>>;
}
