import { describe, expect, it, vi } from "vitest";

import { createResponseCache } from "./response-cache";

function createClock(startMs = 0) {
  let nowMs = startMs;
  return {
    now: () => nowMs,
    advance: (ms: number) => {
      nowMs += ms;
    },
  };
}

describe("createResponseCache", () => {
  describe("given a value loaded within the TTL", () => {
    it("returns the cached value without loading again", async () => {
      const clock = createClock();
      const cache = createResponseCache({
        ttlMs: 1_000,
        maxEntries: 10,
        now: clock.now,
      });
      const load = vi.fn().mockResolvedValue("first");

      await cache.getOrLoad("key", load);
      clock.advance(999);
      const second = await cache.getOrLoad("key", load);

      expect(second).toBe("first");
      expect(load).toHaveBeenCalledOnce();
    });
  });

  describe("given the TTL has passed", () => {
    it("loads a fresh value", async () => {
      const clock = createClock();
      const cache = createResponseCache({
        ttlMs: 1_000,
        maxEntries: 10,
        now: clock.now,
      });
      const load = vi
        .fn()
        .mockResolvedValueOnce("stale")
        .mockResolvedValueOnce("fresh");

      await cache.getOrLoad("key", load);
      clock.advance(1_000);
      const second = await cache.getOrLoad("key", load);

      expect(second).toBe("fresh");
    });
  });

  describe("given two concurrent loads for the same key", () => {
    it("shares one in-flight load", async () => {
      const cache = createResponseCache({ ttlMs: 1_000, maxEntries: 10 });
      const load = vi.fn().mockResolvedValue("shared");

      const results = await Promise.all([
        cache.getOrLoad("key", load),
        cache.getOrLoad("key", load),
      ]);

      expect(results).toEqual(["shared", "shared"]);
      expect(load).toHaveBeenCalledOnce();
    });
  });

  describe("given a load that fails", () => {
    it("does not cache the failure", async () => {
      const cache = createResponseCache({ ttlMs: 1_000, maxEntries: 10 });
      const load = vi
        .fn()
        .mockRejectedValueOnce(new Error("upstream down"))
        .mockResolvedValueOnce("recovered");

      await expect(cache.getOrLoad("key", load)).rejects.toThrow(
        "upstream down"
      );
      const second = await cache.getOrLoad("key", load);

      expect(second).toBe("recovered");
    });
  });

  describe("given more keys than maxEntries", () => {
    it("evicts the least recently used key", async () => {
      const cache = createResponseCache({ ttlMs: 1_000, maxEntries: 2 });
      const load = vi.fn((value: string) => Promise.resolve(value));

      await cache.getOrLoad("a", () => load("a"));
      await cache.getOrLoad("b", () => load("b"));
      await cache.getOrLoad("a", () => load("a"));
      await cache.getOrLoad("c", () => load("c"));
      await cache.getOrLoad("a", () => load("a"));
      await cache.getOrLoad("b", () => load("b"));

      expect(load.mock.calls.map(([value]) => value)).toEqual([
        "a",
        "b",
        "c",
        "b",
      ]);
    });
  });

  describe("given the cache was cleared", () => {
    it("loads again", async () => {
      const cache = createResponseCache({ ttlMs: 1_000, maxEntries: 10 });
      const load = vi.fn().mockResolvedValue("value");

      await cache.getOrLoad("key", load);
      cache.clear();
      await cache.getOrLoad("key", load);

      expect(load).toHaveBeenCalledTimes(2);
    });
  });
});
