import type { GameSearchResult } from "@/data-access-layer/services/igdb/types";

/**
 * Game search handler input
 */
export interface GameSearchHandlerInput {
  /** Search query (minimum 3 characters) */
  query: string;
  /** Pagination offset (non-negative integer) */
  offset?: number;
}

/**
 * Game search handler output
 * Alias for GameSearchResult from IGDB service
 */
export type GameSearchHandlerOutput = GameSearchResult;
