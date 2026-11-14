import { env } from "@env";

type PacerOptions = { minIntervalMs?: number };

export type Pacer = { waitForTurn(): Promise<void> };

/**
 * Serves callers one at a time, at least `minIntervalMs` apart. The first
 * caller, and any caller after a quiet gap, goes straight through; an unset or
 * zero interval turns pacing off.
 */
export function createPacer({ minIntervalMs }: PacerOptions): Pacer {
  const interval = minIntervalMs ?? 0;
  let nextFreeAt = 0;

  return {
    async waitForTurn() {
      if (interval <= 0) return;
      const now = Date.now();
      const turnAt = Math.max(now, nextFreeAt);
      nextFreeAt = turnAt + interval;
      const delay = turnAt - now;
      if (delay > 0) {
        await new Promise<void>((resolve) => setTimeout(resolve, delay));
      }
    },
  };
}

let envPacer: Pacer | undefined;

/** Reads `IGDB_MIN_INTERVAL_MS` on first use, not at import. */
export const igdbPacer: Pacer = {
  waitForTurn() {
    envPacer ??= createPacer({ minIntervalMs: env.IGDB_MIN_INTERVAL_MS });
    return envPacer.waitForTurn();
  },
};
