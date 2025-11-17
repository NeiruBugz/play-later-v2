import { render, screen } from "@testing-library/react";

import { TimesToBeatSection } from "./times-to-beat-section";

describe("TimesToBeatSection", () => {
  describe("Section structure", () => {
    it("should render the section title", () => {
      render(<TimesToBeatSection />);

      expect(screen.getByText("Times to Beat")).toBeVisible();
    });

    it("should render main story label", () => {
      render(<TimesToBeatSection />);

      expect(screen.getByText("Main Story:")).toBeVisible();
    });

    it("should render 100% completion label", () => {
      render(<TimesToBeatSection />);

      expect(screen.getByText("100% Completion:")).toBeVisible();
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

      expect(screen.getByText("80 hours")).toBeVisible();

      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(1);
    });

    it("should display dash for completionist when only main story is available", () => {
      render(<TimesToBeatSection timesToBeat={{ mainStory: 30 }} />);

      expect(screen.getByText("30 hours")).toBeVisible();

      const dashes = screen.getAllByText("—");
      expect(dashes).toHaveLength(1);
    });
  });

  describe("With data scenarios", () => {
    it("should display time values in hours when both are provided", () => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 30, completionist: 80 }}
        />
      );

      expect(screen.getByText("30 hours")).toBeVisible();
      expect(screen.getByText("80 hours")).toBeVisible();
    });

    it("should display main story time correctly", () => {
      render(<TimesToBeatSection timesToBeat={{ mainStory: 12 }} />);

      expect(screen.getByText("12 hours")).toBeVisible();
    });

    it("should display completionist time correctly", () => {
      render(<TimesToBeatSection timesToBeat={{ completionist: 150 }} />);

      expect(screen.getByText("150 hours")).toBeVisible();
    });

    it("should handle single digit hours", () => {
      render(
        <TimesToBeatSection timesToBeat={{ mainStory: 5, completionist: 8 }} />
      );

      expect(screen.getByText("5 hours")).toBeVisible();
      expect(screen.getByText("8 hours")).toBeVisible();
    });

    it("should handle large hour values", () => {
      render(
        <TimesToBeatSection
          timesToBeat={{ mainStory: 200, completionist: 500 }}
        />
      );

      expect(screen.getByText("200 hours")).toBeVisible();
      expect(screen.getByText("500 hours")).toBeVisible();
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
