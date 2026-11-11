import { describe, expect, it } from "vitest";

import { formatHours, formatTimeAgo } from "./date";

describe("formatHours", () => {
  it.each([
    [90, "1.5 h"],
    [30, "0.5 h"],
    [720, "12 h"],
    [60, "1 h"],
    [45, "0.8 h"],
    [100, "1.7 h"],
  ])("formats %i minutes as %s", (minutes, expected) => {
    expect(formatHours(minutes)).toBe(expected);
  });

  it("drops the trailing .0 on whole hours", () => {
    expect(formatHours(120)).toBe("2 h");
  });
});

describe("formatTimeAgo", () => {
  const now = new Date(2026, 5, 15, 12, 0, 0);

  const daysBefore = (days: number, hour = 9) =>
    new Date(2026, 5, 15 - days, hour, 0, 0);

  it.each([
    [0, "today"],
    [1, "yesterday"],
    [2, "2 days ago"],
    [13, "13 days ago"],
    [14, "2 weeks ago"],
    [20, "2 weeks ago"],
    [21, "3 weeks ago"],
    [28, "4 weeks ago"],
    [29, "4 weeks ago"],
    [30, "a month ago"],
    [59, "a month ago"],
    [60, "2 months ago"],
    [89, "2 months ago"],
    [120, "4 months ago"],
    [364, "12 months ago"],
    [365, "over a year ago"],
    [900, "over a year ago"],
  ])("reads %i days back as %s", (days, expected) => {
    expect(formatTimeAgo(daysBefore(days), now)).toBe(expected);
  });

  describe("given calendar days rather than elapsed hours", () => {
    it("reads late yesterday evening as yesterday when it is just past midnight", () => {
      const justAfterMidnight = new Date(2026, 5, 15, 0, 30, 0);
      const lateYesterday = new Date(2026, 5, 14, 23, 30, 0);

      expect(formatTimeAgo(lateYesterday, justAfterMidnight)).toBe("yesterday");
    });

    it("reads early this morning as today when it is late at night", () => {
      const lateTonight = new Date(2026, 5, 15, 23, 59, 0);
      const earlyMorning = new Date(2026, 5, 15, 0, 1, 0);

      expect(formatTimeAgo(earlyMorning, lateTonight)).toBe("today");
    });
  });
});
