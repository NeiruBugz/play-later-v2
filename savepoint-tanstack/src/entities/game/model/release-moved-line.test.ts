import { describe, expect, it } from "vitest";

import { shouldShowMovedLine, type CalendarDay } from "./release-date";

const TODAY: CalendarDay = "2026-11-12";

const movedOn = (movedAt: string, movedFrom = "2026-12-10T00:00:00Z") => ({
  releaseDateMovedFrom: new Date(movedFrom),
  releaseDateMovedAt: new Date(movedAt),
});

const nothingMoved = {
  releaseDateMovedFrom: null,
  releaseDateMovedAt: null,
};

describe(shouldShowMovedLine, () => {
  describe("given a game whose date moved", () => {
    it.each([
      ["today", "2026-11-12T08:15:00Z"],
      ["yesterday", "2026-11-11T08:15:00Z"],
      ["7 days ago", "2026-11-05T08:15:00Z"],
      ["14 days ago, at the start of that day", "2026-10-29T00:00:00Z"],
      ["14 days ago, at the end of that day", "2026-10-29T23:59:59Z"],
    ])("shows the line when it moved %s", (_description, movedAt) => {
      expect(shouldShowMovedLine(movedOn(movedAt), TODAY)).toBe(true);
    });

    it.each([
      ["15 days ago, at the end of that day", "2026-10-28T23:59:59Z"],
      ["15 days ago, at the start of that day", "2026-10-28T00:00:00Z"],
      ["a month ago", "2026-10-12T08:15:00Z"],
    ])("hides the line when it moved %s", (_description, movedAt) => {
      expect(shouldShowMovedLine(movedOn(movedAt), TODAY)).toBe(false);
    });

    it("still shows the line when the move is stamped one UTC day ahead of a device west of London", () => {
      expect(shouldShowMovedLine(movedOn("2026-11-13T01:00:00Z"), TODAY)).toBe(
        true
      );
    });
  });

  describe("given the 14 days cross a month or year boundary", () => {
    it("counts February days correctly: 14 days before 5 Mar is 19 Feb", () => {
      expect(
        shouldShowMovedLine(movedOn("2026-02-19T10:00:00Z"), "2026-03-05")
      ).toBe(true);
      expect(
        shouldShowMovedLine(movedOn("2026-02-18T10:00:00Z"), "2026-03-05")
      ).toBe(false);
    });

    it("counts across New Year: 14 days before 10 Jan is 27 Dec", () => {
      expect(
        shouldShowMovedLine(movedOn("2026-12-27T10:00:00Z"), "2027-01-10")
      ).toBe(true);
      expect(
        shouldShowMovedLine(movedOn("2026-12-26T10:00:00Z"), "2027-01-10")
      ).toBe(false);
    });
  });

  describe("given nothing moved", () => {
    it("hides the line", () => {
      expect(shouldShowMovedLine(nothingMoved, TODAY)).toBe(false);
    });

    it("hides the line when only the old date is recorded", () => {
      expect(
        shouldShowMovedLine(
          {
            releaseDateMovedFrom: new Date("2026-12-10T00:00:00Z"),
            releaseDateMovedAt: null,
          },
          TODAY
        )
      ).toBe(false);
    });

    it("hides the line when only the time of the move is recorded", () => {
      expect(
        shouldShowMovedLine(
          {
            releaseDateMovedFrom: null,
            releaseDateMovedAt: new Date("2026-11-10T08:15:00Z"),
          },
          TODAY
        )
      ).toBe(false);
    });
  });
});
