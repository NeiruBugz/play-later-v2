/**
 * API and Network Configuration Constants
 */

// Rate Limiting
export const DEFAULT_RATE_LIMIT_REQUESTS = 20;
export const DEFAULT_RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour
export const RATE_LIMIT_CLEANUP_INTERVAL_MS = 10 * 60 * 1000; // 10 minutes
export const RATE_LIMIT_RETRY_AFTER_SECONDS = 3600; // 1 hour

// Cache TTL and Revalidation
export const GAME_SEARCH_CACHE_TTL_SECONDS = 300; // 5 minutes
export const GAME_SEARCH_STALE_TIME_MS = 5 * 60 * 1000; // 5 minutes
export const GAME_SEARCH_GC_TIME_MS = 10 * 60 * 1000; // 10 minutes
export const LIBRARY_DATA_STALE_TIME_MS = 30_000; // 30 seconds
export const LIBRARY_DATA_GC_TIME_MS = 5 * 60_000; // 5 minutes
