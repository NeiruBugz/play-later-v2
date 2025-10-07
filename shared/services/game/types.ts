import type { Game, LibraryItem } from "@prisma/client";

import type { ServiceResult } from "@/shared/services/types";
import type { FullGameInfoResponse, SearchResponse } from "@/shared/types/igdb";

// ============================================================================
// Input Types
// ============================================================================

/**
 * Input for searching games via IGDB.
 */
export type GameSearchInput = {
  /** Search query string */
  query: string;
  /** Number of results to return (default: 10) */
  limit?: number;
  /** Number of results to skip (default: 0) */
  offset?: number;
  /** Optional field filters for IGDB search */
  filters?: Record<string, string | string[]>;
};

/**
 * Input for creating a game from IGDB data.
 */
export type CreateGameFromIgdbInput = {
  /** IGDB game ID to fetch and create */
  igdbId: number;
};

/**
 * Input for creating a game with custom data.
 */
export type CreateGameInput = {
  /** IGDB game ID */
  igdbId: number;
  /** Game title */
  title: string;
  /** Cover image URL or image_id from IGDB */
  coverImage?: string | null;
  /** HowLongToBeat ID */
  hltbId?: string | null;
  /** Main story completion time in hours */
  mainStory?: number | null;
  /** Main + extras completion time in hours */
  mainExtra?: number | null;
  /** Completionist time in hours */
  completionist?: number | null;
  /** Release date */
  releaseDate?: Date | null;
  /** Game description/summary */
  description?: string | null;
  /** Steam app ID */
  steamAppId?: number | null;
};

/**
 * Input for updating a game.
 */
export type UpdateGameInput = {
  /** Game title */
  title?: string;
  /** Cover image URL or image_id from IGDB */
  coverImage?: string | null;
  /** HowLongToBeat ID */
  hltbId?: string | null;
  /** Main story completion time in hours */
  mainStory?: number | null;
  /** Main + extras completion time in hours */
  mainExtra?: number | null;
  /** Completionist time in hours */
  completionist?: number | null;
  /** Release date */
  releaseDate?: Date | null;
  /** Game description/summary */
  description?: string | null;
  /** Steam app ID */
  steamAppId?: number | null;
};

/**
 * Input for getting a game by ID with optional library items.
 */
export type GetGameInput = {
  /** Game ID */
  gameId: string;
  /** Optional user ID to include library items */
  userId?: string;
};

// ============================================================================
// Output Types
// ============================================================================

/**
 * Game with related library items included.
 */
export type GameWithLibraryItems = Game & {
  libraryItems?: LibraryItem[];
};

/**
 * IGDB search result item.
 */
export type IgdbSearchResult = SearchResponse;

/**
 * IGDB game details result.
 */
export type IgdbGameDetails = FullGameInfoResponse;

/**
 * Result type for getGame operation.
 */
export type GetGameResult = ServiceResult<{
  game: Game | GameWithLibraryItems;
}>;

/**
 * Result type for searchGames operation.
 */
export type SearchGamesResult = ServiceResult<{
  games: IgdbSearchResult[];
  total: number;
}>;

/**
 * Result type for createGame operation.
 */
export type CreateGameResult = ServiceResult<{
  game: Game;
  created: boolean; // true if created, false if already existed
}>;

/**
 * Result type for updateGame operation.
 */
export type UpdateGameResult = ServiceResult<{
  game: Game;
}>;

/**
 * Result type for getGameDetails operation (IGDB).
 */
export type GetGameDetailsResult = ServiceResult<{
  game: IgdbGameDetails;
}>;

/**
 * Result type for findOrCreateGame operation.
 */
export type FindOrCreateGameResult = ServiceResult<{
  game: Game;
  created: boolean;
}>;
