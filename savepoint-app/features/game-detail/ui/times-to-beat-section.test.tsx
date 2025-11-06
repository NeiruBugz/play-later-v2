import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { TimesToBeatSection } from "./times-to-beat-section";

describe("TimesToBeatSection", () => {
  describe("Section structure", () => {
    it("should render the section title", () => {
      render(<TimesToBeatSection />);

      expect(screen.getByText("Times to Beat")).toBeInTheDocument();
    });

    it("should render main story label", () => {
      render(<TimesToBeatSection />);

      expect(screen.getByText("Main Story:")).toBeInTheDocument();
    });

    it("should render 100% completion label", () => {
      render(<TimesToBeatSection />);

      expect(screen.getByText("100% Completion:")).toBeInTheDocument();
    });
  });

  describe("No data scenarios", () => {
    it("should display dashes when no data is provided", () => {
      render(<TimesToBeatSection />);

      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(2);
    });

    it("should display dashes when timesToBeat is undefined", () => {
      render(<TimesToBeatSection timesToBeat={undefined} />);

      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(2);
    });

    it("should display dashes when timesToBeat is empty object", () => {
      render(<TimesToBeatSection timesToBeat={{}} />);

      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(2);
    });

    it("should display dash for main story when only completionist is available", () => {
      render(<TimesToBeatSection timesToBeat={{ completionist: 80 }} />);

      expect(screen.getByText("Main Story:").nextSibling).toHaveTextContent(
        "—"
      );
      expect(
        screen.getByText("100% Completion:").nextSibling
      ).toHaveTextContent("80 hours");
    });

    it("should display dash for completionist when only main story is available", () => {
      render(<TimesToBeatSection timesToBeat={{ mainStory: 30 }} />);

      expect(screen.getByText("Main Story:").nextSibling).toHaveTextContent(
        "30 hours"
      );
      expect(
        screen.getByText("100% Completion:").nextSibling
      ).toHaveTextContent("—");
    });
  });

  describe("With data scenarios", () => {
    it("should display time values in hours when both are provided", () => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 30, completionist: 80 }}
        />
      );

      expect(screen.getByText("Main Story:").nextSibling).toHaveTextContent(
        "30 hours"
      );
      expect(
        screen.getByText("100% Completion:").nextSibling
      ).toHaveTextContent("80 hours");
    });

    it("should display main story time correctly", () => {
      render(<TimesToBeatSection timesToBeat={{ mainStory: 12 }} />);

      expect(screen.getByText("Main Story:").nextSibling).toHaveTextContent(
        "12 hours"
      );
    });

    it("should display completionist time correctly", () => {
      render(<TimesToBeatSection timesToBeat={{ completionist: 150 }} />);

      expect(
        screen.getByText("100% Completion:").nextSibling
      ).toHaveTextContent("150 hours");
    });

    it("should handle single digit hours", () => {
      render(
        <TimesToBeatSection timesToBeat={{ mainStory: 5, completionist: 8 }} />
      );

      expect(screen.getByText("Main Story:").nextSibling).toHaveTextContent(
        "5 hours"
      );
      expect(
        screen.getByText("100% Completion:").nextSibling
      ).toHaveTextContent("8 hours");
    });

    it("should handle large hour values", () => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 200, completionist: 500 }}
        />
      );

      expect(screen.getByText("Main Story:").nextSibling).toHaveTextContent(
        "200 hours"
      );
      expect(
        screen.getByText("100% Completion:").nextSibling
      ).toHaveTextContent("500 hours");
    });
  });

  describe("Edge cases", () => {
    it("should handle zero hours", () => {
      render(
        <TimesToBeatSection timesToBeat={{ mainStory: 0, completionist: 0 }} />
      );

      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(2);
    });

    it("should not display dashes when hours are provided", () => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 30, completionist: 80 }}
        />
      );

      expect(screen.queryByText("—")).not.toBeInTheDocument();
    });
  });
});
