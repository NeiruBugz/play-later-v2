import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ReleaseDatePrecision } from "../../model";
import { ReleaseLines } from "./release-lines";

type ReleaseLinesGame = Parameters<typeof ReleaseLines>[0]["game"];

const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);

const gameWith = (overrides: Partial<ReleaseLinesGame>): ReleaseLinesGame => ({
  releaseDate: null,
  releaseDatePrecision: null,
  releaseDateMovedFrom: null,
  releaseDateMovedAt: null,
  ...overrides,
});

const dated = (
  precision: ReleaseDatePrecision,
  day: string,
  overrides: Partial<ReleaseLinesGame> = {}
): ReleaseLinesGame =>
  gameWith({
    releaseDate: utcMidnight(day),
    releaseDatePrecision: precision,
    ...overrides,
  });

const movedFrom = (oldDay: string, movedAt: string) => ({
  releaseDateMovedFrom: utcMidnight(oldDay),
  releaseDateMovedAt: new Date(movedAt),
});

const elements = {
  getReleaseLine: () => screen.getByTestId("game-card-release"),
  queryReleaseLine: () => screen.queryByTestId("game-card-release"),
  getMovedLine: () => screen.getByTestId("game-card-moved"),
  queryMovedLine: () => screen.queryByTestId("game-card-moved"),
};

const actions = {
  showReleaseLinesOf: (game: ReleaseLinesGame) =>
    render(<ReleaseLines game={game} />),
};

