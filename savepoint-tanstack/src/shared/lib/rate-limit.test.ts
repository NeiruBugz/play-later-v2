// @vitest-environment node
import { describe, expect, it, vi } from "vitest";

import { ValidationError } from "./errors";
import {
  assertWithinLimit,
  createFixedWindowLimiter,
  failOpen,
  resolveRateLimitKey,
} from "./rate-limit";

const WINDOW_MS = 60_000;

function createClock(start = 1_000_000) {
  let current = start;
  return {
    now: () => current,
    advance: (ms: number) => {
      current += ms;
    },
  };
}

describe("createFixedWindowLimiter", () => {
  describe("given a limit of 3 per window", () => {
    it("allows the first 3 calls and rejects the 4th", async () => {
      const clock = createClock();
      const limiter = createFixedWindowLimiter({
        limit: 3,
        windowMs: WINDOW_MS,
        now: clock.now,
      });

      const results = [];
      for (let i = 0; i < 4; i++) results.push(await limiter.consume("k"));

      expect(results.map((r) => r.allowed)).toEqual([true, true, true, false]);
    });

    it("reports how long until the window resets", async () => {
      const clock = createClock();
      const limiter = createFixedWindowLimiter({
        limit: 1,
        windowMs: WINDOW_MS,
        now: clock.now,
      });
      await limiter.consume("k");
      clock.advance(15_000);

      expect((await limiter.consume("k")).retryAfterMs).toBe(45_000);
    });

    it("allows calls again once the window has elapsed", async () => {
      const clock = createClock();
      const limiter = createFixedWindowLimiter({
        limit: 1,
        windowMs: WINDOW_MS,
        now: clock.now,
      });
      await limiter.consume("k");
      clock.advance(WINDOW_MS);

      expect((await limiter.consume("k")).allowed).toBe(true);
    });

    it("counts each key separately", async () => {
      const clock = createClock();
      const limiter = createFixedWindowLimiter({
        limit: 1,
        windowMs: WINDOW_MS,
        now: clock.now,
      });
      await limiter.consume("a");

      expect((await limiter.consume("b")).allowed).toBe(true);
      expect((await limiter.consume("a")).allowed).toBe(false);
    });
  });
});

describe("assertWithinLimit", () => {
  it("throws a ValidationError with the RATE_LIMITED code once exhausted", async () => {
    const clock = createClock();
    const limiter = createFixedWindowLimiter({
      limit: 1,
      windowMs: WINDOW_MS,
      now: clock.now,
    });
    await assertWithinLimit(limiter, "k");

    const error = await assertWithinLimit(limiter, "k").catch((e) => e);

    expect(error).toBeInstanceOf(ValidationError);
    expect(error.context).toMatchObject({ code: "RATE_LIMITED" });
  });
});

describe("resolveRateLimitKey", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.7, 10.0.0.1",
    "x-real-ip": "198.51.100.2",
  });

  it("keys signed-in callers by user id", () => {
    expect(
      resolveRateLimitKey({
        userId: "u1",
        headers,
        trustForwardedHeaders: true,
      })
    ).toBe("user:u1");
  });

  it("keys anonymous callers by the first forwarded address when the platform sets it", () => {
    expect(resolveRateLimitKey({ headers, trustForwardedHeaders: true })).toBe(
      "ip:203.0.113.7"
    );
  });

  it("ignores forwarded headers when the platform does not set them", () => {
    expect(resolveRateLimitKey({ headers, trustForwardedHeaders: false })).toBe(
      "ip:unknown"
    );
  });

  it("falls back to a shared bucket when no address is present", () => {
    expect(
      resolveRateLimitKey({
        headers: new Headers(),
        trustForwardedHeaders: true,
      })
    ).toBe("ip:unknown");
  });
});

describe("failOpen", () => {
  it("allows the call and reports the error when the backing store fails", async () => {
    const onError = vi.fn();
    const failure = new Error("redis unreachable");
    const limiter = failOpen(
      {
        consume: async () => {
          throw failure;
        },
      },
      onError
    );

    expect(await limiter.consume("k")).toEqual({
      allowed: true,
      retryAfterMs: 0,
    });
    expect(onError).toHaveBeenCalledWith(failure);
  });

  it("passes through the decision when the store works", async () => {
    const limiter = failOpen(
      { consume: async () => ({ allowed: false, retryAfterMs: 5 }) },
      vi.fn()
    );

    expect(await limiter.consume("k")).toEqual({
      allowed: false,
      retryAfterMs: 5,
    });
  });
});
