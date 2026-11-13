import { describe, expect, it, vi } from "vitest";

import liveFixture from "./__fixtures__/release-dates-live-2026-11-12.json";
import { DATE_FORMAT_PRECISION, mapIgdbReleaseDate } from "./release-date";
import { SearchResponseItemSchema } from "./schemas";

vi.mock("@/shared/lib", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/shared/lib")>();
  const stub = {
    error: vi.fn(),
    warn: vi.fn(),
    info: vi.fn(),
    debug: vi.fn(),
    trace: vi.fn(),
    fatal: vi.fn(),
    child: vi.fn(),
  };
  stub.child = vi.fn(() => stub);
  return { ...actual, createLogger: vi.fn(() => stub) };
});

const { dateFormats, games } = liveFixture;

const MILLISECONDS_PER_DAY = 86_400_000;

const utcMidnight = (year: number, month: number, day: number): Date =>
  new Date(Date.UTC(year, month - 1, day));

const toDate = (unixSeconds: number): Date => new Date(unixSeconds * 1000);

const isUtcMidnight = (date: Date): boolean =>
  date.getTime() % MILLISECONDS_PER_DAY === 0;

const [dayEntry] = games.day.release_dates;
const [yearEntryOn31Dec2026] = games.year.release_dates;
const [quarterFourEntryOn31Dec2026] = games.q4.release_dates;
const [datedBetaEntry] = games.noFirstReleaseDate.release_dates;

describe("DATE_FORMAT_PRECISION", () => {
  it("covers exactly the date format ids IGDB lists", () => {
    const liveIds = dateFormats.map(({ id }) => id).sort((a, b) => a - b);
    const mappedIds = Object.keys(DATE_FORMAT_PRECISION)
      .map(Number)
      .sort((a, b) => a - b);

    expect(mappedIds).toEqual(liveIds);
  });

  it.each([
    ["YYYYMMDD", "DAY"],
    ["YYYYMM", "MONTH"],
    ["YYYY", "YEAR"],
    ["YYYYQ1", "QUARTER"],
    ["YYYYQ2", "QUARTER"],
    ["YYYYQ3", "QUARTER"],
    ["YYYYQ4", "QUARTER"],
    ["TBD", "TBA"],
  ])("maps the live format %s to %s", (formatName, expectedPrecision) => {
    const liveFormat = dateFormats.find(({ format }) => format === formatName);

    expect(liveFormat).toBeDefined();
    expect(
      DATE_FORMAT_PRECISION[
        liveFormat?.id as keyof typeof DATE_FORMAT_PRECISION
      ]
    ).toBe(expectedPrecision);
  });
});

