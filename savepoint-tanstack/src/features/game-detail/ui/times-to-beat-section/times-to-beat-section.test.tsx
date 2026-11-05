import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { TimesToBeatSection } from "./times-to-beat-section";

const elements = {
  getSection: () => screen.getByRole("region", { name: "Times to beat" }),
  querySection: () => screen.queryByRole("region", { name: "Times to beat" }),
  queryHeading: () => screen.queryByText("Times to beat"),
  getMainStory: () => screen.getByText("Main story"),
  queryMainStory: () => screen.queryByText("Main story"),
  getCompletionist: () => screen.getByText("100%"),
  queryCompletionist: () => screen.queryByText("100%"),
  getHours: (hours: string) => screen.getByText(hours),
  queryYouMarker: () => screen.queryByText(/^You ·/),
  queryPace: () => screen.queryByText("Your pace"),
  queryComparison: () => screen.queryByText(/long road|past the main story/),
};

describe("TimesToBeatSection", () => {
  describe("given both a main-story and a completionist benchmark", () => {
    beforeEach(() => {
      // mainStory 36000s = 10h, completionist 72000s = 20h
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 36000, completionist: 72000 }}
        />
      );
    });

    it("renders the times-to-beat section", () => {
      expect(elements.getSection()).toBeDefined();
    });

    it("shows the main-story hours", () => {
      expect(elements.getHours("10 h")).toBeDefined();
    });

    it("shows the 100% hours", () => {
      expect(elements.getHours("20 h")).toBeDefined();
    });

    it("draws no 'You' marker", () => {
      expect(elements.queryYouMarker()).toBeNull();
    });

    it("draws no comparison sentence", () => {
      expect(elements.queryComparison()).toBeNull();
    });
  });

  describe("given only the main-story benchmark", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 36000, completionist: null }}
        />
      );
    });

    it("shows the main story", () => {
      expect(elements.getMainStory()).toBeDefined();
    });

    it("omits the 100% entry", () => {
      expect(elements.queryCompletionist()).toBeNull();
    });
  });

  describe("given only the completionist benchmark", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: null, completionist: 72000 }}
        />
      );
    });

    it("shows the 100% entry", () => {
      expect(elements.getCompletionist()).toBeDefined();
    });

    it("omits the main story", () => {
      expect(elements.queryMainStory()).toBeNull();
    });
  });

  describe("given a benchmark whose fields are both null", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: null, completionist: null }}
        />
      );
    });

    it("renders nothing, not even the heading", () => {
      expect(elements.querySection()).toBeNull();
      expect(elements.queryHeading()).toBeNull();
    });
  });

  describe("given no benchmark (null)", () => {
    beforeEach(() => {
      render(<TimesToBeatSection timesToBeat={null} />);
    });

    it("renders nothing, not even the heading", () => {
      expect(elements.querySection()).toBeNull();
      expect(elements.queryHeading()).toBeNull();
    });

    it("falls back to no pace panel", () => {
      expect(elements.queryPace()).toBeNull();
    });
  });
});
