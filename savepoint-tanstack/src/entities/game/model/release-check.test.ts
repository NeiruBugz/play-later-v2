import { describe, expect, it } from "vitest";

import { applyReleaseCheck, isDueForCheck } from "./release-check";
import type { ReleaseDatePrecision } from "./release-date";

const NOW = new Date("2026-11-12T12:00:00Z");

const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);
const hoursBefore = (now: Date, hours: number) =>
  new Date(now.getTime() - hours * 3_600_000);
const daysBefore = (now: Date, days: number) => hoursBefore(now, days * 24);

type StoredRelease = {
  releaseDate: Date | null;
  releaseDatePrecision: ReleaseDatePrecision | null;
};
type FreshRelease = {
  releaseDate: Date | null;
  precision: ReleaseDatePrecision | null;
};

const storedExactDay = (day: string): StoredRelease => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: "DAY",
});
const storedMonth = (firstDay: string): StoredRelease => ({
  releaseDate: utcMidnight(firstDay),
  releaseDatePrecision: "MONTH",
});
const storedQuarter = (firstDay: string): StoredRelease => ({
  releaseDate: utcMidnight(firstDay),
  releaseDatePrecision: "QUARTER",
});
const storedYear = (firstDay: string): StoredRelease => ({
  releaseDate: utcMidnight(firstDay),
  releaseDatePrecision: "YEAR",
});
const storedTba: StoredRelease = {
  releaseDate: null,
  releaseDatePrecision: "TBA",
};
const storedNoDate: StoredRelease = {
  releaseDate: null,
  releaseDatePrecision: null,
};
const storedLegacy = (day: string): StoredRelease => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: null,
});

const freshExactDay = (day: string): FreshRelease => ({
  releaseDate: utcMidnight(day),
  precision: "DAY",
});
const freshMonth = (firstDay: string): FreshRelease => ({
  releaseDate: utcMidnight(firstDay),
  precision: "MONTH",
});
const freshQuarter = (firstDay: string): FreshRelease => ({
  releaseDate: utcMidnight(firstDay),
  precision: "QUARTER",
});
const freshYear = (firstDay: string): FreshRelease => ({
  releaseDate: utcMidnight(firstDay),
  precision: "YEAR",
});
const freshTba: FreshRelease = { releaseDate: null, precision: "TBA" };

const checkedAgo = (checkedAt: Date | null) => ({
  releaseDateCheckedAt: checkedAt,
});

