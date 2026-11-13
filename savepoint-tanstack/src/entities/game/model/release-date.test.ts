import { describe, expect, it } from "vitest";

import {
  describeReleaseFact,
  deviceToday,
  formatReleaseLabel,
  isUpcomingRelease,
  releasePeriodEnd,
  toStoredDay,
  type CalendarDay,
  type ReleaseGame,
} from "./release-date";

const TODAY: CalendarDay = "2026-11-12";

const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);

const exactDay = (day: string): ReleaseGame => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: "DAY",
});
const wholeMonth = (firstDayOfMonth: string): ReleaseGame => ({
  releaseDate: utcMidnight(firstDayOfMonth),
  releaseDatePrecision: "MONTH",
});
const wholeQuarter = (firstDayOfQuarter: string): ReleaseGame => ({
  releaseDate: utcMidnight(firstDayOfQuarter),
  releaseDatePrecision: "QUARTER",
});
const wholeYear = (year: number): ReleaseGame => ({
  releaseDate: utcMidnight(`${year}-01-01`),
  releaseDatePrecision: "YEAR",
});
const toBeAnnounced: ReleaseGame = {
  releaseDate: null,
  releaseDatePrecision: "TBA",
};
const noDateAtAll: ReleaseGame = {
  releaseDate: null,
  releaseDatePrecision: null,
};
const neverChecked = (day: string): ReleaseGame => ({
  releaseDate: utcMidnight(day),
  releaseDatePrecision: null,
});

describe("toStoredDay", () => {
  it.each([
    ["the very start of 14 Mar UTC", "2027-03-14T00:00:00.000Z", "2027-03-14"],
    ["the very end of 14 Mar UTC", "2027-03-14T23:59:59.999Z", "2027-03-14"],
    ["the first day of a year", "2027-01-01T00:00:00.000Z", "2027-01-01"],
    ["the last day of a year", "2026-12-31T00:00:00.000Z", "2026-12-31"],
  ])(
    "reads %s as the same calendar day on any device",
    (_description, instant, expectedDay) => {
      expect(toStoredDay(new Date(instant))).toBe(expectedDay);
    }
  );
});

describe("deviceToday", () => {
  it.each([
    ["just after midnight", new Date(2026, 10, 12, 0, 30), "2026-11-12"],
    ["midday", new Date(2026, 10, 12, 12, 0), "2026-11-12"],
    ["just before midnight", new Date(2026, 10, 12, 23, 30), "2026-11-12"],
    ["a single-digit month and day", new Date(2027, 0, 5, 9, 0), "2027-01-05"],
    ["the last day of a year", new Date(2026, 11, 31, 22, 0), "2026-12-31"],
  ])("reads %s on the device clock as its own calendar day", (_d, now, day) => {
    expect(deviceToday(now)).toBe(day);
  });
});

describe("releasePeriodEnd", () => {
  describe("given an exact day", () => {
    it("ends on that day", () => {
      expect(releasePeriodEnd(exactDay("2027-03-14"))).toBe("2027-03-14");
    });
  });

  describe("given a month", () => {
    it.each([
      ["a 31-day month", "2027-03-01", "2027-03-31"],
      ["a 30-day month", "2027-04-01", "2027-04-30"],
      ["February in a common year", "2027-02-01", "2027-02-28"],
      ["February in a leap year", "2028-02-01", "2028-02-29"],
      ["December", "2026-12-01", "2026-12-31"],
    ])("ends on the last day of %s", (_d, periodStart, periodEnd) => {
      expect(releasePeriodEnd(wholeMonth(periodStart))).toBe(periodEnd);
    });
  });

  describe("given a quarter", () => {
    it.each([
      ["Q1", "2027-01-01", "2027-03-31"],
      ["Q2", "2027-04-01", "2027-06-30"],
      ["Q3", "2027-07-01", "2027-09-30"],
      ["Q4", "2027-10-01", "2027-12-31"],
    ])("ends %s on its last day", (_d, periodStart, periodEnd) => {
      expect(releasePeriodEnd(wholeQuarter(periodStart))).toBe(periodEnd);
    });
  });

  describe("given a year", () => {
    it("ends on 31 December", () => {
      expect(releasePeriodEnd(wholeYear(2027))).toBe("2027-12-31");
    });
  });

  describe("given a date still to be announced", () => {
    it("has no end", () => {
      expect(releasePeriodEnd(toBeAnnounced)).toBeNull();
    });
  });

  describe("given a game that was never checked", () => {
    it("has no end, even with a date on record", () => {
      expect(releasePeriodEnd(neverChecked("2027-03-14"))).toBeNull();
    });
  });

  describe("given no date at all", () => {
    it("has no end", () => {
      expect(releasePeriodEnd(noDateAtAll)).toBeNull();
    });
  });
});

