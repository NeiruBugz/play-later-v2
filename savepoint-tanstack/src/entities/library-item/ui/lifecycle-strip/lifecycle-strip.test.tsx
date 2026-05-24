import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { LibraryLifecycleStrip } from "./lifecycle-strip";

const NOW = new Date("2026-05-23T12:00:00.000Z");
const daysAgo = (n: number) => new Date(NOW.getTime() - n * 86_400_000);

const elements = {
  queryFill: () => screen.queryByTestId("lifecycle-strip-fill"),
  queryMarker: () => screen.queryByTestId("lifecycle-strip-marker"),
  getStrip: () => screen.getByTestId("lifecycle-strip"),
};

describe("LibraryLifecycleStrip", () => {
  describe("given a game currently being played", () => {
    beforeEach(() => {
      render(
        <LibraryLifecycleStrip
          status="PLAYING"
          createdAt={daysAgo(41)}
          startedAt={daysAgo(18)}
          completedAt={null}
          now={NOW}
        />
      );
    });

    it("renders a playing-toned fill and a start marker", () => {
      expect(elements.queryFill()).toHaveAttribute("data-tone", "playing");
      expect(elements.queryMarker()).not.toBeNull();
    });

    it("shows the elapsed-since-start label", () => {
      expect(screen.getByText("started 3w")).toBeInTheDocument();
    });
  });

  describe("given an untouched shelf game", () => {
    beforeEach(() => {
      render(
        <LibraryLifecycleStrip
          status="SHELF"
          createdAt={daysAgo(320)}
          startedAt={null}
          completedAt={null}
          now={NOW}
        />
      );
    });

    it("renders no fill and no marker", () => {
      expect(elements.queryFill()).toBeNull();
      expect(elements.queryMarker()).toBeNull();
    });

    it("labels the right edge with an em-dash", () => {
      expect(screen.getByText("—")).toBeInTheDocument();
    });
  });

  describe("given a completed game", () => {
    beforeEach(() => {
      render(
        <LibraryLifecycleStrip
          status="PLAYED"
          createdAt={daysAgo(90)}
          startedAt={daysAgo(80)}
          completedAt={daysAgo(10)}
          now={NOW}
        />
      );
    });

    it("renders a completed-toned fill and surfaces full timestamps on hover", () => {
      expect(elements.queryFill()).toHaveAttribute("data-tone", "completed");
      expect(elements.getStrip()).toHaveAttribute(
        "title",
        expect.stringContaining("Completed")
      );
    });
  });
});
