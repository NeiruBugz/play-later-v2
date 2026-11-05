type CacheEntry<T> = { value: T; expiresAt: number };

type ResponseCacheOptions = {
  ttlMs: number;
  maxEntries: number;
  now?: () => number;
};

export type ResponseCache<T> = {
  getOrLoad: (key: string, load: () => Promise<T>) => Promise<T>;
  clear: () => void;
};

export function createResponseCache<T>({
  ttlMs,
  maxEntries,
  now = Date.now,
}: ResponseCacheOptions): ResponseCache<T> {
  const entries = new Map<string, CacheEntry<T>>();
  const inFlight = new Map<string, Promise<T>>();

  function readFresh(key: string): CacheEntry<T> | undefined {
    const entry = entries.get(key);
    if (!entry) return undefined;
    entries.delete(key);
    if (entry.expiresAt <= now()) return undefined;
    entries.set(key, entry);
    return entry;
  }

  function store(key: string, value: T): void {
    entries.set(key, { value, expiresAt: now() + ttlMs });
    while (entries.size > maxEntries) {
      const leastRecentlyUsedKey = entries.keys().next().value as string;
      entries.delete(leastRecentlyUsedKey);
    }
  }

  return {
    async getOrLoad(key, load) {
      const fresh = readFresh(key);
      if (fresh) return fresh.value;

      const pending = inFlight.get(key);
      if (pending) return pending;

      const loading = load()
        .then((value) => {
          store(key, value);
          return value;
        })
        .finally(() => {
          inFlight.delete(key);
        });
      inFlight.set(key, loading);
      return loading;
    },
    clear() {
      entries.clear();
      inFlight.clear();
    },
  };
}

const IGDB_RESPONSE_TTL_MS = 10 * 60 * 1000;
const IGDB_RESPONSE_MAX_ENTRIES = 500;

export const igdbResponseCache = createResponseCache<unknown>({
  ttlMs: IGDB_RESPONSE_TTL_MS,
  maxEntries: IGDB_RESPONSE_MAX_ENTRIES,
});
