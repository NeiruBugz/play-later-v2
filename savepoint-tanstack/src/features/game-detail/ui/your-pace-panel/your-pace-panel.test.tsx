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
          journalCount={4}
          playtimeTotalMinutes={600}
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

    it("shows the total logged hours", () => {
      // 600 minutes = 10h
      expect(within(elements.getStat("Total")).getByText("10h")).toBeDefined();
    });

    it("shows the average per session", () => {
      // 10h / 4 sessions = 2.5h
      expect(
        within(elements.getStat("Avg session")).getByText("2.5h")
      ).toBeDefined();
    });

    it("renders one recent-session bar per recorded session", () => {
      expect(elements.getBars()).toHaveLength(4);
    });

    it("orders the recent-session bars oldest to newest", () => {
      const bars = elements.getBars();
      expect(bars[0]).toHaveAttribute("aria-label", "Session 1: 1h");
      expect(bars[3]).toHaveAttribute("aria-label", "Session 4: 4h");
    });
  });

  describe("given no recorded session minutes", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          journalCount={2}
          playtimeTotalMinutes={0}
          recentSessionMinutes={[]}
        />
      );
    });

    it("still shows the sessions count", () => {
      expect(within(elements.getStat("Sessions")).getByText("2")).toBeDefined();
    });

    it("renders no recent-session bars", () => {
      expect(elements.queryBars()).toHaveLength(0);
    });
  });

  describe("given zero sessions", () => {
    beforeEach(() => {
      render(
        <YourPacePanel
          journalCount={0}
          playtimeTotalMinutes={0}
          recentSessionMinutes={[]}
        />
      );
    });

    it("shows a zero average rather than dividing by zero", () => {
      expect(
        within(elements.getStat("Avg session")).getByText("0h")
      ).toBeDefined();
    });
  });
});
