import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { AboutPanel } from "./about-panel";

const elements = {
  querySummary: () => screen.queryByLabelText("Game summary"),
  getSummary: () => screen.getByLabelText("Game summary"),
  queryFactsLabel: () => screen.queryByText("// ABOUT"),
  queryReleaseYearTerm: () => screen.queryByText("Release year"),
  queryReleaseYearValue: () => screen.queryByText("2017"),
  queryDeveloperTerm: () => screen.queryByText("Developer"),
  queryDeveloperValue: () => screen.queryByText("Team Cherry"),
  queryPublisherTerm: () => screen.queryByText("Publisher"),
  queryPublisherValue: () => screen.queryByText("Skybound Games"),
};

describe("AboutPanel", () => {
  describe("given all facts are present", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          summary="A challenging metroidvania."
          releaseYear="2017"
          developer="Team Cherry"
          publisher="Skybound Games"
        />
      );
    });

    it("renders the summary text", () => {
      expect(elements.getSummary().textContent).toBe(
        "A challenging metroidvania."
      );
    });

    it("renders the // ABOUT facts label", () => {
      expect(elements.queryFactsLabel()).not.toBeNull();
    });

    it("renders the release year", () => {
      expect(elements.queryReleaseYearTerm()).not.toBeNull();
      expect(elements.queryReleaseYearValue()).not.toBeNull();
    });

    it("renders the developer", () => {
      expect(elements.queryDeveloperTerm()).not.toBeNull();
      expect(elements.queryDeveloperValue()).not.toBeNull();
    });

    it("renders the publisher", () => {
      expect(elements.queryPublisherTerm()).not.toBeNull();
      expect(elements.queryPublisherValue()).not.toBeNull();
    });
  });

  describe("given no summary", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          summary={null}
          releaseYear="2017"
          developer="Team Cherry"
          publisher="Skybound Games"
        />
      );
    });

    it("does not render the summary paragraph", () => {
      expect(elements.querySummary()).toBeNull();
    });
  });

  describe("given developer is absent", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          summary="Some copy."
          releaseYear="2017"
          developer={null}
          publisher="Skybound Games"
        />
      );
    });

    it("omits the developer row", () => {
      expect(elements.queryDeveloperTerm()).toBeNull();
    });

    it("still renders the publisher row", () => {
      expect(elements.queryPublisherTerm()).not.toBeNull();
    });
  });

  describe("given publisher is absent", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          summary="Some copy."
          releaseYear="2017"
          developer="Team Cherry"
          publisher={null}
        />
      );
    });

    it("omits the publisher row", () => {
      expect(elements.queryPublisherTerm()).toBeNull();
    });
  });

  describe("given release year is absent", () => {
    beforeEach(() => {
      render(
        <AboutPanel
          summary="Some copy."
          releaseYear={null}
          developer="Team Cherry"
          publisher="Skybound Games"
        />
      );
    });

    it("omits the release year row", () => {
      expect(elements.queryReleaseYearTerm()).toBeNull();
    });
  });

  describe("given every field is absent (title-only catalog)", () => {
    beforeEach(() => {
      render(
        <div data-testid="about-host">
          <AboutPanel
            summary={null}
            releaseYear={null}
            developer={null}
            publisher={null}
          />
        </div>
      );
    });

    it("renders nothing at all (no summary, no facts label, no placeholder)", () => {
      expect(elements.querySummary()).toBeNull();
      expect(elements.queryFactsLabel()).toBeNull();
      expect(screen.getByTestId("about-host").textContent).toBe("");
    });

    it("does not emit an em-dash placeholder", () => {
      expect(screen.queryByText("—")).toBeNull();
    });
  });
});
