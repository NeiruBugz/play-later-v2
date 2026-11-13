import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  formatComingSoonWhen,
  selectComingSoon,
  type CalendarDay,
  type ComingSoonCandidate,
  type ReleaseDatePrecision,
} from "./release-date";

const TODAY: CalendarDay = "2026-11-12";
const TOMORROW: CalendarDay = "2026-11-13";
const YESTERDAY: CalendarDay = "2026-11-11";
const IN_NINE_DAYS: CalendarDay = "2026-11-21";
const IN_THIRTY_DAYS: CalendarDay = "2026-12-12";
const IN_THIRTY_ONE_DAYS: CalendarDay = "2026-12-13";

let nextLibraryItemId = 1;

const candidate = (
  title: string,
  day: CalendarDay,
  precision: ReleaseDatePrecision = "DAY"
): ComingSoonCandidate => ({
  id: nextLibraryItemId++,
  game: {
    slug: title.toLowerCase().replaceAll(" ", "-"),
    title,
    coverImage: null,
    releaseDate: new Date(`${day}T00:00:00Z`),
    releaseDatePrecision: precision,
  },
});

const titlesOf = (candidates: ComingSoonCandidate[]) =>
  candidates.map(({ game }) => game.title);

describe("formatComingSoonWhen", () => {
  it.each([
    ["a game out today", TODAY, TODAY, "Out today"],
    ["a game out tomorrow", TOMORROW, TODAY, "Tomorrow"],
    ["a game out in two days", "2026-11-14", TODAY, "Sat 14 Nov"],
    ["a game out in nine days", IN_NINE_DAYS, TODAY, "Sat 21 Nov"],
    ["a game out on a Wednesday", "2026-11-25", TODAY, "Wed 25 Nov"],
    ["a game out in thirty days", IN_THIRTY_DAYS, TODAY, "Sat 12 Dec"],
    [
      "a game out on the last day of the same year",
      "2026-12-31",
      "2026-12-10",
      "Thu 31 Dec",
    ],
  ])(
    "reads %s as '%s' without a year",
    (_description, day, today, expected) => {
      expect(formatComingSoonWhen(day, today)).toBe(expected);
    }
  );

  it.each([
    [
      "2 Jan when today is 28 Dec",
      "2027-01-02",
      "2026-12-28",
      "Sat 2 Jan 2027",
    ],
    [
      "5 Jan when today is 20 Dec",
      "2027-01-05",
      "2026-12-20",
      "Tue 5 Jan 2027",
    ],
  ])("adds the new year to %s", (_description, day, today, expected) => {
    expect(formatComingSoonWhen(day, today)).toBe(expected);
  });

  it.each([
    ["the next day of the month", "2026-11-13", "2026-11-12"],
    ["the first of the next month", "2026-12-01", "2026-11-30"],
    ["the first day of the next year", "2027-01-01", "2026-12-31"],
    ["a leap day", "2028-02-29", "2028-02-28"],
  ])("says Tomorrow for %s", (_description, day, today) => {
    expect(formatComingSoonWhen(day, today)).toBe("Tomorrow");
  });

  it("never counts days left", () => {
    const whenTexts = [TODAY, TOMORROW, IN_NINE_DAYS, IN_THIRTY_DAYS].map(
      (day) => formatComingSoonWhen(day, TODAY)
    );
    for (const text of whenTexts) {
      expect(text).not.toMatch(/\bin \d+ days?\b|days? left/);
    }
  });
});

