import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { DashboardPage } from "./dashboard-page";

// Link-rendering composition — mock the router to a plain anchor so the page
// can render without a RouterProvider. Drop `params` / `search` before
// spreading so React doesn't warn about unknown DOM attrs.
vi.mock("@tanstack/react-router", () => ({
  Link: ({ to, children, ...rest }: any) => {
    delete rest.params;
    delete rest.search;
    return (
      <a href={typeof to === "string" ? to : "#"} {...rest}>
        {children}
      </a>
    );
  },
}));

// Stub the child widgets — this suite verifies composition logic
// (greeting, empty-library branch, stats threshold, section presence),
// not the children's internals which are covered elsewhere.
vi.mock("../dashboard-quick-log-hero", () => ({
  DashboardQuickLogHero: ({ username }: { username: string }) => (
    <div data-testid="quick-log-hero">{`hero:${username}`}</div>
  ),
}));

vi.mock("../dashboard-stats-card", () => ({
  DashboardStatsCard: () => <div data-testid="stats-card" />,
}));

vi.mock("../dashboard-game-section", () => ({
  DashboardGameSection: ({ title }: { title: string }) => (
    <section data-testid="game-section">{title}</section>
  ),
}));

function makeData(
  overrides: Partial<DashboardPageData> = {}
): DashboardPageData {
  return {
    username: "Ada",
    statusCounts: {
      WISHLIST: 0,
      SHELF: 0,
      UP_NEXT: 0,
      PLAYING: 0,
      PLAYED: 0,
    },
    hasEmptyLibrary: true,
    showStats: false,
    quickLogGames: [],
    continuePlaying: { items: [], total: 0 },
    upNext: { items: [], total: 0 },
    recentlyAdded: { items: [] },
    ...overrides,
  };
}

const elements = {
  getQuickLogHero: () => screen.getByTestId("quick-log-hero"),
  getStatsCard: () => screen.queryByTestId("stats-card"),
  getGameSections: () => screen.queryAllByTestId("game-section"),
  getEmptyLibraryHeading: () => screen.queryByText("Your library is empty"),
  getBrowseLibraryLink: () =>
    screen.queryByRole("link", { name: "Browse Library" }),
};

describe("DashboardPage", () => {
  describe("given the library is empty", () => {
    beforeEach(() => {
      render(<DashboardPage data={makeData()} />);
    });

    it("renders the quick-log hero with the username threaded in", () => {
      expect(elements.getQuickLogHero().textContent).toBe("hero:Ada");
    });

    it("renders the empty-library fallback heading", () => {
      expect(elements.getEmptyLibraryHeading()).not.toBeNull();
    });

    it("renders the Browse Library CTA pointing at /library", () => {
      expect(elements.getBrowseLibraryLink()).toHaveAttribute(
        "href",
        "/library"
      );
    });

    it("does not render any game sections in the empty-library branch", () => {
      expect(elements.getGameSections()).toHaveLength(0);
    });

    it("does not render the stats card when showStats is false", () => {
      expect(elements.getStatsCard()).toBeNull();
    });
  });

  describe("given the library has games but stats are below threshold", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            hasEmptyLibrary: false,
            showStats: false,
            statusCounts: {
              WISHLIST: 0,
              SHELF: 0,
              UP_NEXT: 0,
              PLAYING: 2,
              PLAYED: 0,
            },
          })}
        />
      );
    });

    it("renders all three game sections (Playing / Up Next / Recently Added)", () => {
      const titles = elements.getGameSections().map((el) => el.textContent);
      expect(titles).toEqual(["Playing", "Up Next", "Recently Added"]);
    });

    it("does not render the empty-library fallback", () => {
      expect(elements.getEmptyLibraryHeading()).toBeNull();
    });

    it("does not render the stats card when below threshold", () => {
      expect(elements.getStatsCard()).toBeNull();
    });
  });

  describe("given the library has games and stats are above threshold", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            hasEmptyLibrary: false,
            showStats: true,
            statusCounts: {
              WISHLIST: 1,
              SHELF: 1,
              UP_NEXT: 1,
              PLAYING: 1,
              PLAYED: 1,
            },
          })}
        />
      );
    });

    it("renders the stats card", () => {
      expect(elements.getStatsCard()).not.toBeNull();
    });

    it("still renders the three game sections", () => {
      expect(elements.getGameSections()).toHaveLength(3);
    });
  });
});
