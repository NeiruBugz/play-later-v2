import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { TimesToBeatSection } from "./times-to-beat-section";

const elements = {
  getMainStoryValue: () => {
    const dts = screen.getAllByRole("term");
    const mainStoryIdx = Array.from(dts).findIndex(
      (dt) => dt.textContent === "Main story"
    );
    const dds = screen.getAllByRole("definition");
    return dds[mainStoryIdx];
  },
  getCompletionistValue: () => {
    const dts = screen.getAllByRole("term");
    const completionistIdx = Array.from(dts).findIndex(
      (dt) => dt.textContent === "Completionist"
    );
    const dds = screen.getAllByRole("definition");
    return dds[completionistIdx];
  },
  getSection: () => screen.getByRole("region", { name: "Times to beat" }),
};

describe("TimesToBeatSection", () => {
  describe("given both mainStory and completionist are provided as seconds", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 36000, completionist: 72000 }}
        />
      );
    });

    it("renders the section heading", () => {
      expect(elements.getSection()).toBeDefined();
    });

    it("formats mainStory seconds to decimal hours", () => {
      // 36000 seconds = 10.0 hours
      expect(elements.getMainStoryValue()?.textContent).toBe("10.0 h");
    });

    it("formats completionist seconds to decimal hours", () => {
      // 72000 seconds = 20.0 hours
      expect(elements.getCompletionistValue()?.textContent).toBe("20.0 h");
    });
  });

  describe("given fractional hours (rounding)", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 5400, completionist: 3700 }}
        />
      );
    });

    it("rounds mainStory to one decimal place", () => {
      // 5400 / 3600 = 1.5 h
      expect(elements.getMainStoryValue()?.textContent).toBe("1.5 h");
    });

    it("rounds completionist to one decimal place", () => {
      // 3700 / 3600 = 1.0277... → rounds to 1.0 h
      expect(elements.getCompletionistValue()?.textContent).toBe("1.0 h");
    });
  });

  describe("given mainStory is null (no data)", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: null, completionist: 14400 }}
        />
      );
    });

    it("renders the em-dash for the null main story value", () => {
      expect(elements.getMainStoryValue()?.textContent).toBe("—");
    });

    it("still renders the completionist value", () => {
      // 14400 / 3600 = 4.0 h
      expect(elements.getCompletionistValue()?.textContent).toBe("4.0 h");
    });
  });

  describe("given completionist is null (no data)", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 10800, completionist: null }}
        />
      );
    });

    it("renders the em-dash for the null completionist value", () => {
      expect(elements.getCompletionistValue()?.textContent).toBe("—");
    });

    it("still renders the main story value", () => {
      // 10800 / 3600 = 3.0 h
      expect(elements.getMainStoryValue()?.textContent).toBe("3.0 h");
    });
  });

  describe("given both values are null", () => {
    beforeEach(() => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: null, completionist: null }}
        />
      );
    });

    it("renders em-dash for both fields", () => {
      expect(elements.getMainStoryValue()?.textContent).toBe("—");
      expect(elements.getCompletionistValue()?.textContent).toBe("—");
    });
  });
});
