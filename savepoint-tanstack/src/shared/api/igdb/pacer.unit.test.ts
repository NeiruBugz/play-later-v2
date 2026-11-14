/**
 * RED unit test for spec 030 tech 2.5 (pacing).
 *
 * Contract: `pacer.ts` exports
 *   createPacer(options: { minIntervalMs?: number }): { waitForTurn(): Promise<void> }
 *     - callers are served one at a time, at least `minIntervalMs` apart
 *       (measured with Date.now and spaced with setTimeout)
 *     - the first caller, and any caller after a quiet gap, goes straight through
 *     - unset or 0 means no pacing at all
 *   igdbPacer = createPacer({ minIntervalMs: env.IGDB_MIN_INTERVAL_MS })
 *     - `IGDB_MIN_INTERVAL_MS` is an optional number in the env schema
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { createPacer } from "./pacer";

const INTERVAL_MS = 750;

const elements = {
  trackTurn: (pacer: ReturnType<typeof createPacer>) => {
    const turn = { granted: false };
    void pacer.waitForTurn().then(() => {
      turn.granted = true;
    });
    return turn;
  },
};

const actions = {
  passTime: (milliseconds: number) => vi.advanceTimersByTimeAsync(milliseconds),
};

describe(createPacer, () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "Date"],
      shouldAdvanceTime: false,
    });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given a minimum interval of 750 ms", () => {
    let pacer: ReturnType<typeof createPacer>;

    beforeEach(() => {
      pacer = createPacer({ minIntervalMs: INTERVAL_MS });
    });

    describe("when the first caller asks", () => {
      it("is let through at once", async () => {
        const turn = elements.trackTurn(pacer);
        await actions.passTime(0);

        expect(turn.granted).toBe(true);
      });
    });

    describe("when a second caller asks right after the first", () => {
      let second: { granted: boolean };

      beforeEach(async () => {
        elements.trackTurn(pacer);
        await actions.passTime(0);
        second = elements.trackTurn(pacer);
      });

      it("waits while the interval has not passed", async () => {
        await actions.passTime(INTERVAL_MS - 1);

        expect(second.granted).toBe(false);
      });

      it("is let through once the interval has passed", async () => {
        await actions.passTime(INTERVAL_MS);

        expect(second.granted).toBe(true);
      });
    });

    describe("when three callers ask at the same moment", () => {
      let turns: Array<{ granted: boolean }>;

      beforeEach(() => {
        turns = [
          elements.trackTurn(pacer),
          elements.trackTurn(pacer),
          elements.trackTurn(pacer),
        ];
      });

      it("serves them one interval apart", async () => {
        await actions.passTime(0);
        const atStart = turns.map((t) => t.granted);
        await actions.passTime(INTERVAL_MS);
        const afterOne = turns.map((t) => t.granted);
        await actions.passTime(INTERVAL_MS);
        const afterTwo = turns.map((t) => t.granted);

        expect([atStart, afterOne, afterTwo]).toEqual([
          [true, false, false],
          [true, true, false],
          [true, true, true],
        ]);
      });
    });

    describe("when a caller asks after a long quiet gap", () => {
      it("is let through at once", async () => {
        elements.trackTurn(pacer);
        await actions.passTime(10 * INTERVAL_MS);
        const late = elements.trackTurn(pacer);
        await actions.passTime(0);

        expect(late.granted).toBe(true);
      });
    });
  });

  describe.each([
    ["no interval is configured", undefined],
    ["the interval is 0", 0],
  ])("given %s", (_label, minIntervalMs) => {
    it("lets every caller through without waiting", async () => {
      const pacer = createPacer({ minIntervalMs });
      const turns = [
        elements.trackTurn(pacer),
        elements.trackTurn(pacer),
        elements.trackTurn(pacer),
      ];
      await actions.passTime(0);

      expect(turns.map((t) => t.granted)).toEqual([true, true, true]);
    });
  });
});

describe("igdbPacer", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "Date"],
      shouldAdvanceTime: false,
    });
    vi.setSystemTime(new Date("2026-01-01T00:00:00.000Z"));
  });

  afterEach(() => {
    vi.doUnmock("@env");
    vi.useRealTimers();
  });

  describe("given IGDB_MIN_INTERVAL_MS is set to 750", () => {
    it("spaces callers 750 ms apart", async () => {
      vi.doMock("@env", () => ({ env: { IGDB_MIN_INTERVAL_MS: INTERVAL_MS } }));
      const { igdbPacer } = await import("./pacer");
      elements.trackTurn(igdbPacer);
      await actions.passTime(0);
      const second = elements.trackTurn(igdbPacer);
      await actions.passTime(INTERVAL_MS - 1);
      const beforeInterval = second.granted;
      await actions.passTime(1);

      expect([beforeInterval, second.granted]).toEqual([false, true]);
    });
  });

  describe("given IGDB_MIN_INTERVAL_MS is not set", () => {
    it("does not delay callers", async () => {
      vi.doMock("@env", () => ({ env: {} }));
      const { igdbPacer } = await import("./pacer");
      elements.trackTurn(igdbPacer);
      const second = elements.trackTurn(igdbPacer);
      await actions.passTime(0);

      expect(second.granted).toBe(true);
    });
  });
});
