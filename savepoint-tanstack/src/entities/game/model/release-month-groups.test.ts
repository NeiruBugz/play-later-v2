import { beforeEach, describe, expect, it } from "vitest";

import { groupByMonth } from "./release-date";

type Release = { title: string; releaseDate: Date };

const release = (title: string, instant: string): Release => ({
  title,
  releaseDate: new Date(instant),
});

const titlesOf = (entries: Release[]) => entries.map(({ title }) => title);

describe(groupByMonth, () => {
  describe("given no entries", () => {
    it("has no month groups", () => {
      expect(groupByMonth([])).toEqual([]);
    });
  });

  describe("given two games releasing in the same month", () => {
    let groups: ReturnType<typeof groupByMonth<Release>>;
    const hades = release("Hades III", "2027-03-14T00:00:00.000Z");
    const celeste = release("Celeste 2", "2027-03-02T00:00:00.000Z");

    beforeEach(() => {
      groups = groupByMonth([hades, celeste]);
    });

    it("makes a single group", () => {
      expect(groups).toHaveLength(1);
    });

    it("keys the group by year and month", () => {
      expect(groups[0].monthKey).toBe("2027-03");
    });

    it("headlines the group with the full month name and the year", () => {
      expect(groups[0].heading).toBe("March 2027");
    });

    it("keeps the games in the order they came in", () => {
      expect(titlesOf(groups[0].entries)).toEqual(["Hades III", "Celeste 2"]);
    });

    it("hands back the very same entries, not copies", () => {
      expect(groups[0].entries[0]).toBe(hades);
    });
  });

  describe("given games releasing on the same day in the order given", () => {
    it("keeps that order inside the group", () => {
      const groups = groupByMonth([
        release("Tunic 2", "2027-03-14T00:00:00.000Z"),
        release("Alan Wake 3", "2027-03-14T00:00:00.000Z"),
        release("Hades III", "2027-03-14T00:00:00.000Z"),
      ]);

      expect(titlesOf(groups[0].entries)).toEqual([
        "Tunic 2",
        "Alan Wake 3",
        "Hades III",
      ]);
    });
  });

  describe("given games releasing in March, April and the following January", () => {
    let groups: ReturnType<typeof groupByMonth<Release>>;

    beforeEach(() => {
      groups = groupByMonth([
        release("Signalis 2", "2027-03-12T00:00:00.000Z"),
        release("Tunic 2", "2027-03-26T00:00:00.000Z"),
        release("Celeste 2", "2027-04-02T00:00:00.000Z"),
        release("Hades III", "2028-01-14T00:00:00.000Z"),
      ]);
    });

    it("makes one group per month, in date order", () => {
      expect(groups.map(({ monthKey }) => monthKey)).toEqual([
        "2027-03",
        "2027-04",
        "2028-01",
      ]);
    });

    it("headlines each month with its year", () => {
      expect(groups.map(({ heading }) => heading)).toEqual([
        "March 2027",
        "April 2027",
        "January 2028",
      ]);
    });

    it("puts each game under its own month", () => {
      expect(groups.map(({ entries }) => titlesOf(entries))).toEqual([
        ["Signalis 2", "Tunic 2"],
        ["Celeste 2"],
        ["Hades III"],
      ]);
    });
  });

  describe("given December followed by January of the next year", () => {
    let groups: ReturnType<typeof groupByMonth<Release>>;

    beforeEach(() => {
      groups = groupByMonth([
        release("Signalis 2", "2026-12-31T00:00:00.000Z"),
        release("Hades III", "2027-01-01T00:00:00.000Z"),
      ]);
    });

    it("keeps December first and January second", () => {
      expect(groups.map(({ monthKey }) => monthKey)).toEqual([
        "2026-12",
        "2027-01",
      ]);
    });

    it("headlines each with the year it belongs to", () => {
      expect(groups.map(({ heading }) => heading)).toEqual([
        "December 2026",
        "January 2027",
      ]);
    });
  });

  describe("given the same month in two different years", () => {
    it("keeps them apart", () => {
      const groups = groupByMonth([
        release("Celeste 2", "2027-03-14T00:00:00.000Z"),
        release("Hades III", "2028-03-14T00:00:00.000Z"),
      ]);

      expect(groups.map(({ heading }) => heading)).toEqual([
        "March 2027",
        "March 2028",
      ]);
    });
  });

  describe("given release days at the very edges of a month", () => {
    let groups: ReturnType<typeof groupByMonth<Release>>;

    beforeEach(() => {
      groups = groupByMonth([
        release("Last evening of March", "2027-03-31T23:59:59.999Z"),
        release("First moment of April", "2027-04-01T00:00:00.000Z"),
      ]);
    });

    it("reads the month on the UTC calendar, whatever the device time zone", () => {
      expect(groups.map(({ monthKey }) => monthKey)).toEqual([
        "2027-03",
        "2027-04",
      ]);
    });

    it("puts each edge game in its own month", () => {
      expect(groups.map(({ entries }) => titlesOf(entries))).toEqual([
        ["Last evening of March"],
        ["First moment of April"],
      ]);
    });
  });

  describe("given entries that carry more than a release date", () => {
    it("keeps every extra field on the entries it returns", () => {
      const entry = {
        id: "7",
        status: "WANT",
        releaseDate: new Date("2027-03-14T00:00:00.000Z"),
      };

      expect(groupByMonth([entry])[0].entries).toEqual([entry]);
    });
  });
});
