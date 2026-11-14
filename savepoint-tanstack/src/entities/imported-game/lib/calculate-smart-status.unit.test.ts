/**
 * RED unit test for spec 030 Slice 3: `calculateSmartStatus` moves from
 * `features/steam-import/lib/` to `entities/imported-game/lib/` so the
 * background sync (a feature) and the manual import (another feature) can both
 * use it without a sibling-feature import.
 *
 * CONTRACT
 *   src/entities/imported-game/lib/calculate-smart-status.ts
 *   calculateSmartStatus({ playtime?: number | null; lastPlayedAt: Date | null | undefined })
 *     -> LibraryItemStatus
 *     - PLAYING when the game was last played within 7 days of now
 *     - WANT otherwise (never played, or played longer ago); DONE is never inferred
 *     - playtime does not change the answer
 *   The clock is Date.now(); the tests inject it with fake timers.
 */
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { calculateSmartStatus } from "./calculate-smart-status";

const NOW = new Date("2026-11-14T12:00:00.000Z");
const DAY_MS = 24 * 60 * 60 * 1000;
const daysAgo = (days: number) => new Date(NOW.getTime() - days * DAY_MS);

beforeEach(() => {
  vi.useFakeTimers();
  vi.setSystemTime(NOW);
});

afterEach(() => {
  vi.useRealTimers();
});

describe(calculateSmartStatus, () => {
  describe.each([
    { given: "never played (null)", lastPlayedAt: null },
    { given: "never played (undefined)", lastPlayedAt: undefined },
  ])("given a game $given", ({ lastPlayedAt }) => {
    it.each([null, 0, 600])(
      "returns WANT whatever the playtime (%s)",
      (playtime) => {
        expect(calculateSmartStatus({ playtime, lastPlayedAt })).toBe("WANT");
      }
    );
  });

  describe.each([
    {
      given: "an hour ago",
      lastPlayedAt: daysAgo(1 / 24),
      expected: "PLAYING",
    },
    { given: "2 days ago", lastPlayedAt: daysAgo(2), expected: "PLAYING" },
    { given: "6 days ago", lastPlayedAt: daysAgo(6), expected: "PLAYING" },
    { given: "8 days ago", lastPlayedAt: daysAgo(8), expected: "WANT" },
    { given: "30 days ago", lastPlayedAt: daysAgo(30), expected: "WANT" },
    { given: "a year ago", lastPlayedAt: daysAgo(365), expected: "WANT" },
  ])("given a game last played $given", ({ lastPlayedAt, expected }) => {
    it(`returns ${expected}`, () => {
      expect(calculateSmartStatus({ playtime: 120, lastPlayedAt })).toBe(
        expected
      );
    });
  });

  describe("given a game last played just inside and just outside the 7 day window", () => {
    it("returns PLAYING one hour inside it and WANT one hour outside it", () => {
      const justInside = new Date(NOW.getTime() - 7 * DAY_MS + 60 * 60 * 1000);
      const justOutside = new Date(NOW.getTime() - 7 * DAY_MS - 60 * 60 * 1000);

      expect(
        calculateSmartStatus({ playtime: 10, lastPlayedAt: justInside })
      ).toBe("PLAYING");
      expect(
        calculateSmartStatus({ playtime: 10, lastPlayedAt: justOutside })
      ).toBe("WANT");
    });
  });

  describe("given the clock moves forward after a recent play", () => {
    it("stops returning PLAYING once the play is more than 7 days old", () => {
      const lastPlayedAt = daysAgo(2);
      expect(calculateSmartStatus({ playtime: 50, lastPlayedAt })).toBe(
        "PLAYING"
      );

      vi.setSystemTime(new Date(NOW.getTime() + 6 * DAY_MS));

      expect(calculateSmartStatus({ playtime: 50, lastPlayedAt })).toBe("WANT");
    });
  });

  describe("given a brief, stale session", () => {
    it("returns WANT, never DONE", () => {
      expect(
        calculateSmartStatus({ playtime: 48, lastPlayedAt: daysAgo(9) })
      ).toBe("WANT");
    });
  });
});
