import { describe, expect, it } from "vitest";

import { formatRelativeTime } from "./format-relative-time";

const now = new Date("2026-05-18T12:00:00.000Z");
const daysAgo = (days: number) => new Date(now.getTime() - days * 86_400_000);

describe("formatRelativeTime", () => {
  describe("given a date 11 days before now", () => {
    it("renders '11 days ago'", () => {
      expect(formatRelativeTime(daysAgo(11), now)).toBe("11 days ago");
    });
  });

  describe("given a date 1 day before now", () => {
    it("renders 'yesterday'", () => {
      expect(formatRelativeTime(daysAgo(1), now)).toBe("yesterday");
    });
  });

  describe("given a date earlier today", () => {
    it("renders 'today'", () => {
      expect(formatRelativeTime(now, now)).toBe("today");
    });
  });

  describe("given a date 90 days before now", () => {
    it("falls back to an absolute short date", () => {
      const result = formatRelativeTime(daysAgo(90), now);
      expect(result).not.toMatch(/ago/);
      expect(result.length).toBeGreaterThan(0);
    });
  });
});
