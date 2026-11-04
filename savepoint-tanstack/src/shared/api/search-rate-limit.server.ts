import { env } from "@env";
import { getRequest } from "@tanstack/react-start/server";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

import { createLogger } from "@/shared/lib/logger";
import {
  assertWithinLimit,
  createFixedWindowLimiter,
  failOpen,
  resolveRateLimitKey,
  type RateLimiter,
} from "@/shared/lib/rate-limit";

const logger = createLogger({ service: "search-rate-limit" });
const SEARCH_LIMIT = 30;
const SEARCH_WINDOW_MS = 60_000;

const globalForLimiter = globalThis as unknown as {
  searchRateLimiter: RateLimiter | undefined;
};

function createUpstashLimiter(url: string, token: string): RateLimiter {
  const ratelimit = new Ratelimit({
    redis: new Redis({ url, token }),
    limiter: Ratelimit.fixedWindow(SEARCH_LIMIT, `${SEARCH_WINDOW_MS} ms`),
    prefix: "ratelimit:igdb-search",
  });
  return {
    async consume(key) {
      const { success, reset } = await ratelimit.limit(key);
      return {
        allowed: success,
        retryAfterMs: Math.max(reset - Date.now(), 0),
      };
    },
  };
}

function getSearchLimiter(): RateLimiter {
  if (!globalForLimiter.searchRateLimiter) {
    globalForLimiter.searchRateLimiter =
      env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN
        ? failOpen(
            createUpstashLimiter(
              env.UPSTASH_REDIS_REST_URL,
              env.UPSTASH_REDIS_REST_TOKEN
            ),
            (error) =>
              logger.warn({ err: error }, "rate limit store unavailable")
          )
        : createFixedWindowLimiter({
            limit: SEARCH_LIMIT,
            windowMs: SEARCH_WINDOW_MS,
          });
  }
  return globalForLimiter.searchRateLimiter;
}

/**
 * Single seam guarding every handler that spends the shared IGDB quota.
 * Signed-in callers are keyed by user id, anonymous ones by client address
 * (forwarded headers are trusted only on Vercel, which overwrites them).
 * Uses Upstash when configured; otherwise a per-process in-memory window.
 */
export async function enforceSearchRateLimit(
  userId: string | undefined
): Promise<void> {
  const key = resolveRateLimitKey({
    userId,
    headers: getRequest().headers,
    trustForwardedHeaders: Boolean(env.VERCEL),
  });
  await assertWithinLimit(getSearchLimiter(), key);
}
