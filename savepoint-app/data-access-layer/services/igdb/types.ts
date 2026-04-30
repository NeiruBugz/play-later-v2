import type { z } from "zod";

import type { FullGameInfoResponse, SearchResponse } from "@/shared/types";

import type {
  CollectionGamesByIdSchema,
  FranchiseDetailsSchema,
  FranchiseGamesSchema,
  GameDetailsBySlugSchema,
  GameDetailsSchema,
  GameSearchSchema,
  TimesToBeatSchema,
} from "./schemas";

export type GameSearchParams = z.infer<typeof GameSearchSchema>;
export type GameDetailsParams = z.infer<typeof GameDetailsSchema>;
export type GetGameDetailsBySlugParams = z.infer<
  typeof GameDetailsBySlugSchema
>;
export type GetFranchiseGamesParams = z.infer<typeof FranchiseGamesSchema>;
export type GetFranchiseDetailsParams = z.infer<typeof FranchiseDetailsSchema>;
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
  cover?: { image_id: string };
  game_type?: number;
}

export interface CollectionGamesResult {
  name: string;
  id: number;
  games: Array<CollectionGame>;
}

export interface IgdbServiceContract {
  searchGamesByName(params: GameSearchParams): Promise<GameSearchResult>;
  getGameDetails(params: GameDetailsParams): Promise<GameDetailsResult>;
  getGameDetailsBySlug(
    params: GetGameDetailsBySlugParams
  ): Promise<GameDetailsBySlugResult>;
  getPlatforms(): Promise<PlatformsResult>;
  getFranchiseGames(
    params: GetFranchiseGamesParams
  ): Promise<FranchiseGamesResult>;
  getFranchiseDetails(
    params: GetFranchiseDetailsParams
  ): Promise<FranchiseDetailsResult>;
  getTimesToBeat(params: GetTimesToBeatParams): Promise<TimesToBeatResult>;
  getCollectionGamesById(params: {
    collectionId: number;
  }): Promise<CollectionGamesResult>;
}