describe("mapIgdbReleaseDate", () => {
  describe("given the live IGDB payloads captured on 2026-11-12", () => {
    it.each([
      ["an exact day", games.day, utcMidnight(2026, 11, 13), "DAY"],
      ["a month", games.month, utcMidnight(2026, 12, 1), "MONTH"],
      ["a year", games.year, utcMidnight(2026, 1, 1), "YEAR"],
      ["the first quarter", games.q1, utcMidnight(2027, 1, 1), "QUARTER"],
      ["the second quarter", games.q2, utcMidnight(2027, 4, 1), "QUARTER"],
      [
        "the third quarter repeated in three identical entries",
        games.q3,
        utcMidnight(2027, 7, 1),
        "QUARTER",
      ],
      [
        "the fourth quarter of 2026 next to the fourth quarter of 2027",
        games.q4,
        utcMidnight(2026, 10, 1),
        "QUARTER",
      ],
      [
        "a third quarter chosen over earlier quarters with other statuses",
        games.mixedStatuses,
        utcMidnight(2027, 7, 1),
        "QUARTER",
      ],
      [
        "an exact early date chosen over later vague dates",
        games.exactEarlyVagueLater,
        utcMidnight(2026, 3, 3),
        "DAY",
      ],
    ])("reads %s", (_description, payload, expectedDate, expectedPrecision) => {
      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: expectedDate,
        precision: expectedPrecision,
      });
    });

    it("reads a game whose entries are all TBD as TBA with no date", () => {
      expect(mapIgdbReleaseDate(games.tbd)).toEqual({
        releaseDate: null,
        precision: "TBA",
      });
    });

    it("reads a game with only a dated entry and no first release date as having no date", () => {
      expect(mapIgdbReleaseDate(games.noFirstReleaseDate)).toEqual({
        releaseDate: null,
        precision: null,
      });
    });

    it("returns a UTC midnight date for every game that has one", () => {
      const results = Object.values(games).map(mapIgdbReleaseDate);

      for (const result of results) {
        if (result !== "unknown" && result.releaseDate !== null) {
          expect(isUtcMidnight(result.releaseDate)).toBe(true);
        }
      }
    });
  });

  describe("given a vague date", () => {
    it("returns the first day of the year, not the IGDB placeholder on 31 December", () => {
      const placeholder = toDate(games.year.first_release_date);

      const result = mapIgdbReleaseDate(games.year);

      expect(placeholder).toEqual(utcMidnight(2026, 12, 31));
      expect(result).not.toEqual({
        releaseDate: placeholder,
        precision: "YEAR",
      });
      expect(result).toEqual({
        releaseDate: utcMidnight(2026, 1, 1),
        precision: "YEAR",
      });
    });

    it("returns the first day of the quarter, not the IGDB placeholder on its last day", () => {
      const placeholder = toDate(games.q1.first_release_date);

      const result = mapIgdbReleaseDate(games.q1);

      expect(placeholder).toEqual(utcMidnight(2027, 3, 31));
      expect(result).not.toEqual({
        releaseDate: placeholder,
        precision: "QUARTER",
      });
      expect(result).toEqual({
        releaseDate: utcMidnight(2027, 1, 1),
        precision: "QUARTER",
      });
    });
  });

  describe("given a year entry and a fourth quarter entry sharing the placeholder day 31 December 2026", () => {
    const releaseDateOn31Dec2026 = games.year.first_release_date;

    it("picks the more precise quarter when the year entry comes first", () => {
      const payload = {
        ...games.year,
        first_release_date: releaseDateOn31Dec2026,
        release_dates: [yearEntryOn31Dec2026, quarterFourEntryOn31Dec2026],
      };

      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: utcMidnight(2026, 10, 1),
        precision: "QUARTER",
      });
    });

    it("picks the more precise quarter when the quarter entry comes first", () => {
      const payload = {
        ...games.year,
        first_release_date: releaseDateOn31Dec2026,
        release_dates: [quarterFourEntryOn31Dec2026, yearEntryOn31Dec2026],
      };

      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: utcMidnight(2026, 10, 1),
        precision: "QUARTER",
      });
    });
  });

  describe("given a first release date that no release entry carries", () => {
    it("returns unknown", () => {
      const payload = {
        ...games.day,
        release_dates: [{ ...dayEntry, date: dayEntry.date + 86_400 }],
      };

      expect(mapIgdbReleaseDate(payload)).toBe("unknown");
    });

    it("returns unknown when the game has no release entries at all", () => {
      const payload = { ...games.day, release_dates: undefined };

      expect(mapIgdbReleaseDate(payload)).toBe("unknown");
    });
  });

  describe("given the matching entry has an unrecognised date format", () => {
    it("returns unknown for an id IGDB has not listed", () => {
      const payload = {
        ...games.day,
        release_dates: [{ ...dayEntry, date_format: 99 }],
      };

      expect(mapIgdbReleaseDate(payload)).toBe("unknown");
    });

    it("returns unknown when the date format is missing", () => {
      const payload = {
        ...games.day,
        release_dates: [{ ...dayEntry, date_format: undefined }],
      };

      expect(mapIgdbReleaseDate(payload)).toBe("unknown");
    });
  });

  describe("given no first release date", () => {
    it("returns no date and no precision when the release entries are empty", () => {
      const payload = { ...games.noFirstReleaseDate, release_dates: [] };

      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: null,
        precision: null,
      });
    });

    it("returns no date and no precision when the release entries are missing", () => {
      const payload = { ...games.noFirstReleaseDate, release_dates: undefined };

      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: null,
        precision: null,
      });
    });

    it("returns TBA when TBD entries sit next to entries without a date", () => {
      const entryWithoutDate = { id: 1, human: "TBD", date_format: undefined };
      const payload = {
        ...games.tbd,
        release_dates: [...games.tbd.release_dates, entryWithoutDate],
      };

      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: null,
        precision: "TBA",
      });
    });

    it("returns no date and no precision when a dated entry sits next to TBD entries", () => {
      const payload = {
        ...games.tbd,
        release_dates: [...games.tbd.release_dates, datedBetaEntry],
      };

      expect(mapIgdbReleaseDate(payload)).toEqual({
        releaseDate: null,
        precision: null,
      });
    });
  });
});

describe("SearchResponseItemSchema", () => {
  describe("given a game carrying release entries with date, date_format, y and m", () => {
    it.each(Object.entries(games))(
      "keeps those four fields on every entry of the %s game",
      (_gameKey, game) => {
        const parsed = SearchResponseItemSchema.parse({
          ...game,
          slug: "fixture-game",
        });

        const keepFourFields = ({
          date,
          date_format,
          y,
          m,
        }: {
          date?: number;
          date_format?: number;
          y?: number;
          m?: number;
        }) => ({ date, date_format, y, m });

        expect(parsed.release_dates?.map(keepFourFields)).toEqual(
          game.release_dates.map(keepFourFields)
        );
      }
    );
  });
});
