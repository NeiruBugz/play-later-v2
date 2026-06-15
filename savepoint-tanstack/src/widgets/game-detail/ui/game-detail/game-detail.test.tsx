import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { PlaythroughWithEntries } from "@/entities/playthrough";
import { createPlaythroughFn } from "@/features/manage-playthrough/api/create-playthrough-fn";
import { updatePlaythroughFn } from "@/features/manage-playthrough/api/update-playthrough-fn";
import type { GameDetailsResponseItem } from "@/shared/api/igdb";

import type {
  Game,
  JournalEntry,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client";
import { GameDetail } from "./game-detail";
import type { GameDetailData } from "./game-detail.type";

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/get-platform-options", () => ({
  getPlatformOptionsFn: vi.fn(() =>
    Promise.resolve([{ label: "This game", platforms: ["PC"] }])
  ),
}));

vi.mock("@/features/manage-library-entry/api/search-platforms-fn", () => ({
  searchPlatformsFn: vi.fn(() => Promise.resolve([])),
}));

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
}));

vi.mock("@/features/manage-playthrough/api/create-playthrough-fn", () => ({
  createPlaythroughFn: vi.fn(),
}));

vi.mock("@/features/manage-playthrough/api/update-playthrough-fn", () => ({
  updatePlaythroughFn: vi.fn(),
}));

vi.mock("@/features/manage-playthrough/api/delete-playthrough-fn", () => ({
  deletePlaythroughFn: vi.fn(),
}));

vi.mock(
  "@/features/manage-playthrough/api/set-library-status-manual-fn",
  () => ({
    setLibraryStatusManualFn: vi.fn(),
  })
);

vi.mock(
  "@/features/manage-playthrough/api/clear-library-status-manual-fn",
  () => ({
    clearLibraryStatusManualFn: vi.fn(),
  })
);

const buildGame = (overrides: Partial<Game> = {}): Game => ({
  id: "game-1",
  igdbId: 1234,
  hltbId: null,
  title: "Hollow Knight",
  description: null,
  coverImage: null,
  releaseDate: new Date("2017-02-24T00:00:00Z"),
  mainStory: null,
  mainExtra: null,
  completionist: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  steamAppId: null,
  slug: "hollow-knight",
  franchiseId: null,
  ...overrides,
});

const buildIgdbDetails = (
  overrides: Partial<GameDetailsResponseItem> = {}
): GameDetailsResponseItem => ({
  id: 1234,
  name: "Hollow Knight",
  slug: "hollow-knight",
  summary: "A challenging metroidvania.",
  ...overrides,
});

const buildLibraryEntry = (): LibraryItem => ({
  id: 42,
  status: "PLAYING",
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  statusChangedAt: null,
  platform: "PC",
  userId: "user-1",
  acquisitionType: "DIGITAL",
  gameId: "game-1",
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  statusIsManual: false,
  rating: null,
});

const buildData = (
  libraryEntry: LibraryItem | null,
  igdbOverrides: Partial<GameDetailsResponseItem> = {},
  gameOverrides: Partial<Game> = {}
): GameDetailData => ({
  game: buildGame(gameOverrides),
  igdbDetails: buildIgdbDetails(igdbOverrides),
  libraryEntry,
  journalTeaser: [],
  journalCount: 0,
  playtimeTotalMinutes: 0,
  playtimeSessionCount: 0,
  recentSessionMinutes: [],
});

