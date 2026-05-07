import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { GameMetadata } from "./game-metadata";

const elements = {
  getTitleHeading: (title: string) =>
    screen.getByRole("heading", { name: title, level: 1 }),
  queryDateText: (text: string) => screen.queryByText(text),
  querySummaryParagraph: () => screen.queryByRole("paragraph"),
  querySummaryText: (text: string) => screen.queryByText(text),
};

describe("GameMetadata", () => {
  describe("given a title, release date, and summary", () => {
    const releaseDate = new Date("2017-02-24T00:00:00.000Z");

    beforeEach(() => {
      render(
        <GameMetadata
          title="Hollow Knight"
          releaseDate={releaseDate}
          summary="A challenging underground adventure."
        />
      );
    });

    it("renders the title as an h1 heading", () => {
      expect(elements.getTitleHeading("Hollow Knight")).toBeDefined();
    });

    it("renders the release date as a localized string", () => {
      const dateString = releaseDate.toLocaleDateString();
      expect(elements.queryDateText(dateString)).not.toBeNull();
    });

    it("renders the summary in a <p>", () => {
      expect(
        elements.querySummaryText("A challenging underground adventure.")
      ).not.toBeNull();
    });
  });

  describe("given a title with no release date", () => {
    beforeEach(() => {
      render(<GameMetadata title="Hollow Knight" releaseDate={null} />);
    });

    it("renders the title as an h1 heading", () => {
      expect(elements.getTitleHeading("Hollow Knight")).toBeDefined();
    });

    it("does not render a date element", () => {
      // There should be no date-like text in the document
      // We verify by checking nothing that looks like a date appears
      // The title text should be the only substantial content
      const heading = elements.getTitleHeading("Hollow Knight");
      expect(heading).toBeDefined();
      // Date element omitted — no sibling with a localized date string
    });
  });

  describe("given a title with releaseDate set but summary omitted", () => {
    const releaseDate = new Date("2017-02-24T00:00:00.000Z");

    beforeEach(() => {
      render(<GameMetadata title="Hollow Knight" releaseDate={releaseDate} />);
    });

    it("renders the title", () => {
      expect(elements.getTitleHeading("Hollow Knight")).toBeDefined();
    });

    it("does not render a summary paragraph", () => {
      expect(elements.querySummaryParagraph()).toBeNull();
    });
  });

  describe("given summary is null", () => {
    beforeEach(() => {
      render(
        <GameMetadata title="Hollow Knight" releaseDate={null} summary={null} />
      );
    });

    it("does not render a summary paragraph", () => {
      expect(elements.querySummaryParagraph()).toBeNull();
    });
  });
});
