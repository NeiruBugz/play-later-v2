import { ValidationError } from "./errors";

export const RATE_LIMITED_CODE = "RATE_LIMITED";
const PRUNE_THRESHOLD = 1000;

export type RateLimitDecision = { allowed: boolean; retryAfterMs: number };

export type RateLimiter = {
  consume(key: string): Promise<RateLimitDecision>;
};

export function createFixedWindowLimiter({
  limit,
  windowMs,
  now = Date.now,
}: {
  limit: number;
  windowMs: number;
  now?: () => number;
}): RateLimiter {
  const windows = new Map<string, { count: number; resetAt: number }>();

  function pruneExpired(current: number) {
    for (const [key, window] of windows) {
      if (window.resetAt <= current) windows.delete(key);
    }
  }

  return {
    async consume(key) {
      const current = now();
      if (windows.size > PRUNE_THRESHOLD) pruneExpired(current);

      const existing = windows.get(key);
      const window =
        existing && existing.resetAt > current
          ? existing
          : { count: 0, resetAt: current + windowMs };
      window.count += 1;
      windows.set(key, window);

      return {
        allowed: window.count <= limit,
        retryAfterMs: window.resetAt - current,
      };
    },
  };
}

export function failOpen(
  limiter: RateLimiter,
  onError: (error: unknown) => void
): RateLimiter {
  return {
    async consume(key) {
      try {
        return await limiter.consume(key);
      } catch (error) {
        onError(error);
        return { allowed: true, retryAfterMs: 0 };
      }
    },
  };
}

export async function assertWithinLimit(
  limiter: RateLimiter,
  key: string
): Promise<void> {
  const { allowed, retryAfterMs } = await limiter.consume(key);
  if (!allowed) {
    throw new ValidationError(
      "Too many searches. Please wait a moment and try again.",
      { code: RATE_LIMITED_CODE, key, retryAfterMs }
    );
  }
}

export function resolveRateLimitKey({
  userId,
  headers,
  trustForwardedHeaders,
}: {
  userId?: string;
  headers: Headers;
  trustForwardedHeaders: boolean;
}): string {
  if (userId) return `user:${userId}`;
  if (!trustForwardedHeaders) return "ip:unknown";

  const forwarded = headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  const address = forwarded || headers.get("x-real-ip")?.trim();
  return `ip:${address || "unknown"}`;
}
