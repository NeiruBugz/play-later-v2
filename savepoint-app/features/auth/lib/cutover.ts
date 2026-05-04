import { env } from "@/env.mjs";

export const BANNER_WINDOW_MS = 48 * 60 * 60 * 1000;

export function getCutoverAt(): Date | null {
  const raw = env.AUTH_MIGRATION_CUTOVER_AT;
  if (!raw) return null;

  const parsed = new Date(raw);
  if (isNaN(parsed.getTime())) return null;

  return parsed;
}

export function isInBannerWindow(now: Date): boolean {
  const cutoverAt = getCutoverAt();
  if (!cutoverAt) return false;

  const windowStart = new Date(cutoverAt.getTime() - BANNER_WINDOW_MS);
  return now >= windowStart && now < cutoverAt;
}

export function isPostCutover(now: Date): boolean {
  const cutoverAt = getCutoverAt();
  if (!cutoverAt) return false;

  return now >= cutoverAt;
}
