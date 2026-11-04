import { describe, expect, it } from "vitest";

import { calculateSmartStatus } from "./calculate-smart-status";

describe("calculateSmartStatus", () => {
  describe("given playtime is null", () => {
    it("returns WANT", () => {
      expect(calculateSmartStatus({ playtime: null, lastPlayedAt: null })).toBe(
        "WANT"
      );
    });
  });

  describe("given playtime is 0 and never played", () => {
    it("returns WANT (haven't started)", () => {
      expect(calculateSmartStatus({ playtime: 0, lastPlayedAt: null })).toBe(
        "WANT"
      );
    });
  });

  describe("given lastPlayedAt is exactly inside the 7 day window and outside it", () => {
    it("returns PLAYING at 6 days and WANT at 8 days", () => {
      const day = 24 * 60 * 60 * 1000;
      expect(
        calculateSmartStatus({
          playtime: 10,
          lastPlayedAt: new Date(Date.now() - 6 * day),
        })
      ).toBe("PLAYING");
      expect(
        calculateSmartStatus({
          playtime: 10,
          lastPlayedAt: new Date(Date.now() - 8 * day),
        })
      ).toBe("WANT");
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
    it("returns WANT (played but set aside — never auto-DONE)", () => {
      const oldDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000); // 30 days ago
      expect(
        calculateSmartStatus({ playtime: 300, lastPlayedAt: oldDate })
      ).toBe("WANT");
    });
  });

  describe("given playtime > 0 and lastPlayedAt is null", () => {
    it("returns WANT (no recent session recorded — never auto-DONE)", () => {
      expect(calculateSmartStatus({ playtime: 60, lastPlayedAt: null })).toBe(
        "WANT"
      );
    });
  });

  describe("given a brief, stale session (the destructive-default case)", () => {
    it("returns WANT, not DONE, for a 48-minute game last played 9 days ago", () => {
      const nineDaysAgo = new Date(Date.now() - 9 * 24 * 60 * 60 * 1000);
      expect(
        calculateSmartStatus({ playtime: 48, lastPlayedAt: nineDaysAgo })
      ).toBe("WANT");
    });
  });
});
