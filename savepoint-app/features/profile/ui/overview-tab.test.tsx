import type {
  LibraryPreviewGame,
  LibraryStats,
} from "@/data-access-layer/services/profile/types";
import { render, screen } from "@testing-library/react";

import { OverviewTab } from "./overview-tab";
import { ProfileStatsBar } from "./profile-stats-bar";

vi.mock("./profile-stats-bar", () => ({
  ProfileStatsBar: vi.fn(() => <div data-testid="profile-stats-bar-stub" />),
}));

const mockProfileStatsBar = vi.mocked(ProfileStatsBar);

const BASE_STATS: LibraryStats = {
  statusCounts: {
    PLAYING: 3,
    COMPLETED: 5,
    WANT_TO_PLAY: 2,
  },
  recentGames: [
    {
      gameId: "game-1",
      title: "Elden Ring",
      coverImage: "elden-ring-cover",
      lastPlayed: new Date("2024-01-15"),
    },
    {
      gameId: "game-2",
      title: "Hollow Knight",
      coverImage: null,
      lastPlayed: new Date("2024-01-10"),
    },
  ],
  journalCount: 7,
};

const BASE_LIBRARY_PREVIEW: LibraryPreviewGame[] = [
  { title: "Elden Ring", coverImage: "elden-ring-cover", slug: "elden-ring" },
  { title: "Hollow Knight", coverImage: null, slug: "hollow-knight" },
  { title: "Celeste", coverImage: "celeste-cover", slug: "celeste" },
];

type RenderOptions = {
  stats?: LibraryStats;
  libraryPreview?: LibraryPreviewGame[];
  gameCount?: number;
};

function renderOverviewTab(overrides: RenderOptions = {}) {
  const props = {
    stats: overrides.stats ?? BASE_STATS,
    libraryPreview: overrides.libraryPreview ?? BASE_LIBRARY_PREVIEW,
    gameCount: overrides.gameCount ?? 15,
  };

  return render(<OverviewTab {...props} />);
}

describe("OverviewTab", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("stats bar", () => {
    it("renders the stats bar regardless of game count", () => {
      renderOverviewTab({ gameCount: 0 });

      expect(screen.getByTestId("profile-stats-bar-stub")).toBeInTheDocument();
    });

    it("renders the stats bar when gameCount is below threshold", () => {
      renderOverviewTab({ gameCount: 3 });

      expect(screen.getByTestId("profile-stats-bar-stub")).toBeInTheDocument();
    });

    it("renders the stats bar when gameCount meets threshold", () => {
      renderOverviewTab({ gameCount: 10 });

      expect(screen.getByTestId("profile-stats-bar-stub")).toBeInTheDocument();
    });

    it("passes stats values to ProfileStatsBar", () => {
      renderOverviewTab({ gameCount: 20 });

      expect(mockProfileStatsBar).toHaveBeenCalledWith(
        expect.objectContaining({
          totalGames: expect.any(Number),
        }),
        undefined
      );
    });
  });

  describe("library stats grid", () => {
    it("is hidden when gameCount is 0", () => {
      renderOverviewTab({ gameCount: 0 });

      expect(
        screen.queryByTestId("overview-library-stats-grid")
      ).not.toBeInTheDocument();
    });

    it("is hidden when gameCount is 9", () => {
      renderOverviewTab({ gameCount: 9 });

      expect(
        screen.queryByTestId("overview-library-stats-grid")
      ).not.toBeInTheDocument();
    });

    it("is hidden when gameCount is 1", () => {
      renderOverviewTab({ gameCount: 1 });

      expect(
        screen.queryByTestId("overview-library-stats-grid")
      ).not.toBeInTheDocument();
    });

    it("is visible when gameCount is exactly 10", () => {
      renderOverviewTab({ gameCount: 10 });

      expect(
        screen.getByTestId("overview-library-stats-grid")
      ).toBeInTheDocument();
    });

    it("is visible when gameCount is greater than 10", () => {
      renderOverviewTab({ gameCount: 42 });

      expect(
        screen.getByTestId("overview-library-stats-grid")
      ).toBeInTheDocument();
    });
  });

  describe("recently played section", () => {
    it("is hidden when recentGames is empty", () => {
      renderOverviewTab({
        stats: { ...BASE_STATS, recentGames: [] },
        gameCount: 20,
      });

      expect(
        screen.queryByTestId("overview-recently-played")
      ).not.toBeInTheDocument();
    });

    it("is visible when recentGames has entries", () => {
      renderOverviewTab({ gameCount: 20 });

      expect(
        screen.getByTestId("overview-recently-played")
      ).toBeInTheDocument();
    });

    it("renders an entry for each recently played game", () => {
      renderOverviewTab({ gameCount: 20 });

      const entries = screen.getAllByTestId("overview-recently-played-entry");
      expect(entries).toHaveLength(BASE_STATS.recentGames.length);
    });

    it("renders the title of each recently played game", () => {
      renderOverviewTab({ gameCount: 20 });

      expect(screen.getByText("Elden Ring")).toBeInTheDocument();
      expect(screen.getByText("Hollow Knight")).toBeInTheDocument();
    });
  });

  describe("library preview section", () => {
    it("is hidden when libraryPreview is empty", () => {
      renderOverviewTab({ libraryPreview: [], gameCount: 20 });

      expect(
        screen.queryByTestId("overview-library-preview")
      ).not.toBeInTheDocument();
    });

    it("is visible when libraryPreview has entries", () => {
      renderOverviewTab({ gameCount: 20 });

      expect(
        screen.getByTestId("overview-library-preview")
      ).toBeInTheDocument();
    });

    it("renders a cover link for each game in the preview", () => {
      renderOverviewTab({ gameCount: 20 });

      const covers = screen.getAllByTestId("overview-library-preview-item");
      expect(covers).toHaveLength(BASE_LIBRARY_PREVIEW.length);
    });

    it("links each preview item to its game detail page", () => {
      renderOverviewTab({ gameCount: 20 });

      const links = screen.getAllByRole("link", {
        name: /elden ring|hollow knight|celeste/i,
      });
      const hrefs = links.map((link) => link.getAttribute("href"));

      expect(hrefs).toContain("/games/elden-ring");
      expect(hrefs).toContain("/games/hollow-knight");
      expect(hrefs).toContain("/games/celeste");
    });
  });
});
