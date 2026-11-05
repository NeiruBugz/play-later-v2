import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it } from "vitest";

import { YourPacePanel } from "./your-pace-panel";

const elements = {
  getSection: () => screen.getByRole("region", { name: "Your pace" }),
  getStat: (label: string) => screen.getByRole("group", { name: label }),
  getBars: () => screen.getAllByRole("img", { name: /^Session \d/ }),
  queryBars: () => screen.queryAllByRole("img", { name: /^Session \d/ }),
};

describe("YourPacePanel", () => {
  describe("given several recorded sessions", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          playtimeTotalMinutes={600}
          playtimeSessionCount={4}
          recentSessionMinutes={[60, 120, 180, 240]}
        />
      );
    });

    it("renders the section", () => {
      expect(elements.getSection()).toBeDefined();
    });

    it("shows the sessions count", () => {
      expect(within(elements.getStat("Sessions")).getByText("4")).toBeDefined();
    });

    it("shows time played in hours", () => {
      // 600 minutes = 10h
      expect(
        within(elements.getStat("Time played")).getByText("10 h")
      ).toBeDefined();
    });

    it("shows the average per session", () => {
      // 10h / 4 sessions = 2.5h
      expect(
        within(elements.getStat("Per session")).getByText("2.5 h")
      ).toBeDefined();
    });

    it("renders one recent-session bar per recorded session", () => {
      expect(elements.getBars()).toHaveLength(4);
    });

    it("orders the recent-session bars oldest to newest", () => {
      const bars = elements.getBars();
      expect(bars[0]).toHaveAttribute("aria-label", "Session 1: 1 h");
      expect(bars[3]).toHaveAttribute("aria-label", "Session 4: 4 h");
    });
  });

  describe("given 2 notes with time out of 4 notes", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          playtimeTotalMinutes={600}
          playtimeSessionCount={2}
          recentSessionMinutes={[240, 360]}
        />
      );
    });

    it("counts only the notes with time as sessions", () => {
      expect(within(elements.getStat("Sessions")).getByText("2")).toBeDefined();
    });

    it("averages over the sessions with time", () => {
      // 600min / 2 = 5h
      expect(
        within(elements.getStat("Per session")).getByText("5 h")
      ).toBeDefined();
    });
  });

  describe("given no notes with time", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          playtimeTotalMinutes={0}
          playtimeSessionCount={0}
          recentSessionMinutes={[]}
        />
      );
    });

    it("shows zero sessions", () => {
      expect(within(elements.getStat("Sessions")).getByText("0")).toBeDefined();
    });

    it("renders no recent-session bars", () => {
      expect(elements.queryBars()).toHaveLength(0);
    });
  });

  describe("given zero sessions", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          playtimeTotalMinutes={0}
          playtimeSessionCount={0}
          recentSessionMinutes={[]}
        />
      );
    });

    it("shows a zero average rather than dividing by zero", () => {
      expect(
        within(elements.getStat("Per session")).getByText("0 h")
      ).toBeDefined();
    });
  });

  // -------------------------------------------------------------------------
  // Bug #2 — total > 0 with sessions === 0 must not render Infinity/NaN
  // (e.g. a run that has playtime from hours field but zero journal sessions)
  // -------------------------------------------------------------------------

  describe("given playtime total is set but session count is zero", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          playtimeTotalMinutes={600}
          playtimeSessionCount={0}
          recentSessionMinutes={[]}
        />
      );
    });

    it("shows 0h for avg session instead of Infinity or NaN", () => {
      expect(
        within(elements.getStat("Per session")).getByText("0 h")
      ).toBeDefined();
    });
  });
});
