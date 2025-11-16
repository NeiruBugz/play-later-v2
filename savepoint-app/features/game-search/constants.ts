/**
 * Shared constants for game search feature
 * Re-exports server-side constant for client use to ensure consistency
 */

import { SEARCH_RESULTS_LIMIT } from "@/data-access-layer/services/igdb/constants";

/**
 * Number of games returned per page/offset
 * Must be consistent between client pagination and server queries
 */
export const GAME_SEARCH_PAGE_SIZE = SEARCH_RESULTS_LIMIT;
