import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { DashboardPageData } from "@/features/dashboard";

import { DashboardPage } from "./dashboard-page";

const mockNavigate = vi.fn();

// Link-rendering composition — mock the router to a plain anchor.
// Drop `params` / `search` before spreading so React doesn't warn about
// unknown DOM attrs.
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
  useNavigate: () => mockNavigate,
}));

// Stub child widgets — this suite verifies composition and structural
// layout, not each child's internals.
vi.mock("../dashboard-jump-back-in-hero", () => ({
  DashboardJumpBackInHero: ({
    mostInProgressGame,
  }: {
    mostInProgressGame: { slug: string } | null;
  }) => (
    <div data-testid="jump-back-in-hero">
      {`hero:${mostInProgressGame?.slug ?? "none"}`}
    </div>
  ),
}));

vi.mock("../dashboard-continue-list", () => ({
  DashboardContinueList: () => <div data-testid="continue-list" />,
}));

vi.mock("../dashboard-status-strip", () => ({
  DashboardStatusStrip: () => <div data-testid="status-strip" />,
}));

vi.mock("../dashboard-game-rail", () => ({
  DashboardGameRail: ({
    title,
    items,
    viewAll,
    viewAllLabel,
    emptyMessage,
  }: {
    title: string;
    items: unknown[];
    viewAll: { status?: string };
    viewAllLabel?: string;
    emptyMessage?: string;
  }) => (
    <section
      data-testid="game-rail"
      data-count={items.length}
      data-view-all-status={viewAll.status}
      data-view-all-label={viewAllLabel}
      data-empty={emptyMessage}
    >
      {title}
    </section>
  ),
}));

vi.mock("../dashboard-stats-card", () => ({
  DashboardStatsCard: () => <div data-testid="stats-card" />,
}));

function makeData(
  overrides: Partial<DashboardPageData> = {}
): DashboardPageData {
  return {
    username: "Ada",
    statusCounts: {
      WANT: 0,
      PLAYING: 0,
      DONE: 0,
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
  getJumpBackInHero: () => screen.getByTestId("jump-back-in-hero"),
  getStatusStrip: () => screen.queryByTestId("status-strip"),
  getGameRails: () => screen.queryAllByTestId("game-rail"),
  getStatsCard: () => screen.queryByTestId("stats-card"),
  getEmptyLibraryHeading: () => screen.queryByText("Your library is empty"),
  getBrowseLibraryLink: () =>
    screen.queryByRole("link", { name: "Browse Library" }),
};

describe("DashboardPage", () => {
  beforeEach(() => {
    mockNavigate.mockReset();
  });

  describe("given the Home header", () => {
    beforeEach(() => {
      render(<DashboardPage data={makeData()} />);
    });

    it("opens the add search from the Add game button", async () => {
      await userEvent.click(screen.getByRole("button", { name: "Add game" }));
      const { search } = mockNavigate.mock.calls[0][0];
      expect(search({})).toEqual({ action: "add-game", game: undefined });
    });
  });

  describe("given the library is empty", () => {
    beforeEach(() => {
      render(<DashboardPage data={makeData()} />);
    });

    it("renders the jump-back-in hero with no game threaded in", () => {
      expect(elements.getJumpBackInHero().textContent).toBe("hero:none");
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

    it("does not render any game rails in the empty-library branch", () => {
      expect(elements.getGameRails()).toHaveLength(0);
    });

    it("does not render the stats card when showStats is false", () => {
      expect(elements.getStatsCard()).toBeNull();
    });
  });

  describe("given the library has games", () => {
    beforeEach(() => {
      render(
        <DashboardPage
          data={makeData({
            hasEmptyLibrary: false,
            showStats: false,
            quickLogGames: [
              {
                id: "g1",
                igdbId: 1,
                title: "Elden Ring",
                slug: "elden-ring",
                coverImage: null,
                platform: null,
              },
            ],
            statusCounts: {
              WANT: 2,
              PLAYING: 3,
              DONE: 1,
            },
            continuePlaying: {
              items: [],
              total: 3,
            },
            upNext: { items: [], total: 2 },
            recentlyAdded: { items: [] },
          })}
        />
      );
    });

    it("renders the jump-back-in hero with the first quickLogGame's slug", () => {
      expect(elements.getJumpBackInHero().textContent).toBe("hero:elden-ring");
    });

    it("renders the compact status strip", () => {
      expect(elements.getStatusStrip()).not.toBeNull();
    });

    it("renders the three game rails (Playing, Up next, Recently played)", () => {
      const titles = elements.getGameRails().map((el) => el.textContent);
      expect(titles).toEqual(
        expect.arrayContaining(["Playing", "Up Next", "Recently played"])
      );
    });

    it("does not render the empty-library fallback", () => {
      expect(elements.getEmptyLibraryHeading()).toBeNull();
    });

    it("does not render the stats card when showStats is false", () => {
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
              WANT: 1,
              PLAYING: 1,
              DONE: 1,
            },
          })}
        />
      );
    });

    it("renders the stats card", () => {
      expect(elements.getStatsCard()).not.toBeNull();
    });

    it("renders three game rails (the desktop Playing slot is the continue list)", () => {
      expect(elements.getGameRails()).toHaveLength(3);
    });

    it("renders the desktop continue list beside the hero", () => {
      expect(screen.getByTestId("continue-list")).not.toBeNull();
    });
  });

  describe("given more than 3 games are queued", () => {
    beforeEach(() => {
      const queued = [1, 2, 3, 4, 5].map((n) => ({ id: n }));
      render(
        <DashboardPage
          data={makeData({
            hasEmptyLibrary: false,
            statusCounts: { WANT: 5, PLAYING: 0, DONE: 0 },
            upNext: {
              items: queued as unknown as DashboardPageData["upNext"]["items"],
              total: 5,
            },
          })}
        />
      );
    });

    it("shows only the first 3 in the Up Next rail, with See all to the Up Next filter and the empty copy ready", () => {
      const rail = elements
        .getGameRails()
        .find((el) => el.textContent === "Up Next")!;
      expect(rail).toHaveAttribute("data-count", "3");
      expect(rail).toHaveAttribute("data-view-all-status", "UP_NEXT");
      expect(rail).toHaveAttribute("data-view-all-label", "See all");
      expect(rail).toHaveAttribute(
        "data-empty",
        "Nothing queued yet — put up to 5 games in Up Next."
      );
    });
  });
});