describe("isUpcomingRelease", () => {
  describe("given an exact day", () => {
    it.each([
      { when: "tomorrow", day: "2026-11-13", expected: true },
      { when: "today", day: "2026-11-12", expected: true },
      { when: "yesterday", day: "2026-11-11", expected: false },
      { when: "a year ago", day: "2025-11-12", expected: false },
    ])("a game dated $when is upcoming: $expected", ({ day, expected }) => {
      expect(isUpcomingRelease(exactDay(day), TODAY)).toBe(expected);
    });
  });

  describe("given a month", () => {
    const march2027 = wholeMonth("2027-03-01");

    it.each([
      { when: "before the month starts", today: "2027-02-28", expected: true },
      { when: "on the first day", today: "2027-03-01", expected: true },
      { when: "in the middle", today: "2027-03-15", expected: true },
      { when: "on the last day", today: "2027-03-31", expected: true },
      { when: "the day after it ends", today: "2027-04-01", expected: false },
    ])("Mar 2027 is upcoming $when: $expected", ({ today, expected }) => {
      expect(isUpcomingRelease(march2027, today)).toBe(expected);
    });
  });

  describe("given a quarter", () => {
    const secondQuarter2027 = wholeQuarter("2027-04-01");

    it.each([
      { when: "on its first day", today: "2027-04-01", expected: true },
      { when: "on its last day", today: "2027-06-30", expected: true },
      { when: "the day after it ends", today: "2027-07-01", expected: false },
    ])("Q2 2027 is upcoming $when: $expected", ({ today, expected }) => {
      expect(isUpcomingRelease(secondQuarter2027, today)).toBe(expected);
    });
  });

  describe("given a year", () => {
    const year2027 = wholeYear(2027);

    it.each([
      { when: "on its first day", today: "2027-01-01", expected: true },
      { when: "on its last day", today: "2027-12-31", expected: true },
      { when: "the day after it ends", today: "2028-01-01", expected: false },
    ])("2027 is upcoming $when: $expected", ({ today, expected }) => {
      expect(isUpcomingRelease(year2027, today)).toBe(expected);
    });
  });

  describe("given a date still to be announced", () => {
    it("is always upcoming", () => {
      expect(isUpcomingRelease(toBeAnnounced, TODAY)).toBe(true);
      expect(isUpcomingRelease(toBeAnnounced, "2035-01-01")).toBe(true);
    });
  });

  describe("given a game that was never checked", () => {
    it("is not upcoming, even with a future date on record", () => {
      expect(isUpcomingRelease(neverChecked("2027-03-14"), TODAY)).toBe(false);
    });
  });

  describe("given no date at all", () => {
    it("is not upcoming", () => {
      expect(isUpcomingRelease(noDateAtAll, TODAY)).toBe(false);
    });
  });
});

describe("formatReleaseLabel", () => {
  describe("given an exact day", () => {
    it("leaves the year out when it is the current year", () => {
      expect(formatReleaseLabel(exactDay("2026-12-24"), { today: TODAY })).toBe(
        "24 Dec"
      );
    });

    it("does not pad a single-digit day", () => {
      expect(formatReleaseLabel(exactDay("2026-12-02"), { today: TODAY })).toBe(
        "2 Dec"
      );
    });

    it("adds the year when it is next year", () => {
      expect(formatReleaseLabel(exactDay("2027-03-14"), { today: TODAY })).toBe(
        "14 Mar 2027"
      );
    });

    it("adds the year when it is a past year", () => {
      expect(formatReleaseLabel(exactDay("2020-06-02"), { today: TODAY })).toBe(
        "2 Jun 2020"
      );
    });

    it("adds the year in the current year when the year is always shown", () => {
      expect(
        formatReleaseLabel(exactDay("2026-12-24"), {
          today: TODAY,
          alwaysYear: true,
        })
      ).toBe("24 Dec 2026");
    });

    it("keeps the single year once when the year is always shown for another year", () => {
      expect(
        formatReleaseLabel(exactDay("2027-03-14"), {
          today: TODAY,
          alwaysYear: true,
        })
      ).toBe("14 Mar 2027");
    });

    it("reads the stored day, not the day on the device, for the label", () => {
      expect(
        formatReleaseLabel(exactDay("2027-03-14"), { today: "2027-03-13" })
      ).toBe("14 Mar");
    });
  });

  describe("given a month", () => {
    it("reads the short month and the year", () => {
      expect(
        formatReleaseLabel(wholeMonth("2027-03-01"), { today: TODAY })
      ).toBe("Mar 2027");
    });

    it("still shows the year in the current year", () => {
      expect(
        formatReleaseLabel(wholeMonth("2026-12-01"), { today: TODAY })
      ).toBe("Dec 2026");
    });

    it("reads the same with the year always shown", () => {
      expect(
        formatReleaseLabel(wholeMonth("2027-03-01"), {
          today: TODAY,
          alwaysYear: true,
        })
      ).toBe("Mar 2027");
    });
  });

  describe("given a quarter", () => {
    it.each([
      ["2027-01-01", "Q1 2027"],
      ["2027-04-01", "Q2 2027"],
      ["2027-07-01", "Q3 2027"],
      ["2026-10-01", "Q4 2026"],
    ])("reads the quarter starting %s as %s", (periodStart, expected) => {
      expect(
        formatReleaseLabel(wholeQuarter(periodStart), { today: TODAY })
      ).toBe(expected);
    });

    it("reads the same with the year always shown", () => {
      expect(
        formatReleaseLabel(wholeQuarter("2027-04-01"), {
          today: TODAY,
          alwaysYear: true,
        })
      ).toBe("Q2 2027");
    });
  });

  describe("given a year", () => {
    it("reads the year alone, never a specific day", () => {
      expect(formatReleaseLabel(wholeYear(2027), { today: TODAY })).toBe(
        "2027"
      );
    });

    it("reads the current year alone too", () => {
      expect(formatReleaseLabel(wholeYear(2026), { today: TODAY })).toBe(
        "2026"
      );
    });

    it("reads the same with the year always shown", () => {
      expect(
        formatReleaseLabel(wholeYear(2027), { today: TODAY, alwaysYear: true })
      ).toBe("2027");
    });
  });

  describe("given a date still to be announced", () => {
    it("reads Date TBA", () => {
      expect(formatReleaseLabel(toBeAnnounced, { today: TODAY })).toBe(
        "Date TBA"
      );
    });

    it("reads Date TBA with the year always shown", () => {
      expect(
        formatReleaseLabel(toBeAnnounced, { today: TODAY, alwaysYear: true })
      ).toBe("Date TBA");
    });
  });

  describe("given a game that was never checked", () => {
    it("has no label, even with a date on record", () => {
      expect(
        formatReleaseLabel(neverChecked("2027-03-14"), { today: TODAY })
      ).toBeNull();
    });
  });

  describe("given no date at all", () => {
    it("has no label", () => {
      expect(formatReleaseLabel(noDateAtAll, { today: TODAY })).toBeNull();
    });
  });
});

