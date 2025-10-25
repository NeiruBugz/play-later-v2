export const queryConfig = {
  STALE_TIME_MS: 30000,
  MAX_RETRIES: 2,
  RETRY_BASE_DELAY_MS: 1000,
  RETRY_MAX_DELAY_MS: 30000,
} as const;
