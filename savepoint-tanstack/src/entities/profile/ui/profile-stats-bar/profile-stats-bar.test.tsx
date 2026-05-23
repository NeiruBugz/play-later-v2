import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { ProfileStatsBar } from "./profile-stats-bar";

const stubStats = {
  totalGames: 10,
  playing: 3,
  completed: 5,
  journalEntries: 7,
};

const elements = {
  getStatLabel: (label: string) => screen.getByText(label),
};

describe("ProfileStatsBar", () => {
  describe("given a stats object with mixed status counts", () => {
    beforeEach(() => {
      render(
        <ProfileStatsBar
          totalGames={stubStats.totalGames}
          playing={stubStats.playing}
          completed={stubStats.completed}
          journalEntries={stubStats.journalEntries}
        />
      );
    });

    it("renders the In Library count", () => {
      expect(elements.getStatLabel("In Library")).toBeDefined();
      expect(screen.getByText("10")).toBeDefined();
    });

    it("renders the Playing count", () => {
      expect(elements.getStatLabel("Playing")).toBeDefined();
      expect(screen.getByText("3")).toBeDefined();
    });

    it("renders the Completed count", () => {
      expect(elements.getStatLabel("Completed")).toBeDefined();
      expect(screen.getByText("5")).toBeDefined();
    });

    it("renders the Journal Entries count", () => {
      expect(elements.getStatLabel("Journal Entries")).toBeDefined();
      expect(screen.getByText("7")).toBeDefined();
    });
  });

  describe("given a stats object with zero counts", () => {
    beforeEach(() => {
      render(
        <ProfileStatsBar
          totalGames={0}
          playing={0}
          completed={0}
          journalEntries={0}
        />
      );
    });

    it("renders zeros for each status", () => {
      const zeros = screen.getAllByText("0");
      expect(zeros.length).toBe(4);
    });
  });
});
