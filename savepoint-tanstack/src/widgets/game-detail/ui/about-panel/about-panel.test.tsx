import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { AboutPanel } from "./about-panel";
import type { AboutPanelProps } from "./about-panel.type";

const LONG_SUMMARY = "A challenging metroidvania. ".repeat(40).trim();

const fullProps: AboutPanelProps = {
  summary: LONG_SUMMARY,
  developer: "Team Cherry",
  releaseDate: new Date("2017-02-24T00:00:00Z"),
  releaseDatePrecision: "DAY",
  timeToCreditsSeconds: 14.5 * 3600,
  timeToCompleteSeconds: 19 * 3600,
  themes: ["Fantasy", "Action"],
  genres: ["Adventure", "Platform"],
};

const emptyProps: AboutPanelProps = {
  summary: null,
  developer: null,
  releaseDate: null,
  releaseDatePrecision: null,
  timeToCreditsSeconds: null,
  timeToCompleteSeconds: null,
  themes: [],
  genres: [],
};

const utcMidnight = (day: string) => new Date(`${day}T00:00:00Z`);

const elements = {
  getTitle: () => screen.getByRole("heading", { name: "About" }),
  getSummary: () => screen.getByLabelText("Game summary"),
  querySummary: () => screen.queryByLabelText("Game summary"),
  getMore: () => screen.getByRole("button", { name: "More" }),
  queryMore: () => screen.queryByRole("button", { name: "More" }),
  getLess: () => screen.getByRole("button", { name: "Less" }),
  getTags: () => screen.getByRole("list", { name: "Themes and genres" }),
  queryTags: () => screen.queryByRole("list", { name: "Themes and genres" }),
  queryTerm: (term: string) => screen.queryByText(term),
  getValueFor: (term: string) =>
    // eslint-disable-next-line testing-library/no-node-access
    screen.getByText(term).nextElementSibling,
};