const elements = {
  getTitle: () =>
    screen.getByRole("heading", { name: "Hollow Knight", level: 1 }),
  queryBreadcrumbLibrary: () => screen.queryByRole("link", { name: "Library" }),
  queryBreadcrumbGames: () => screen.queryByRole("link", { name: "Games" }),
  queryStatusPill: () =>
    screen.queryByRole("button", { name: /^Change library status:/ }),
  queryAddToLibrary: () =>
    screen.queryByRole("button", { name: "Add to library" }),
  queryStatusSwitcher: () => screen.queryByTestId("library-status-switcher"),
  queryMoreMenuTrigger: () =>
    screen.queryByRole("button", { name: "More library actions" }),
  queryAllTablists: () => screen.queryAllByRole("tablist"),
  queryAllTabpanels: () => screen.queryAllByRole("tabpanel"),
  queryOverviewTab: () => screen.queryByRole("tab", { name: "Overview" }),
  queryJournalHeading: () => screen.queryByRole("heading", { name: "Journal" }),
  queryRelatedSlot: () => screen.queryByTestId("related-games-slot"),
  queryTimesToBeatSlot: () => screen.queryByTestId("times-to-beat-slot"),
  querySummary: () => screen.queryByLabelText("Game summary"),
  queryGameDetailLabel: () => screen.queryByText("// GAME.DETAIL"),
  queryGenresLabel: () => screen.queryByText("// GENRES"),
  queryPlatformsLabel: () => screen.queryByText("// PLATFORMS"),
  getSummaryText: () => screen.getByLabelText("Game summary"),
  queryGenresList: () => screen.queryByLabelText("Genres"),
  queryPlatformsList: () => screen.queryByLabelText("Platforms"),
  queryCriticScoreRing: () => screen.queryByLabelText("Critic score"),
  queryRoundedScore: (rounded: string) => screen.queryByText(rounded),
  queryAboutCard: () => screen.queryByTestId("game-detail-about-card"),
  queryThemesTagsCard: () =>
    screen.queryByTestId("game-detail-themes-tags-card"),
  queryLegacyCatalogCard: () =>
    screen.queryByTestId("game-detail-catalog-card"),
  queryEyebrow: () => screen.queryByLabelText("Release metadata"),
  queryYourRecord: () => screen.queryByTestId("playthroughs-panel"),
  queryThemesLabel: () => screen.queryByText("// THEMES"),
  queryEmDash: () => screen.queryByText("—"),
  queryScreenshotsRegion: () =>
    screen.queryByLabelText("Screenshots of Hollow Knight"),
  queryTrackInvite: () => screen.queryByTestId("add-to-track-invite"),
  querySignInLink: () => screen.queryByRole("link", { name: "Sign in" }),
  getBentoGrid: () => screen.getByTestId("game-detail-bento-grid"),
};

const PRECEDING = Node.DOCUMENT_POSITION_PRECEDING;

const precedes = (first: Element, second: Element): boolean =>
  Boolean(second.compareDocumentPosition(first) & PRECEDING);