describe(isDueForCheck, () => {
  describe("given a game with an exact date today or within the next 14 days", () => {
    it.each([
      ["today, never checked", "2026-11-12", null, true],
      ["in 5 days, last checked 25 hours ago", "2026-11-17", 25, true],
      ["in 5 days, last checked 23 hours ago", "2026-11-17", 23, false],
      ["in 14 days, last checked 2 days ago", "2026-11-26", 48, true],
      ["in 14 days, last checked 12 hours ago", "2026-11-26", 12, false],
      ["yesterday (one day of slack), never checked", "2026-11-11", null, true],
    ])("%s: due is %s", (_description, day, hoursSinceCheck, expected) => {
      const checkedAt =
        hoursSinceCheck === null ? null : hoursBefore(NOW, hoursSinceCheck);

      expect(
        isDueForCheck({ ...storedExactDay(day), ...checkedAgo(checkedAt) }, NOW)
      ).toBe(expected);
    });
  });

  describe("given an upcoming game that is not an exact date within 14 days", () => {
    const weeklyCases: Array<[string, StoredRelease]> = [
      ["an exact date in 20 days", storedExactDay("2026-12-02")],
      ["an exact date next year", storedExactDay("2027-03-14")],
      ["a month still running", storedMonth("2026-11-01")],
      ["a later month", storedMonth("2027-03-01")],
      ["a quarter", storedQuarter("2027-04-01")],
      ["a year", storedYear("2027-01-01")],
      ["a TBA date", storedTba],
      ["no date at all", storedNoDate],
    ];

    it.each(weeklyCases)("checks %s when never checked", (_name, stored) => {
      expect(isDueForCheck({ ...stored, ...checkedAgo(null) }, NOW)).toBe(true);
    });

    it.each(weeklyCases)(
      "checks %s once the last check is 8 days old",
      (_name, stored) => {
        expect(
          isDueForCheck({ ...stored, ...checkedAgo(daysBefore(NOW, 8)) }, NOW)
        ).toBe(true);
      }
    );

    it.each(weeklyCases)(
      "leaves %s alone when the last check is 2 days old",
      (_name, stored) => {
        expect(
          isDueForCheck({ ...stored, ...checkedAgo(daysBefore(NOW, 2)) }, NOW)
        ).toBe(false);
      }
    );

    it.each(weeklyCases)(
      "leaves %s alone when the last check is 6 days old",
      (_name, stored) => {
        expect(
          isDueForCheck({ ...stored, ...checkedAgo(daysBefore(NOW, 6)) }, NOW)
        ).toBe(false);
      }
    );
  });

  describe("given a game that has already come out", () => {
    it.each([
      ["an exact date 2 days ago", storedExactDay("2026-11-10")],
      ["an exact date years ago", storedExactDay("2020-06-02")],
      ["a month that ended", storedMonth("2026-10-01")],
      ["a quarter that ended", storedQuarter("2026-07-01")],
      ["a year that ended", storedYear("2025-01-01")],
    ])("never checks %s again", (_name, stored) => {
      expect(isDueForCheck({ ...stored, ...checkedAgo(null) }, NOW)).toBe(
        false
      );
      expect(
        isDueForCheck({ ...stored, ...checkedAgo(daysBefore(NOW, 30)) }, NOW)
      ).toBe(false);
    });
  });

  describe("given the end of a month, quarter or year sits right next to today", () => {
    it.each([
      ["the month ended yesterday", "2026-12-01T12:00:00Z", true],
      ["the month ended 2 days ago", "2026-12-02T12:00:00Z", false],
    ])("%s: due is %s", (_description, nowAsText, expected) => {
      expect(
        isDueForCheck(
          { ...storedMonth("2026-11-01"), ...checkedAgo(null) },
          new Date(nowAsText)
        )
      ).toBe(expected);
    });

    it.each([
      ["the year ended yesterday", "2026-01-01T12:00:00Z", true],
      ["the year ended 2 days ago", "2026-01-02T12:00:00Z", false],
    ])("%s: due is %s", (_description, nowAsText, expected) => {
      expect(
        isDueForCheck(
          { ...storedYear("2025-01-01"), ...checkedAgo(null) },
          new Date(nowAsText)
        )
      ).toBe(expected);
    });

    it("treats an exact date of yesterday as still current early in the UTC day", () => {
      expect(
        isDueForCheck(
          { ...storedExactDay("2026-11-11"), ...checkedAgo(null) },
          new Date("2026-11-12T00:30:00Z")
        )
      ).toBe(true);
    });
  });

  describe("given a legacy row whose precision was never recorded", () => {
    it("checks a past date once, while it has never been checked", () => {
      expect(
        isDueForCheck(
          { ...storedLegacy("2026-03-01"), ...checkedAgo(null) },
          NOW
        )
      ).toBe(true);
    });

    it("does not check a past date again after that one check", () => {
      expect(
        isDueForCheck(
          {
            ...storedLegacy("2026-03-01"),
            ...checkedAgo(daysBefore(NOW, 30)),
          },
          NOW
        )
      ).toBe(false);
    });

    it("checks an upcoming date that was never checked", () => {
      expect(
        isDueForCheck(
          { ...storedLegacy("2027-03-14"), ...checkedAgo(null) },
          NOW
        )
      ).toBe(true);
    });
  });
});

