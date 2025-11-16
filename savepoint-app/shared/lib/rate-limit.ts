import type { NextRequest } from "next/server";

/**
 * ⚠️ IN-MEMORY RATE LIMITING - DEVELOPMENT/DEMO ONLY
 *
 * This implementation uses an in-memory Map for rate limiting, which has significant limitations:
 *
 * **Production Limitations:**
 * - ❌ Does NOT work correctly in serverless/edge environments (each function instance has its own Map)
 * - ❌ Resets on every deployment or server restart
 * - ❌ Not shared across multiple server instances or regions
 * - ❌ Memory leak potential with setInterval in serverless environments
 *
 * **For Production Use:**
 * Migrate to one of these approaches:
 * 1. **Middleware + Redis** (recommended):
 *    ```typescript
 *    // middleware.ts with @upstash/ratelimit
 *    import { Ratelimit } from '@upstash/ratelimit'
 *    import { Redis } from '@upstash/redis'
 *    ```
 * 2. **Edge middleware** with Vercel Edge Config or Cloudflare KV
 * 3. **Database-backed rate limiting** (PostgreSQL, DynamoDB)
 *
 * @see https://vercel.com/templates/next.js/upstash-rate-limiting
 * @see https://nextjs.org/docs/app/building-your-application/routing/middleware
 *
 * TODO: Migrate to Redis-based middleware rate limiting before production deployment
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimit = new Map<string, RateLimitRecord>();

// Clean up expired entries periodically
// ⚠️ This will NOT run properly in serverless environments
setInterval(
  () => {
    const now = Date.now();
    for (const [ip, record] of rateLimit.entries()) {
      if (now > record.resetAt) {
        rateLimit.delete(ip);
      }
    }
  },
  10 * 60 * 1000
);

/**
 * Check if a request is within the rate limit
 *
 * @param request - The Next.js request object
 * @param limit - Maximum number of requests allowed (default: 20)
 * @param windowMs - Time window in milliseconds (default: 1 hour)
 * @returns Object with `allowed` (boolean) and `remaining` (number of requests left)
 *
 * @example
 * ```typescript
 * const { allowed, remaining } = checkRateLimit(request);
 * if (!allowed) {
 *   return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 });
 * }
 * response.headers.set('X-RateLimit-Remaining', String(remaining));
 * ```
 */
export function checkRateLimit(
  request: NextRequest,
  limit: number = 20,
  windowMs: number = 60 * 60 * 1000
): { allowed: boolean; remaining: number } {
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();

  const record = rateLimit.get(ip);

  if (!record || now > record.resetAt) {
    rateLimit.set(ip, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }

  if (record.count >= limit) {
    return { allowed: false, remaining: 0 };
  }

  record.count++;
  return { allowed: true, remaining: limit - record.count };
}
