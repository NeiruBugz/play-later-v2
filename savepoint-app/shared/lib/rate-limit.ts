import type { NextRequest } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimit = new Map<string, RateLimitRecord>();

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