describe(applyReleaseCheck, () => {
  describe("given IGDB has no usable answer", () => {
    it("only stamps the check when IGDB reports the date as unknown", () => {
      expect(
        applyReleaseCheck(storedExactDay("2026-12-10"), "unknown", NOW)
      ).toEqual({ releaseDateCheckedAt: NOW });
    });

    it("only stamps the check when IGDB lost the date, never blanking the stored one", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-12-10"),
          { releaseDate: null, precision: null },
          NOW
        )
      ).toEqual({ releaseDateCheckedAt: NOW });
    });

    it("only stamps the check on a game that had no date and still has none", () => {
      expect(
        applyReleaseCheck(
          storedNoDate,
          { releaseDate: null, precision: null },
          NOW
        )
      ).toEqual({ releaseDateCheckedAt: NOW });
    });
  });

  describe("given the exact date moved while it was still ahead", () => {
    it("writes the new day and remembers the old one when an exact date moves to another exact date", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-12-10"),
          freshExactDay("2027-01-21"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-01-21"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: utcMidnight("2026-12-10"),
        releaseDateMovedAt: NOW,
      });
    });

    it("remembers the old day when the game moves up to an earlier exact date", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-12-10"),
          freshExactDay("2026-11-13"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2026-11-13"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: utcMidnight("2026-12-10"),
        releaseDateMovedAt: NOW,
      });
    });

    it("counts a move to today as still upcoming", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-12-10"),
          freshExactDay("2026-11-12"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2026-11-12"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: utcMidnight("2026-12-10"),
        releaseDateMovedAt: NOW,
      });
    });

    it("counts a game whose exact date is today as not yet past", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-11-12"),
          freshExactDay("2027-01-21"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-01-21"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: utcMidnight("2026-11-12"),
        releaseDateMovedAt: NOW,
      });
    });

    it.each([
      ["a month", freshMonth("2027-03-01"), "MONTH"],
      ["a quarter", freshQuarter("2027-04-01"), "QUARTER"],
      ["a year", freshYear("2027-01-01"), "YEAR"],
    ] as const)(
      "remembers the old day when an exact date turns into %s",
      (_name, fresh, precision) => {
        expect(
          applyReleaseCheck(storedExactDay("2026-12-10"), fresh, NOW)
        ).toEqual({
          releaseDateCheckedAt: NOW,
          releaseDate: fresh.releaseDate,
          releaseDatePrecision: precision,
          releaseDateMovedFrom: utcMidnight("2026-12-10"),
          releaseDateMovedAt: NOW,
        });
      }
    );

    it("remembers the old day when an exact date turns into a year that starts on the same day", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2027-01-01"),
          freshYear("2027-01-01"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "YEAR",
        releaseDateMovedFrom: utcMidnight("2027-01-01"),
        releaseDateMovedAt: NOW,
      });
    });

    it("remembers the old day and clears the date when an exact date turns into TBA", () => {
      expect(
        applyReleaseCheck(storedExactDay("2026-12-10"), freshTba, NOW)
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: null,
        releaseDatePrecision: "TBA",
        releaseDateMovedFrom: utcMidnight("2026-12-10"),
        releaseDateMovedAt: NOW,
      });
    });

    it("keeps only the newest old day when the date moves again", () => {
      const secondCheck = new Date("2026-11-19T12:00:00Z");

      expect(
        applyReleaseCheck(
          storedExactDay("2027-01-21"),
          freshExactDay("2027-03-04"),
          secondCheck
        )
      ).toEqual({
        releaseDateCheckedAt: secondCheck,
        releaseDate: utcMidnight("2027-03-04"),
        releaseDatePrecision: "DAY",
        releaseDateMovedFrom: utcMidnight("2027-01-21"),
        releaseDateMovedAt: secondCheck,
      });
    });
  });

  describe("given the change is an announcement or a repair, not a move", () => {
    it.each([
      ["a month", storedMonth("2027-03-01")],
      ["a quarter", storedQuarter("2027-01-01")],
      ["a year", storedYear("2027-01-01")],
      ["TBA", storedTba],
    ])(
      "writes the exact day without a moved marker when %s becomes exact",
      (_name, stored) => {
        expect(
          applyReleaseCheck(stored, freshExactDay("2027-03-14"), NOW)
        ).toEqual({
          releaseDateCheckedAt: NOW,
          releaseDate: utcMidnight("2027-03-14"),
          releaseDatePrecision: "DAY",
        });
      }
    );

    it("writes a vaguer value without a marker when one vague date becomes another", () => {
      expect(
        applyReleaseCheck(
          storedMonth("2027-03-01"),
          freshYear("2027-01-01"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "YEAR",
      });
    });

    it("writes TBA without a marker when a month becomes TBA", () => {
      expect(
        applyReleaseCheck(storedMonth("2027-03-01"), freshTba, NOW)
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: null,
        releaseDatePrecision: "TBA",
      });
    });

    it("writes the first date without a marker when a game with no date gets one", () => {
      expect(
        applyReleaseCheck(storedNoDate, freshExactDay("2027-03-14"), NOW)
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-03-14"),
        releaseDatePrecision: "DAY",
      });
    });

    it("writes the precision without a marker for a legacy row, whatever it becomes", () => {
      expect(
        applyReleaseCheck(
          storedLegacy("2026-12-31"),
          freshExactDay("2027-03-14"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-03-14"),
        releaseDatePrecision: "DAY",
      });
    });

    it("repairs a legacy year placeholder without a marker", () => {
      expect(
        applyReleaseCheck(
          storedLegacy("2026-12-31"),
          freshYear("2026-01-01"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2026-01-01"),
        releaseDatePrecision: "YEAR",
      });
    });
  });

  describe("given the new date is already in the past", () => {
    it.each([
      ["an exact day long ago", freshExactDay("2026-11-05"), "DAY"],
      ["an exact day yesterday", freshExactDay("2026-11-11"), "DAY"],
      ["a month that ended", freshMonth("2026-10-01"), "MONTH"],
      ["a quarter that ended", freshQuarter("2026-07-01"), "QUARTER"],
      ["a year that ended", freshYear("2025-01-01"), "YEAR"],
    ] as const)(
      "writes %s without a marker because the game came out early",
      (_name, fresh, precision) => {
        expect(
          applyReleaseCheck(storedExactDay("2026-12-10"), fresh, NOW)
        ).toEqual({
          releaseDateCheckedAt: NOW,
          releaseDate: fresh.releaseDate,
          releaseDatePrecision: precision,
        });
      }
    );
  });

  describe("given the stored exact day is already past", () => {
    it("writes the new date without a marker", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-11-05"),
          freshExactDay("2027-01-01"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-01-01"),
        releaseDatePrecision: "DAY",
      });
    });

    it("writes TBA without a marker", () => {
      expect(
        applyReleaseCheck(storedExactDay("2026-11-05"), freshTba, NOW)
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: null,
        releaseDatePrecision: "TBA",
      });
    });
  });

  describe("given IGDB agrees with what is stored", () => {
    it("stamps the check and repeats the stored exact day, with no marker", () => {
      expect(
        applyReleaseCheck(
          storedExactDay("2026-12-10"),
          freshExactDay("2026-12-10"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2026-12-10"),
        releaseDatePrecision: "DAY",
      });
    });

    it("stamps the check and repeats TBA, with no marker", () => {
      expect(applyReleaseCheck(storedTba, freshTba, NOW)).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: null,
        releaseDatePrecision: "TBA",
      });
    });

    it("stamps the check and repeats a stored quarter, with no marker", () => {
      expect(
        applyReleaseCheck(
          storedQuarter("2027-04-01"),
          freshQuarter("2027-04-01"),
          NOW
        )
      ).toEqual({
        releaseDateCheckedAt: NOW,
        releaseDate: utcMidnight("2027-04-01"),
        releaseDatePrecision: "QUARTER",
      });
    });
  });
});
