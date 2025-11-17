import { env } from "@/env.mjs";
import {
  DEFAULT_RATE_LIMIT_REQUESTS,
  DEFAULT_RATE_LIMIT_WINDOW_MS,
  RATE_LIMIT_CLEANUP_INTERVAL_MS,
} from "@/shared/constants";
import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import type { NextRequest } from "next/server";
let ratelimit: Ratelimit | null = null;
let inMemoryFallback: Map<string, { count: number; resetAt: number }> | null =
  null;
function initializeRateLimiter(): Ratelimit | null {
  if (ratelimit !== null) {
    return ratelimit;
  }
  if (env.UPSTASH_REDIS_REST_URL && env.UPSTASH_REDIS_REST_TOKEN) {
    const redis = new Redis({
      url: env.UPSTASH_REDIS_REST_URL,
      token: env.UPSTASH_REDIS_REST_TOKEN,
    });
    ratelimit = new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(DEFAULT_RATE_LIMIT_REQUESTS, "1 h"),
      analytics: true,
      prefix: "savepoint:ratelimit",
    });
    return ratelimit;
  }
  if (env.NODE_ENV === "production") {
    throw new Error(
      "UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production"
    );
  }
  if (!inMemoryFallback) {
    inMemoryFallback = new Map();
    if (typeof setInterval !== "undefined") {
      setInterval(
        () => {
          const now = Date.now();
          for (const [key, record] of inMemoryFallback!.entries()) {
            if (now > record.resetAt) {
              inMemoryFallback!.delete(key);
            }
          }
        },
        RATE_LIMIT_CLEANUP_INTERVAL_MS
      );
    }
  }
  return null;
}
export async function checkRateLimit(
  request: NextRequest,
  limit: number = DEFAULT_RATE_LIMIT_REQUESTS,
  windowMs: number = DEFAULT_RATE_LIMIT_WINDOW_MS
): Promise<{ allowed: boolean; remaining: number }> {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const limiter = initializeRateLimiter();
  if (limiter) {
    const { success, remaining } = await limiter.limit(ip);
    return { allowed: success, remaining };
  }
  const now = Date.now();
  const record = inMemoryFallback!.get(ip);
  if (!record || now > record.resetAt) {
    inMemoryFallback!.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }
  record.count++;
  return { allowed: true, remaining: limit - record.count };
}
