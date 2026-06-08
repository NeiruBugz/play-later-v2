import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { TimesToBeatSection } from "./times-to-beat-section";

const elements = {
  getSection: () => screen.getByRole("region", { name: "Times to beat" }),
  querySection: () => screen.queryByRole("region", { name: "Times to beat" }),
  queryPace: () => screen.queryByRole("region", { name: "Your pace" }),
  getYouMarker: () => screen.getByText(/^You ·/),
  queryYouMarker: () => screen.queryByText(/^You ·/),
  getMainStoryTick: () => screen.queryByText("Main story"),
  getCompletionistTick: () => screen.queryByText("100%"),
  getContext: () => screen.getByTestId("times-to-beat-context"),
};

const noPace = {
  playtimeTotalMinutes: 0,
  journalCount: 0,
  playtimeSessionCount: 0,
  recentSessionMinutes: [],
};

describe("TimesToBeatSection", () => {
  describe("given a benchmark with both main-story and completionist plus viewer hours", () => {
    beforeEach(() => {
      // mainStory 36000s = 10h, completionist 72000s = 20h, viewer 720min = 12h
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 36000, completionist: 72000 }}
          playtimeTotalMinutes={720}
          journalCount={3}
          playtimeSessionCount={3}
          recentSessionMinutes={[120, 240, 360]}
        />
      );
    });

    it("renders the times-to-beat section (benchmark mode)", () => {
      expect(elements.getSection()).toBeDefined();
    });

    it("does not render the Your Pace fallback", () => {
      expect(elements.queryPace()).toBeNull();
    });

    it("marks the viewer's hours with an accent 'You' marker", () => {
      expect(elements.getYouMarker().textContent).toContain("12h");
    });

    it("renders the main-story benchmark tick", () => {
      expect(elements.getMainStoryTick()).not.toBeNull();
    });

    it("renders the 100% benchmark tick", () => {
      expect(elements.getCompletionistTick()).not.toBeNull();
    });

    it("puts the viewer's progress in context relative to the main story", () => {
      // 12h - 10h = 2h past the main story; 20h - 12h = 8h left to 100%
      const text = elements.getContext().textContent ?? "";
      expect(text).toContain("2h past");
      expect(text).toContain("8h");
    });
  });

  describe("given the viewer is short of the main story", () => {
    beforeEach(() => {
      // mainStory 36000s = 10h, viewer 180min = 3h
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 36000, completionist: 72000 }}
          playtimeTotalMinutes={180}
          journalCount={1}
          playtimeSessionCount={1}
          recentSessionMinutes={[180]}
        />
      );
    });

    it("phrases the context as hours from the main story", () => {
      const text = elements.getContext().textContent ?? "";
      expect(text).toContain("7h from");
    });
  });

  describe("given only the main-story benchmark is present", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 36000, completionist: null }}
          {...noPace}
        />
      );
    });

    it("renders the main-story tick", () => {
      expect(elements.getMainStoryTick()).not.toBeNull();
    });

    it("omits the 100% tick", () => {
      expect(elements.getCompletionistTick()).toBeNull();
    });
  });

  describe("given only the completionist benchmark is present", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: null, completionist: 72000 }}
          {...noPace}
        />
      );
    });

    it("renders the 100% tick", () => {
      expect(elements.getCompletionistTick()).not.toBeNull();
    });

    it("omits the main-story tick", () => {
      expect(elements.getMainStoryTick()).toBeNull();
    });
  });

  describe("given a benchmark object whose fields are both null", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: null, completionist: null }}
          {...noPace}
        />
      );
    });

    it("still renders the benchmark section rather than the pace fallback", () => {
      expect(elements.getSection()).toBeDefined();
      expect(elements.queryPace()).toBeNull();
    });

    it("renders neither benchmark tick", () => {
      expect(elements.getMainStoryTick()).toBeNull();
      expect(elements.getCompletionistTick()).toBeNull();
    });

    it("renders an empty context sentence rather than fabricating a benchmark", () => {
      expect(elements.getContext().textContent).toBe("");
    });
  });

  describe("given no benchmark (null)", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={null}
          playtimeTotalMinutes={600}
          journalCount={4}
          playtimeSessionCount={4}
          recentSessionMinutes={[60, 120, 180, 240]}
        />
      );
    });

    it("falls back to the Your Pace panel", () => {
      expect(elements.queryPace()).not.toBeNull();
    });

    it("does not render the benchmark section", () => {
      expect(elements.querySection()).toBeNull();
    });

    it("does not render a 'You' benchmark marker", () => {
      expect(elements.queryYouMarker()).toBeNull();
    });
  });
});