describe("selectComingSoon", () => {
  describe("given games around the edges of the window", () => {
    let selectedTitles: string[];

    beforeEach(() => {
      selectedTitles = titlesOf(
        selectComingSoon(
          [
            candidate("Released Yesterday", YESTERDAY),
            candidate("Out Today", TODAY),
            candidate("Day Thirty", IN_THIRTY_DAYS),
            candidate("Day Thirty One", IN_THIRTY_ONE_DAYS),
          ],
          TODAY,
          { limit: 10 }
        )
      );
    });

    it("includes the game out today", () => {
      expect(selectedTitles).toContain("Out Today");
    });

    it("includes the game exactly thirty days from today", () => {
      expect(selectedTitles).toContain("Day Thirty");
    });

    it("leaves out the game thirty-one days from today", () => {
      expect(selectedTitles).not.toContain("Day Thirty One");
    });

    it("leaves out a game that came out yesterday", () => {
      expect(selectedTitles).not.toContain("Released Yesterday");
    });
  });

  describe("given games on different days, handed over out of order", () => {
    it("lists the nearest date first, with today's games leading", () => {
      const selected = selectComingSoon(
        [
          candidate("Later", IN_NINE_DAYS),
          candidate("Tomorrow Game", TOMORROW),
          candidate("Today Game", TODAY),
        ],
        TODAY
      );

      expect(titlesOf(selected)).toEqual([
        "Today Game",
        "Tomorrow Game",
        "Later",
      ]);
    });
  });

  describe("given games on the same day, handed over out of order", () => {
    it("orders them by title, A to Z", () => {
      const selected = selectComingSoon(
        [
          candidate("Celeste", IN_NINE_DAYS),
          candidate("Alan Wake", IN_NINE_DAYS),
          candidate("Braid", IN_NINE_DAYS),
        ],
        TODAY
      );

      expect(titlesOf(selected)).toEqual(["Alan Wake", "Braid", "Celeste"]);
    });
  });

  describe("given five games in the next thirty days, two on the same day", () => {
    it("keeps the three nearest, with the same-day games in title order", () => {
      const selected = selectComingSoon(
        [
          candidate("Fifth", IN_THIRTY_DAYS),
          candidate("Zelda", IN_NINE_DAYS),
          candidate("Fourth", "2026-12-01"),
          candidate("Alan Wake", IN_NINE_DAYS),
          candidate("First", TOMORROW),
        ],
        TODAY
      );

      expect(titlesOf(selected)).toEqual(["First", "Alan Wake", "Zelda"]);
    });
  });

  describe("given more games out today than the limit", () => {
    it("fills the limit with today's games, in title order", () => {
      const selected = selectComingSoon(
        [
          candidate("Delta", TODAY),
          candidate("Bravo", TODAY),
          candidate("Echo", TODAY),
          candidate("Alpha", TODAY),
          candidate("Tomorrow Game", TOMORROW),
        ],
        TODAY
      );

      expect(titlesOf(selected)).toEqual(["Alpha", "Bravo", "Delta"]);
    });
  });

  describe("given games out today and tomorrow", () => {
    it("counts today's games toward the limit of three", () => {
      const selected = selectComingSoon(
        [
          candidate("Today A", TODAY),
          candidate("Today B", TODAY),
          candidate("Tomorrow A", TOMORROW),
          candidate("Tomorrow B", TOMORROW),
        ],
        TODAY
      );

      expect(titlesOf(selected)).toEqual(["Today A", "Today B", "Tomorrow A"]);
    });
  });

  describe("given a game whose date is only a month, a quarter, a year or TBA", () => {
    it.each<ReleaseDatePrecision>(["MONTH", "QUARTER", "YEAR", "TBA"])(
      "leaves out a %s-precision game even when its stored day falls inside the window",
      (precision) => {
        const selected = selectComingSoon(
          [
            candidate("Vague Date", "2026-12-01", precision),
            candidate("Exact Date", IN_NINE_DAYS),
          ],
          TODAY
        );

        expect(titlesOf(selected)).toEqual(["Exact Date"]);
      }
    );
  });

  describe("given custom options", () => {
    it("applies the days option as an inclusive window", () => {
      const selected = selectComingSoon(
        [
          candidate("Day Seven", "2026-11-19"),
          candidate("Day Eight", "2026-11-20"),
        ],
        TODAY,
        { days: 7 }
      );

      expect(titlesOf(selected)).toEqual(["Day Seven"]);
    });

    it("applies the limit option", () => {
      const selected = selectComingSoon(
        [
          candidate("First", TODAY),
          candidate("Second", TOMORROW),
          candidate("Third", IN_NINE_DAYS),
        ],
        TODAY,
        { limit: 2 }
      );

      expect(titlesOf(selected)).toEqual(["First", "Second"]);
    });
  });

  describe("given nothing qualifies", () => {
    it("returns an empty list for no candidates", () => {
      expect(selectComingSoon([], TODAY)).toEqual([]);
    });

    it("returns an empty list when every game is outside the window", () => {
      expect(
        selectComingSoon(
          [
            candidate("Already Out", YESTERDAY),
            candidate("Far Away", IN_THIRTY_ONE_DAYS),
          ],
          TODAY
        )
      ).toEqual([]);
    });
  });

  describe("given the candidates handed over", () => {
    it("leaves their order untouched", () => {
      const handedOver = [
        candidate("Later", IN_NINE_DAYS),
        candidate("Sooner", TOMORROW),
      ];

      selectComingSoon(handedOver, TODAY);

      expect(titlesOf(handedOver)).toEqual(["Later", "Sooner"]);
    });

    it("returns the same candidates it was given", () => {
      const sooner = candidate("Sooner", TOMORROW);

      expect(selectComingSoon([sooner], TODAY)).toEqual([sooner]);
    });
  });
});

describe.each([
  ["New York", "America/New_York"],
  ["Auckland", "Pacific/Auckland"],
  ["Kiritimati, UTC+14", "Pacific/Kiritimati"],
  ["Pago Pago, UTC-11", "Pacific/Pago_Pago"],
])("on a device in %s", (_place, timeZone) => {
  let originalTimeZone: string | undefined;

  beforeEach(() => {
    originalTimeZone = process.env.TZ;
    process.env.TZ = timeZone;
  });

  afterEach(() => {
    if (originalTimeZone === undefined) {
      delete process.env.TZ;
    } else {
      process.env.TZ = originalTimeZone;
    }
  });

  it.each([
    [
      "spring clocks change inside the window",
      "2026-03-01",
      "2026-03-31",
      "2026-04-01",
    ],
    [
      "autumn clocks change inside the window",
      "2026-10-15",
      "2026-11-14",
      "2026-11-15",
    ],
    ["the window crosses a year end", "2026-12-20", "2027-01-19", "2027-01-20"],
  ])(
    "keeps day thirty in and day thirty-one out when %s",
    (_description, today, dayThirty, dayThirtyOne) => {
      const selected = selectComingSoon(
        [
          candidate("Day Thirty", dayThirty),
          candidate("Day Thirty One", dayThirtyOne),
        ],
        today
      );

      expect(titlesOf(selected)).toEqual(["Day Thirty"]);
    }
  );

  it("keeps yesterday out and today in", () => {
    const selected = selectComingSoon(
      [candidate("Yesterday", YESTERDAY), candidate("Today", TODAY)],
      TODAY
    );

    expect(titlesOf(selected)).toEqual(["Today"]);
  });

  it("reads the same weekday and date as everywhere else", () => {
    expect(formatComingSoonWhen("2026-11-21", TODAY)).toBe("Sat 21 Nov");
  });

  it("still says Tomorrow across a daylight-saving change", () => {
    expect(formatComingSoonWhen("2026-03-08", "2026-03-07")).toBe("Tomorrow");
  });
});