describe("GameDetail", () => {
  describe("given an anonymous viewer with no slots", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId={null} />);
    });

    it("renders the game title, breadcrumbs, and the About facts label", () => {
      expect(elements.getTitle()).toBeDefined();
      expect(elements.queryBreadcrumbLibrary()).not.toBeNull();
      expect(elements.queryBreadcrumbGames()).not.toBeNull();
      expect(elements.queryGameDetailLabel()).not.toBeNull();
    });

    it("renders the panels inline with no tablist, tab, or tabpanel roles", () => {
      expect(elements.queryAllTablists()).toHaveLength(0);
      expect(elements.queryOverviewTab()).toBeNull();
      expect(elements.queryAllTabpanels()).toHaveLength(0);
    });

    it("omits the genres and platforms rows when those are absent", () => {
      expect(elements.queryGenresLabel()).toBeNull();
      expect(elements.queryPlatformsLabel()).toBeNull();
    });

    it("does not render the status switcher or Journal panel for anonymous viewers", () => {
      expect(elements.queryStatusSwitcher()).toBeNull();
      expect(elements.queryJournalHeading()).toBeNull();
    });
  });

  describe("given a signed-in viewer with no library entry", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            summary: "A challenging metroidvania.",
            genres: [{ id: 12, name: "Adventure" }],
            platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
          })}
          viewerUserId="user-1"
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders an Add to library action and no status pill", () => {
      expect(elements.queryStatusSwitcher()).not.toBeNull();
      expect(elements.queryAddToLibrary()).not.toBeNull();
      expect(elements.queryStatusPill()).toBeNull();
    });

    it("does not render the overflow menu when there is no entry", () => {
      expect(elements.queryMoreMenuTrigger()).toBeNull();
    });

    it("replaces the personal panels with a single start-tracking invitation", () => {
      expect(elements.queryTrackInvite()).not.toBeNull();
      expect(elements.queryYourRecord()).toBeNull();
      expect(elements.queryJournalHeading()).toBeNull();
      expect(elements.queryTimesToBeatSlot()).toBeNull();
    });

    it("renders About and Themes as two separate cards (no merged catalog card)", () => {
      expect(elements.queryAboutCard()).not.toBeNull();
      expect(elements.queryThemesTagsCard()).not.toBeNull();
      expect(elements.queryLegacyCatalogCard()).toBeNull();
    });
  });

  describe("given a logged-out viewer with catalog data and slots", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            summary: "A challenging metroidvania.",
            genres: [{ id: 12, name: "Adventure" }],
            platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
          })}
          viewerUserId={null}
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders no personal panels", () => {
      expect(elements.queryYourRecord()).toBeNull();
      expect(elements.queryJournalHeading()).toBeNull();
      expect(elements.queryTimesToBeatSlot()).toBeNull();
      expect(elements.queryStatusSwitcher()).toBeNull();
    });

    it("renders About and Themes as two separate cards (no merged catalog card)", () => {
      expect(elements.queryAboutCard()).not.toBeNull();
      expect(elements.queryThemesTagsCard()).not.toBeNull();
      expect(elements.queryLegacyCatalogCard()).toBeNull();
    });

    it("offers a start-tracking invitation with a sign-in affordance", () => {
      expect(elements.queryTrackInvite()).not.toBeNull();
      expect(elements.querySignInLink()).not.toBeNull();
      expect(elements.queryAddToLibrary()).toBeNull();
    });
  });

  describe("given a signed-in viewer with an existing library entry (status: PLAYING)", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
        />
      );
    });

    it("shows a status pill reflecting the current status", () => {
      expect(elements.queryStatusPill()).toHaveAccessibleName(
        "Change library status: Playing"
      );
    });

    it("renders the overflow menu and Journal panel", () => {
      expect(elements.queryMoreMenuTrigger()).not.toBeNull();
      expect(elements.queryJournalHeading()).not.toBeNull();
    });
  });

  describe("given both phase-2 slots are passed (in-library viewer)", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
          relatedGamesSlot={<div data-testid="related-games-slot" />}
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders both slots inline with no tablist or tabpanel roles", () => {
      expect(elements.queryRelatedSlot()).not.toBeNull();
      expect(elements.queryTimesToBeatSlot()).not.toBeNull();
      expect(elements.queryAllTablists()).toHaveLength(0);
      expect(elements.queryAllTabpanels()).toHaveLength(0);
    });
  });

  describe("given a related slot but no 'you' layer (logged out)", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null)}
          viewerUserId={null}
          relatedGamesSlot={<div data-testid="related-games-slot" />}
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders the catalog related slot but suppresses the personal times-to-beat slot", () => {
      expect(elements.queryRelatedSlot()).not.toBeNull();
      expect(elements.queryTimesToBeatSlot()).toBeNull();
    });
  });

  describe("given a signed-in viewer with an entry and both phase-2 slots", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry(), {
            summary: "A challenging metroidvania.",
            genres: [{ id: 12, name: "Adventure" }],
            platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
          })}
          viewerUserId="user-1"
          relatedGamesSlot={<div data-testid="related-games-slot" />}
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders every panel simultaneously, inline, with no game-detail tabpanels", () => {
      expect(elements.querySummary()).not.toBeNull();
      expect(elements.queryGameDetailLabel()).not.toBeNull();
      expect(elements.queryGenresLabel()).not.toBeNull();
      expect(elements.queryPlatformsLabel()).not.toBeNull();
      expect(elements.queryJournalHeading()).not.toBeNull();
      expect(elements.queryRelatedSlot()).not.toBeNull();
      expect(elements.queryTimesToBeatSlot()).not.toBeNull();
      expect(elements.queryAllTabpanels()).toHaveLength(0);
    });

    it("renders About and Themes as two separate cards when catalog data is present", () => {
      expect(elements.queryAboutCard()).not.toBeNull();
      expect(elements.queryThemesTagsCard()).not.toBeNull();
      expect(elements.queryLegacyCatalogCard()).toBeNull();
    });
  });

  describe("given a fully-populated in-library viewer with screenshots and both slots", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry(), {
            summary: "A challenging metroidvania.",
            genres: [{ id: 12, name: "Adventure" }],
            platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
            screenshots: [
              { id: 1, image_id: "abc123" },
              { id: 2, image_id: "def456" },
            ],
          })}
          viewerUserId="user-1"
          relatedGamesSlot={<div data-testid="related-games-slot" />}
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders the screenshots strip above the bento grid", () => {
      expect(
        precedes(elements.queryScreenshotsRegion()!, elements.getBentoGrid())
      ).toBe(true);
    });

    it("orders the bento cells Record, Times, About, Themes, Journal, Related", () => {
      const record = elements.queryYourRecord()!;
      const times = elements.queryTimesToBeatSlot()!;
      const about = elements.queryAboutCard()!;
      const themes = elements.queryThemesTagsCard()!;
      const journal = elements.queryJournalHeading()!;
      const related = elements.queryRelatedSlot()!;

      expect(precedes(record, times)).toBe(true);
      expect(precedes(times, about)).toBe(true);
      expect(precedes(about, themes)).toBe(true);
      expect(precedes(themes, journal)).toBe(true);
      expect(precedes(journal, related)).toBe(true);
    });
  });

  describe("given igdbDetails with a populated summary", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            summary: "Custom summary copy for this game.",
          })}
          viewerUserId={null}
        />
      );
    });

    it("renders the summary text inside the Game-summary paragraph", () => {
      expect(elements.getSummaryText().textContent).toBe(
        "Custom summary copy for this game."
      );
    });
  });

  describe("given igdbDetails with no summary", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, { summary: undefined })}
          viewerUserId={null}
        />
      );
    });

    it("does NOT render the summary paragraph", () => {
      expect(elements.querySummary()).toBeNull();
    });
  });

  describe("given igdbDetails with two genres", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            genres: [
              { id: 12, name: "Role-playing (RPG)" },
              { id: 31, name: "Adventure" },
            ],
          })}
          viewerUserId={null}
        />
      );
    });

    it("renders each genre as a chip next to the GENRES label", () => {
      const list = elements.queryGenresList();
      expect(list).not.toBeNull();
      const items = within(list!).getAllByRole("listitem");
      expect(items.length).toBe(2);
      expect(items[0]?.textContent).toBe("Role-playing (RPG)");
      expect(items[1]?.textContent).toBe("Adventure");
    });
  });

  describe("given igdbDetails with three platforms", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            platforms: [
              { id: 6, name: "PC (Microsoft Windows)" },
              { id: 167, name: "PlayStation 5" },
              { id: 169, name: "Xbox Series X|S" },
            ],
          })}
          viewerUserId={null}
        />
      );
    });

    it("renders each platform as an abbreviated chip next to the PLATFORMS label", () => {
      const list = elements.queryPlatformsList();
      expect(list).not.toBeNull();
      expect(within(list!).getByText("PC")).toBeDefined();
      expect(within(list!).getByText("PS5")).toBeDefined();
      expect(within(list!).getByText("XSX")).toBeDefined();
    });

    it("does not show an overflow chip when four or fewer platforms exist", () => {
      const list = elements.queryPlatformsList();
      expect(within(list!).queryByText("+1")).toBeNull();
    });
  });

  describe("given igdbDetails with five platforms", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            platforms: [
              { id: 169, name: "Xbox Series X|S" },
              { id: 48, name: "PlayStation 4" },
              { id: 6, name: "PC (Microsoft Windows)" },
              { id: 167, name: "PlayStation 5" },
              { id: 130, name: "Nintendo Switch" },
            ],
          })}
          viewerUserId={null}
        />
      );
    });

    it("renders only the first four platforms as visible chips", () => {
      const list = elements.queryPlatformsList();
      expect(within(list!).getByText("XSX")).toBeDefined();
      expect(within(list!).getByText("PS4")).toBeDefined();
      expect(within(list!).getByText("PC")).toBeDefined();
      expect(within(list!).getByText("PS5")).toBeDefined();
    });

    it("collapses the remaining platforms into a single overflow chip", () => {
      const list = elements.queryPlatformsList();
      expect(within(list!).getByText("+1")).toBeDefined();
      expect(within(list!).queryByText("Switch")).toBeNull();
    });
  });

  describe("given igdbDetails with both a developer and publisher company", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            involved_companies: [
              {
                developer: true,
                publisher: false,
                company: { id: 1, name: "Team Cherry" },
              },
              {
                developer: false,
                publisher: true,
                company: { id: 2, name: "Skybound Games" },
              },
            ],
          })}
          viewerUserId={null}
        />
      );
    });

    it("shows the publisher name uppercased in the eyebrow row, not the developer", () => {
      const eyebrow = screen.getByLabelText("Release metadata");
      expect(eyebrow.textContent).toContain("SKYBOUND GAMES");
      expect(eyebrow.textContent).not.toContain("TEAM CHERRY");
    });
  });

  describe("given igdbDetails with an aggregated rating", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, { aggregated_rating: 91.4 })}
          viewerUserId={null}
        />
      );
    });

    it("renders the critic score ring with the rounded score", () => {
      const ring = elements.queryCriticScoreRing();
      expect(ring).not.toBeNull();
      expect(elements.queryRoundedScore("91")).not.toBeNull();
    });
  });

  describe("given igdbDetails with no aggregated rating", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, { aggregated_rating: undefined })}
          viewerUserId={null}
        />
      );
    });

    it("does not render the critic score ring", () => {
      expect(elements.queryCriticScoreRing()).toBeNull();
    });
  });

  describe("given igdbDetails with no genres and no platforms", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, { genres: [], platforms: [] })}
          viewerUserId={null}
        />
      );
    });

    it("omits the genres and platforms rows entirely", () => {
      expect(elements.queryGenresList()).toBeNull();
      expect(elements.queryPlatformsList()).toBeNull();
      expect(elements.queryGenresLabel()).toBeNull();
      expect(elements.queryPlatformsLabel()).toBeNull();
    });
  });

  describe("given igdbDetails with screenshots", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            screenshots: [
              { id: 1, image_id: "abc123" },
              { id: 2, image_id: "def456" },
            ],
          })}
          viewerUserId={null}
        />
      );
    });

    it("renders the first screenshot as a full-bleed hero backdrop", () => {
      const backdrop = screen.getByTestId("game-detail-hero-backdrop");
      expect(backdrop.innerHTML).toContain("abc123");
    });
  });

  describe("given igdbDetails with no screenshots", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, { screenshots: undefined })}
          viewerUserId={null}
        />
      );
    });

    it("does not render any screenshot URL in the hero backdrop", () => {
      const backdrop = screen.getByTestId("game-detail-hero-backdrop");
      expect(backdrop.innerHTML).not.toContain("images.igdb.com");
    });
  });

  describe("given a title-only game that is in the viewer's library", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(
            buildLibraryEntry(),
            {
              summary: undefined,
              genres: [],
              platforms: [],
              themes: [],
              screenshots: undefined,
              involved_companies: [],
              aggregated_rating: undefined,
            },
            { releaseDate: null }
          )}
          viewerUserId="user-1"
          timesToBeatSlot={<div data-testid="times-to-beat-slot" />}
        />
      );
    });

    it("renders the hero title, status pill, and the Your Record panel", () => {
      expect(elements.getTitle()).toBeDefined();
      expect(elements.queryStatusPill()).not.toBeNull();
      expect(elements.queryYourRecord()).not.toBeNull();
    });

    it("renders the personal slots (Your Pace / Times to beat and Journal)", () => {
      expect(elements.queryTimesToBeatSlot()).not.toBeNull();
      expect(elements.queryJournalHeading()).not.toBeNull();
    });

    it("omits every catalog surface (eyebrow, critic ring, About, Themes & Tags, Screenshots, Related)", () => {
      expect(elements.queryEyebrow()).toBeNull();
      expect(elements.queryCriticScoreRing()).toBeNull();
      expect(elements.queryAboutCard()).toBeNull();
      expect(elements.queryThemesTagsCard()).toBeNull();
      expect(elements.queryGameDetailLabel()).toBeNull();
      expect(elements.queryThemesLabel()).toBeNull();
      expect(elements.queryScreenshotsRegion()).toBeNull();
      expect(elements.queryRelatedSlot()).toBeNull();
    });

    it("never renders an em-dash placeholder", () => {
      expect(elements.queryEmDash()).toBeNull();
    });
  });

  describe("given a game with no catalog facts but rich personal data", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={{
            ...buildData(
              buildLibraryEntry(),
              {
                summary: undefined,
                genres: [],
                platforms: [],
                themes: [],
                involved_companies: [],
              },
              { releaseDate: null }
            ),
            playtimeTotalMinutes: 600,
            journalCount: 4,
          }}
          viewerUserId="user-1"
        />
      );
    });

    it("collapses both catalog cards rather than rendering an empty box", () => {
      expect(elements.queryAboutCard()).toBeNull();
      expect(elements.queryThemesTagsCard()).toBeNull();
      expect(elements.queryLegacyCatalogCard()).toBeNull();
    });

    it("does not emit an em-dash anywhere on the page", () => {
      expect(elements.queryEmDash()).toBeNull();
    });
  });

  describe("given a related-games slot that resolves to empty content", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
          relatedGamesSlot={null}
        />
      );
    });

    it("does not render an empty Related card", () => {
      expect(elements.queryRelatedSlot()).toBeNull();
    });
  });

  describe("given the user navigates between two games on the same route", () => {
    beforeEach(() => {
      const { rerender } = render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
        />
      );
      rerender(
        <GameDetail
          data={buildData(
            null,
            { id: 5678, name: "Celeste", slug: "celeste" },
            { id: "game-2", igdbId: 5678, title: "Celeste", slug: "celeste" }
          )}
          viewerUserId="user-1"
        />
      );
    });

    it("does not preserve the previous game's library status across navigation", () => {
      expect(elements.queryStatusPill()).toBeNull();
      expect(elements.queryAddToLibrary()).not.toBeNull();
    });
  });

  // ---------------------------------------------------------------------------
  // RED: unattachedJournalEntries wiring (spec 016 §2.7 / §2.10)
  // ---------------------------------------------------------------------------
  // GameDetail must pass data.unattachedJournalEntries as legacyEntries to
  // JournalFeed so that detached / legacy entries appear in the feed when the
  // game has runs. The test fails (RED) until GameDetailData carries the field
  // and game-detail.tsx wires it through.
  // ---------------------------------------------------------------------------

  describe("given a game with runs and unattached journal entries (spec 016 §2.7 / §2.10)", () => {
    const legacyEntry: JournalEntry = {
      id: "entry-legacy-gd-001",
      kind: "QUICK",
      title: null,
      content: "Old note before runs existed",
      playedMinutes: null,
      tags: [],
      mood: null,
      playSession: null,
      visibility: "PRIVATE",
      userId: "user-1",
      gameId: "game-1",
      libraryItemId: 42,
      playthroughId: null,
      createdAt: new Date("2023-05-01T10:00:00Z"),
      updatedAt: new Date("2023-05-01T10:00:00Z"),
      publishedAt: null,
    };

    const runEntry: JournalEntry = {
      id: "entry-run-gd-001",
      kind: "QUICK",
      title: null,
      content: "First run note",
      playedMinutes: 60,
      tags: [],
      mood: null,
      playSession: null,
      visibility: "PRIVATE",
      userId: "user-1",
      gameId: "game-1",
      libraryItemId: 42,
      playthroughId: "pt-gd-001",
      createdAt: new Date("2024-01-10T10:00:00Z"),
      updatedAt: new Date("2024-01-10T10:00:00Z"),
      publishedAt: null,
    };

    const firstRun: PlaythroughWithEntries = {
      id: "pt-gd-001",
      ordinal: 1,
      kind: "FIRST",
      status: "FINISHED",
      platform: null,
      startedAt: null,
      finishedAt: null,
      playtimeMinutes: 60,
      rating: null,
      completion: null,
      notes: null,
      journalEntries: [runEntry],
      libraryItemId: 42,
      libraryItem: undefined as never,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    beforeEach(() => {
      render(
        <GameDetail
          data={{
            ...buildData(buildLibraryEntry()),
            playthroughs: [firstRun],
            unattachedJournalEntries: [legacyEntry],
          }}
          viewerUserId="user-1"
        />
      );
    });

    it("renders the legacy entry content in the journal feed", () => {
      expect(screen.queryByText("Old note before runs existed")).not.toBeNull();
    });

    it("renders the legacy entry with no run label inside the journal feed", () => {
      // Scope to the JournalFeed section to avoid matching "First playthrough"
      // rendered elsewhere in the widget (e.g. PlaythroughTimeline).
      const feed = screen.getByRole("region", { name: "Journal feed" });
      // The run entry carries a "First playthrough" label; the legacy entry
      // (playthroughId: null) must NOT produce a second one.
      const labelsInFeed = within(feed).queryAllByText("First playthrough");
      expect(labelsInFeed).toHaveLength(1);
    });
  });

  // ---------------------------------------------------------------------------
  // Edit-playthrough routing — Finding 1 + Finding 2
  // ---------------------------------------------------------------------------

  describe("given a signed-in viewer with two existing runs", () => {
    const runA: PlaythroughWithEntries = {
      id: "pt-run-a",
      ordinal: 1,
      kind: "FIRST",
      status: "FINISHED",
      platform: "PC",
      startedAt: null,
      finishedAt: null,
      playtimeMinutes: 120,
      rating: null,
      completion: null,
      notes: "Run A notes",
      journalEntries: [],
      libraryItemId: 42,
      libraryItem: undefined as never,
      createdAt: new Date("2024-01-01"),
      updatedAt: new Date("2024-01-01"),
    };

    const runB: PlaythroughWithEntries = {
      id: "pt-run-b",
      ordinal: 2,
      kind: "REPLAY",
      status: "PLAYING",
      platform: "PlayStation 5",
      startedAt: null,
      finishedAt: null,
      playtimeMinutes: 60,
      rating: null,
      completion: null,
      notes: "Run B notes",
      journalEntries: [],
      libraryItemId: 42,
      libraryItem: undefined as never,
      createdAt: new Date("2024-06-01"),
      updatedAt: new Date("2024-06-01"),
    };

    beforeEach(() => {
      vi.mocked(createPlaythroughFn).mockReset();
      vi.mocked(createPlaythroughFn).mockResolvedValue(undefined as never);
      vi.mocked(updatePlaythroughFn).mockReset();
      vi.mocked(updatePlaythroughFn).mockResolvedValue(undefined as never);
    });

    describe("when the user clicks Edit on run A and submits the drawer", () => {
      beforeEach(async () => {
        render(
          <GameDetail
            data={{
              ...buildData(buildLibraryEntry()),
              playthroughs: [runA, runB],
            }}
            viewerUserId="user-1"
          />
        );
        const [editRunA] = screen.getAllByRole("button", { name: "Edit" });
        await userEvent.click(editRunA!);
        await userEvent.click(
          screen.getByRole("button", { name: "Save changes" })
        );
      });

      it("calls updatePlaythroughFn with run A's id — not createPlaythroughFn", async () => {
        await waitFor(() => {
          expect(vi.mocked(updatePlaythroughFn)).toHaveBeenCalledWith(
            expect.objectContaining({
              data: expect.objectContaining({ id: "pt-run-a" }),
            })
          );
        });
        expect(vi.mocked(createPlaythroughFn)).not.toHaveBeenCalled();
      });
    });

    describe("when the user opens the drawer for run A then closes and opens for run B", () => {
      beforeEach(async () => {
        render(
          <GameDetail
            data={{
              ...buildData(buildLibraryEntry()),
              playthroughs: [runA, runB],
            }}
            viewerUserId="user-1"
          />
        );
        const [editRunA] = screen.getAllByRole("button", { name: "Edit" });
        await userEvent.click(editRunA!);
        await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
        const editButtons = screen.getAllByRole("button", { name: "Edit" });
        await userEvent.click(editButtons[1]!);
      });

      it("shows run B's notes in the Notes field — not run A's stale values", async () => {
        const notesField = screen.getByLabelText(
          "Notes"
        ) as HTMLTextAreaElement;
        expect(notesField.value).toBe("Run B notes");
      });
    });
  });
});