describe(ReleaseLines, () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 12, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given an upcoming game", () => {
    it.each([
      ["an exact date this year", dated("DAY", "2026-12-14"), "Out 14 Dec"],
      [
        "an exact date next year",
        dated("DAY", "2027-03-14"),
        "Out 14 Mar 2027",
      ],
      ["an exact date today", dated("DAY", "2026-11-12"), "Out 12 Nov"],
      ["a month", dated("MONTH", "2027-03-01"), "Out Mar 2027"],
      ["the month now running", dated("MONTH", "2026-11-01"), "Out Nov 2026"],
      ["a quarter", dated("QUARTER", "2027-04-01"), "Out Q2 2027"],
      ["a year", dated("YEAR", "2027-01-01"), "Out 2027"],
      ["the year now running", dated("YEAR", "2026-01-01"), "Out 2026"],
    ])("reads the date label for %s", (_description, game, expectedText) => {
      actions.showReleaseLinesOf(game);

      expect(elements.getReleaseLine()).toHaveTextContent(expectedText);
    });

    it("never shows a specific day for a year-only date", () => {
      actions.showReleaseLinesOf(dated("YEAR", "2027-01-01"));

      expect(elements.getReleaseLine().textContent).toBe("Out 2027");
    });

    it("renders the release line as a paragraph", () => {
      actions.showReleaseLinesOf(dated("DAY", "2026-12-14"));

      expect(elements.getReleaseLine().tagName).toBe("P");
    });
  });

  describe("given a game the catalogue marks as TBA", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        gameWith({ releaseDate: null, releaseDatePrecision: "TBA" })
      );
    });

    it("reads just Date TBA, without the Out prefix", () => {
      expect(elements.getReleaseLine().textContent).toBe("Date TBA");
    });
  });

  describe("given a game that does not show a release line", () => {
    it.each([
      ["an exact date yesterday", dated("DAY", "2026-11-11")],
      ["an exact date years ago", dated("DAY", "2020-06-02")],
      ["a month that ended", dated("MONTH", "2026-10-01")],
      ["a quarter that ended", dated("QUARTER", "2026-07-01")],
      ["a year that ended", dated("YEAR", "2025-01-01")],
      ["no date at all", gameWith({})],
      [
        "a date whose precision was never recorded",
        gameWith({ releaseDate: utcMidnight("2027-03-14") }),
      ],
    ])("shows no release date text for %s", (_description, game) => {
      const { container } = actions.showReleaseLinesOf(game);

      expect(container.textContent).toBe("");
      expect(elements.queryReleaseLine()).toBeNull();
      expect(elements.queryMovedLine()).toBeNull();
    });
  });

  describe("given an exact date that moved 2 days ago to another exact date in the same year", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        dated(
          "DAY",
          "2027-01-21",
          movedFrom("2026-12-14", "2026-11-10T08:15:00Z")
        )
      );
    });

    it("shows the new date", () => {
      expect(elements.getReleaseLine()).toHaveTextContent("Out 21 Jan 2027");
    });

    it("shows the old date without a year when the old date is in the current year", () => {
      expect(elements.getMovedLine().textContent).toBe("Moved from 14 Dec");
    });

    it("places the moved line after the release line", () => {
      expect(
        elements
          .getReleaseLine()
          .compareDocumentPosition(elements.getMovedLine()) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });

    it("renders the moved line as a paragraph", () => {
      expect(elements.getMovedLine().tagName).toBe("P");
    });
  });

  describe("given an exact date that moved from another year", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        dated(
          "DAY",
          "2027-06-03",
          movedFrom("2027-03-14", "2026-11-10T08:15:00Z")
        )
      );
    });

    it("shows the new date", () => {
      expect(elements.getReleaseLine()).toHaveTextContent("Out 3 Jun 2027");
    });

    it("shows the old date with its year", () => {
      expect(elements.getMovedLine().textContent).toBe(
        "Moved from 14 Mar 2027"
      );
    });
  });

  describe("given an exact date that turned into a year", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        dated(
          "YEAR",
          "2027-01-01",
          movedFrom("2026-12-14", "2026-11-10T08:15:00Z")
        )
      );
    });

    it("shows Out 2027", () => {
      expect(elements.getReleaseLine().textContent).toBe("Out 2027");
    });

    it("shows where it moved from underneath", () => {
      expect(elements.getMovedLine().textContent).toBe("Moved from 14 Dec");
    });
  });

  describe("given an exact date that turned into TBA", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        gameWith({
          releaseDate: null,
          releaseDatePrecision: "TBA",
          ...movedFrom("2026-12-14", "2026-11-10T08:15:00Z"),
        })
      );
    });

    it("shows Date TBA", () => {
      expect(elements.getReleaseLine().textContent).toBe("Date TBA");
    });

    it("shows where it moved from underneath", () => {
      expect(elements.getMovedLine().textContent).toBe("Moved from 14 Dec");
    });
  });

  describe("given the move was seen exactly 14 days ago", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        dated(
          "DAY",
          "2027-01-21",
          movedFrom("2026-12-14", "2026-10-29T08:15:00Z")
        )
      );
    });

    it("still shows the moved line", () => {
      expect(elements.getMovedLine().textContent).toBe("Moved from 14 Dec");
    });
  });

  describe("given the move was seen 15 days ago", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        dated(
          "DAY",
          "2027-01-21",
          movedFrom("2026-12-14", "2026-10-28T08:15:00Z")
        )
      );
    });

    it("shows no moved line", () => {
      expect(elements.queryMovedLine()).toBeNull();
    });

    it("still shows the release line", () => {
      expect(elements.getReleaseLine()).toHaveTextContent("Out 21 Jan 2027");
    });
  });

  describe("given an upcoming game that never moved", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(dated("DAY", "2026-12-14"));
    });

    it("shows no moved line", () => {
      expect(elements.queryMovedLine()).toBeNull();
    });
  });

  describe("given a moved date", () => {
    beforeEach(() => {
      actions.showReleaseLinesOf(
        dated(
          "DAY",
          "2027-01-21",
          movedFrom("2026-12-14", "2026-11-10T08:15:00Z")
        )
      );
    });

    it("keeps the moved line plain, with no warning colour", () => {
      expect(elements.getMovedLine().className).not.toMatch(
        /destructive|warning|red-|amber-|orange-|yellow-/
      );
    });

    it("keeps the moved line free of a Delayed badge", () => {
      expect(screen.queryByText("Delayed")).toBeNull();
    });
  });
});
