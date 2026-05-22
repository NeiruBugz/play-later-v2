import { describe, expect, it } from "vitest";

import { calculateSmartStatus } from "./calculate-smart-status";

describe("calculateSmartStatus", () => {
  describe("given playtime is null", () => {
    it("returns SHELF", () => {
      expect(calculateSmartStatus({ playtime: null, lastPlayedAt: null })).toBe(
        "SHELF"
      );
    });
  });

  describe("given playtime is 0", () => {
    it("returns SHELF (haven't started)", () => {
      expect(calculateSmartStatus({ playtime: 0, lastPlayedAt: null })).toBe(
        "SHELF"
      );
    });
  });

  describe("given playtime > 0 and lastPlayedAt is within the last 7 days", () => {
    it("returns PLAYING", () => {
      const recentDate = new Date(Date.now() - 2 * 24 * 60 * 60 * 1000); // 2 days ago
      expect(
        calculateSmartStatus({ playtime: 120, lastPlayedAt: recentDate })
      ).toBe("PLAYING");
    });
  });

  describe("given playtime > 0 and lastPlayedAt is more than 7 days ago", () => {
    it("returns PLAYED", () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      expect(
        calculateSmartStatus({ playtime: 300, lastPlayedAt: oldDate })
      ).toBe("PLAYED");
    });
  });

  describe("given playtime > 0 and lastPlayedAt is null", () => {
    it("returns PLAYED (no recent session recorded)", () => {
      expect(calculateSmartStatus({ playtime: 60, lastPlayedAt: null })).toBe(
        "PLAYED"
      );
    });
  });
});