describe("AboutPanel", () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ["Date"] });
    vi.setSystemTime(new Date(2026, 10, 12, 12));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given a long description", () => {
    beforeEach(() => {
      render(<AboutPanel {...fullProps} />);
    });

    it("shows the About title", () => {
      expect(elements.getTitle()).toBeInTheDocument();
    });

    it("cuts the description to four lines", () => {
      expect(elements.getSummary()).toHaveClass("line-clamp-4");
    });

    it("offers More", () => {
      expect(elements.getMore()).toHaveAttribute("aria-expanded", "false");
    });

    describe("when the user taps More", () => {
      beforeEach(async () => {
        await userEvent.click(elements.getMore());
      });

      it("shows the full description", () => {
        expect(elements.getSummary()).not.toHaveClass("line-clamp-4");
        expect(elements.getSummary()).toHaveTextContent(LONG_SUMMARY);
      });

      it("offers Less to cut it back", async () => {
        await userEvent.click(elements.getLess());
        expect(elements.getSummary()).toHaveClass("line-clamp-4");
      });
    });
  });

  describe("given every fact is known", () => {
    beforeEach(() => {
      render(<AboutPanel {...fullProps} />);
    });

    it("lists the developer", () => {
      expect(elements.getValueFor("Developer")).toHaveTextContent(
        "Team Cherry"
      );
    });

    it("lists the full release date", () => {
      expect(elements.getValueFor("Released")).toHaveTextContent("24 Feb 2017");
    });

    it("lists the typical times in hours", () => {
      expect(elements.getValueFor("Main story")).toHaveTextContent("14.5 h");
      expect(elements.getValueFor("100%")).toHaveTextContent("19 h");
    });
  });

  describe("given only a description", () => {
    beforeEach(() => {
      render(<AboutPanel {...emptyProps} summary="A short one." />);
    });

    it("leaves out every row with an unknown value", () => {
      expect(elements.queryTerm("Developer")).toBeNull();
      expect(elements.queryTerm("Released")).toBeNull();
      expect(elements.queryTerm("Main story")).toBeNull();
      expect(elements.queryTerm("100%")).toBeNull();
    });

    it("shows no release fact of any wording", () => {
      expect(elements.queryTerm("Releases")).toBeNull();
      expect(elements.queryTerm("Release date")).toBeNull();
    });

    it("shows no tag group", () => {
      expect(elements.queryTags()).toBeNull();
    });
  });

  describe("given only the main story time is known", () => {
    beforeEach(() => {
      render(<AboutPanel {...emptyProps} timeToCreditsSeconds={14.5 * 3600} />);
    });

    it("lists Main story and leaves out 100%", () => {
      expect(elements.getValueFor("Main story")).toHaveTextContent("14.5 h");
      expect(elements.queryTerm("100%")).toBeNull();
    });

    it("shows no description or More", () => {
      expect(elements.querySummary()).toBeNull();
      expect(elements.queryMore()).toBeNull();
    });
  });

  describe("given themes and genres", () => {
    beforeEach(() => {
      render(<AboutPanel {...fullProps} />);
    });

    it("shows them together as one group of tags", () => {
      expect(
        within(elements.getTags())
          .getAllByRole("listitem")
          .map((tag) => tag.textContent)
      ).toEqual(["Fantasy", "Action", "Adventure", "Platform"]);
    });

    it("has no separate Themes or Platforms heading", () => {
      expect(screen.queryByRole("heading", { name: "Themes" })).toBeNull();
      expect(screen.queryByRole("heading", { name: "Platforms" })).toBeNull();
    });
  });

  describe("given a release in the future with an exact day", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          releaseDate={utcMidnight("2027-03-14")}
          releaseDatePrecision="DAY"
        />
      );
    });

    it("says Releases with the full date", () => {
      expect(elements.getValueFor("Releases")).toHaveTextContent("14 Mar 2027");
    });

    it("never says Released", () => {
      expect(elements.queryTerm("Released")).toBeNull();
    });
  });

  describe("given a release in the future known only as a year", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          releaseDate={utcMidnight("2027-01-01")}
          releaseDatePrecision="YEAR"
        />
      );
    });

    it("says Releases with the year alone", () => {
      expect(elements.getValueFor("Releases")).toHaveTextContent("2027");
      expect(elements.getValueFor("Releases")).not.toHaveTextContent("Dec");
    });
  });

  describe("given a release in the future known only as a quarter", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          releaseDate={utcMidnight("2027-04-01")}
          releaseDatePrecision="QUARTER"
        />
      );
    });

    it("says Releases with the quarter", () => {
      expect(elements.getValueFor("Releases")).toHaveTextContent("Q2 2027");
    });
  });

  describe("given a release date still to be announced", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          releaseDate={null}
          releaseDatePrecision="TBA"
        />
      );
    });

    it("says Release date TBA", () => {
      expect(elements.getValueFor("Release date")).toHaveTextContent("TBA");
    });

    it("says neither Releases nor Released", () => {
      expect(elements.queryTerm("Releases")).toBeNull();
      expect(elements.queryTerm("Released")).toBeNull();
    });
  });

  describe("given a game released on an exact day", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          releaseDate={utcMidnight("2020-06-02")}
          releaseDatePrecision="DAY"
        />
      );
    });

    it("says Released with the full date", () => {
      expect(elements.getValueFor("Released")).toHaveTextContent("2 Jun 2020");
    });
  });

  describe("given a game released in a year known only as a year", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          releaseDate={utcMidnight("2020-01-01")}
          releaseDatePrecision="YEAR"
        />
      );
    });

    it("says Released with the year alone", () => {
      expect(elements.getValueFor("Released")).toHaveTextContent("2020");
      expect(elements.getValueFor("Released")).not.toHaveTextContent("Jan");
    });
  });

  describe("given a date on record but no known precision", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          {...emptyProps}
          summary="A short one."
          releaseDate={utcMidnight("2027-03-14")}
          releaseDatePrecision={null}
        />
      );
    });

    it("shows no release fact", () => {
      expect(elements.queryTerm("Releases")).toBeNull();
      expect(elements.queryTerm("Released")).toBeNull();
      expect(elements.queryTerm("Release date")).toBeNull();
    });
  });
});