describe("describeReleaseFact", () => {
  describe("given an upcoming exact day", () => {
    it("says Releases with the full date", () => {
      expect(describeReleaseFact(exactDay("2027-03-14"), TODAY)).toEqual({
        term: "Releases",
        value: "14 Mar 2027",
      });
    });

    it("includes the year even in the current year", () => {
      expect(describeReleaseFact(exactDay("2026-12-24"), TODAY)).toEqual({
        term: "Releases",
        value: "24 Dec 2026",
      });
    });

    it("still says Releases on the day itself", () => {
      expect(describeReleaseFact(exactDay("2026-11-12"), TODAY)).toEqual({
        term: "Releases",
        value: "12 Nov 2026",
      });
    });
  });

  describe("given an upcoming month, quarter or year", () => {
    it("says Releases with the month and year", () => {
      expect(describeReleaseFact(wholeMonth("2027-03-01"), TODAY)).toEqual({
        term: "Releases",
        value: "Mar 2027",
      });
    });

    it("says Releases with the quarter", () => {
      expect(describeReleaseFact(wholeQuarter("2027-04-01"), TODAY)).toEqual({
        term: "Releases",
        value: "Q2 2027",
      });
    });

    it("says Releases with the year alone", () => {
      expect(describeReleaseFact(wholeYear(2027), TODAY)).toEqual({
        term: "Releases",
        value: "2027",
      });
    });

    it("keeps saying Releases through the last day of the period", () => {
      expect(describeReleaseFact(wholeYear(2026), "2026-12-31")).toEqual({
        term: "Releases",
        value: "2026",
      });
    });
  });

  describe("given a date still to be announced", () => {
    it("names the Release date as TBA", () => {
      expect(describeReleaseFact(toBeAnnounced, TODAY)).toEqual({
        term: "Release date",
        value: "TBA",
      });
    });
  });

  describe("given a game that is already out", () => {
    it("says Released with the full date for an exact day", () => {
      expect(describeReleaseFact(exactDay("2020-06-02"), TODAY)).toEqual({
        term: "Released",
        value: "2 Jun 2020",
      });
    });

    it("says Released with the year alone for a year-only date", () => {
      expect(describeReleaseFact(wholeYear(2020), TODAY)).toEqual({
        term: "Released",
        value: "2020",
      });
    });

    it("says Released once the day has passed", () => {
      expect(describeReleaseFact(exactDay("2026-11-11"), TODAY)).toEqual({
        term: "Released",
        value: "11 Nov 2026",
      });
    });

    it("says Released once a whole year has ended", () => {
      expect(describeReleaseFact(wholeYear(2026), "2027-01-01")).toEqual({
        term: "Released",
        value: "2026",
      });
    });
  });

  describe("given no date at all", () => {
    it("has no fact", () => {
      expect(describeReleaseFact(noDateAtAll, TODAY)).toBeNull();
    });
  });

  describe("given a game that was never checked", () => {
    it("has no fact, even with a date on record", () => {
      expect(describeReleaseFact(neverChecked("2027-03-14"), TODAY)).toBeNull();
    });
  });
});
