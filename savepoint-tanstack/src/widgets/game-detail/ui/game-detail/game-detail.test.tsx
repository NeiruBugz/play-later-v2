import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { setOwnershipFn } from "@/features/manage-library-entry/api/set-ownership-fn";
import { setStatusFn } from "@/features/manage-library-entry/api/set-status-fn";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import type { GameDetailsResponseItem } from "@/shared/api/igdb";

import type {
  Game,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client";
import { buildLibraryItem } from "../../../../../test/factories/builders.ts";
import { GameDetail } from "./game-detail";
import type { GameDetailData } from "./game-detail.type";

const mockNavigate = vi.fn();
const mockUseNavigate = vi.fn();

vi.mock("@/features/done-follow-up/api/save-done-follow-up-fn", () => ({
  saveDoneFollowUpFn: vi.fn(),
}));
vi.mock("@/features/done-follow-up/api/set-done-outcome-fn", () => ({
  setDoneOutcomeFn: vi.fn(),
}));
vi.mock("@/features/library-prompts/api/answer-prompt-fn", () => ({
  answerPromptFn: vi.fn(),
}));
vi.mock("@/features/library-prompts/api/dismiss-prompt-fn", () => ({
  dismissPromptFn: vi.fn(),
}));
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  useNavigate: (options?: unknown) => {
    mockUseNavigate(options);
    return mockNavigate;
  },
  Link: ({ to, children, ...rest }: any) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: vi.fn(() => true),
}));

vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/add-game-fn", () => ({
  addGameFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/undo-add-game-fn", () => ({
  undoAddGameFn: vi.fn(),
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

vi.mock("@/features/compose-journal-entry/api/log-time-fn", () => ({
  logTimeFn: vi.fn(),
}));

vi.mock("@/features/compose-journal-entry/api/get-loggable-games", () => ({
  getLoggableGamesFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/set-ownership-fn", () => ({
  setOwnershipFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/set-status-fn", () => ({
  setStatusFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/undo-status-fn", () => ({
  undoStatusFn: vi.fn(),
}));

vi.mock("@/features/up-next/api/add-to-up-next-fn", () => ({
  addToUpNextFn: vi.fn(),
}));

vi.mock("@/features/up-next/api/remove-from-up-next-fn", () => ({
  removeFromUpNextFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

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
  timeToCreditsSeconds: null,
  timeToCompleteSeconds: null,
  timesToBeatFetchedAt: null,
  coverHue: null,
  coverChroma: null,
  coverTintComputedAt: null,
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

const buildLibraryEntry = (): LibraryItem =>
  buildLibraryItem({ id: 42, status: "PLAYING", platform: "PC" });

const buildData = (
  libraryEntry: LibraryItem | null,
  igdbOverrides: Partial<GameDetailsResponseItem> = {},
  gameOverrides: Partial<Game> = {}
): GameDetailData => ({
  game: buildGame(gameOverrides),
  igdbDetails: buildIgdbDetails(igdbOverrides),
  libraryEntry,
  notes: [],
  playtimeTotalMinutes: 0,
  playtimeSessionCount: 0,
  timeToCreditsSeconds: null,
  timeToCompleteSeconds: null,
});

const elements = {
  getTitle: () =>
    screen.getByRole("heading", { name: "Hollow Knight", level: 1 }),
  queryBreadcrumbLibrary: () => screen.queryByRole("link", { name: "Library" }),
  queryBreadcrumbGames: () => screen.queryByRole("link", { name: "Games" }),
  // The hero (md:hidden), the desktop rail and the phone action bar each render
  // a status pill when a viewer is signed in, so these use queryAll.
  queryStatusPill: () =>
    screen.queryAllByRole("button", { name: /^Status: .*\. Change$/ })[0] ??
    null,
  queryStatusPillsNamed: (label: string) =>
    screen.queryAllByRole("button", { name: `Status: ${label}. Change` }),
  getHeaderStatusPill: (label: string) =>
    within(document.body).getAllByRole("button", {
      name: `Status: ${label}. Change`,
    })[0]!,
  getActionBarStatusPill: (label: string) =>
    within(screen.getByTestId("game-detail-action-bar")).getByRole("button", {
      name: `Status: ${label}. Change`,
    }),
  getStatusRadio: (label: string) => screen.getByRole("radio", { name: label }),
  getStatusRadios: () => screen.getAllByRole("radio"),
  getNextStepButton: (label: string) =>
    screen.getAllByRole("button", { name: label })[0]!,
  queryAddToLibrary: () =>
    screen.queryAllByRole("button", { name: "Add to library" })[0] ?? null,
  queryStatusSwitcher: () =>
    screen.queryAllByTestId("game-library-controls")[0] ?? null,
  queryMoreMenuTrigger: () =>
    screen.queryAllByRole("button", { name: "More library actions" })[0] ??
    null,
  queryAllTablists: () => screen.queryAllByRole("tablist"),
  queryAllTabpanels: () => screen.queryAllByRole("tabpanel"),
  queryOverviewTab: () => screen.queryByRole("tab", { name: "Overview" }),
  queryNotesHeading: () => screen.queryByRole("heading", { name: "Notes" }),
  queryRelatedSlot: () => screen.queryByTestId("related-games-slot"),
  queryTimesToBeatSlot: () => screen.queryByTestId("times-to-beat-slot"),
  querySummary: () => screen.queryByLabelText("Game summary"),
  queryGameDetailLabel: () => screen.queryByRole("heading", { name: "About" }),
  queryGenresLabel: () => screen.queryByRole("heading", { name: "Genres" }),
  queryPlatformsLabel: () =>
    screen.queryByRole("heading", { name: "Platforms" }),
  getSummaryText: () => screen.getByLabelText("Game summary"),
  queryGenresList: () => screen.queryByLabelText("Genres"),
  queryPlatformsList: () => screen.queryByLabelText("Platforms"),
  // The critic ring appears in both the hero (md:hidden) and the rail, so use queryAll
  queryCriticScoreRing: () =>
    screen.queryAllByLabelText("Critic score")[0] ?? null,
  // Two critic rings in DOM (hero md:hidden + rail), so use queryAll
  queryRoundedScore: (rounded: string) =>
    screen.queryAllByText(rounded)[0] ?? null,
  queryAboutCard: () => screen.queryByTestId("game-detail-about-card"),
  queryThemesTagsCard: () =>
    screen.queryByTestId("game-detail-themes-tags-card"),
  queryLegacyCatalogCard: () =>
    screen.queryByTestId("game-detail-catalog-card"),
  queryEyebrow: () => screen.queryByLabelText("Release metadata"),
  queryYourRecord: () => screen.queryByTestId("game-rating"),
  queryPlaythroughsPanel: () => screen.queryByTestId("playthroughs-panel"),
  queryPlaythroughTimeline: () => screen.queryByTestId("playthrough-timeline"),
  queryStartNewPlaythrough: () =>
    screen.queryByRole("button", { name: /new playthrough|add playthrough/i }),
  queryPlaythroughsJump: () =>
    screen.queryByRole("button", { name: "Playthroughs" }),
  queryHistoryToggle: () => screen.queryByRole("button", { name: "History" }),
  queryRatingSlider: () => screen.queryByRole("slider", { name: /Rate|Rated/ }),
  queryThemesLabel: () => screen.queryByRole("heading", { name: "Themes" }),
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

describe("GameDetail ownership", () => {
  const renderWith = (overrides: Partial<LibraryItem>) =>
    render(
      <GameDetail
        data={buildData(
          buildLibraryItem({ id: 42, platform: "PC", ...overrides })
        )}
        viewerUserId="user-1"
      />
    );

  it("tags a Want game the user does not own", () => {
    renderWith({ status: "WANT", isOwned: false });
    expect(screen.getAllByText("Not owned").length).toBeGreaterThan(0);
  });

  it("does not tag an owned Want game", () => {
    renderWith({ status: "WANT", isOwned: true });
    expect(screen.queryByText("Not owned")).toBeNull();
  });

  it("lets the user mark an owned game as not owned from More library actions", async () => {
    vi.mocked(setOwnershipFn).mockResolvedValue({ isOwned: false });
    renderWith({ status: "WANT", isOwned: true });

    await userEvent.click(elements.queryMoreMenuTrigger()!);
    await userEvent.click(
      await screen.findByRole("menuitem", { name: "I don't own it yet" })
    );

    expect(setOwnershipFn).toHaveBeenCalledWith({
      data: { id: 42, isOwned: false },
    });
    expect((await screen.findAllByText("Not owned")).length).toBeGreaterThan(0);
  });
});

describe("GameDetail Up Next", () => {
  const renderWith = (overrides: Partial<LibraryItem>) =>
    render(
      <GameDetail
        data={buildData(
          buildLibraryItem({ id: 42, platform: "PC", ...overrides })
        )}
        viewerUserId="user-1"
      />
    );

  const getPutIn = () =>
    screen.queryAllByRole("button", { name: "Put in Up Next" })[0] ?? null;
  const getRemoveFrom = () =>
    screen.queryAllByRole("button", { name: "Remove from Up Next" })[0] ?? null;

  it("offers Put in Up Next for a Want game", () => {
    renderWith({ status: "WANT" });
    expect(getPutIn()).not.toBeNull();
  });

  it("shows the Up Next marker and Remove for a queued Want game", () => {
    renderWith({ status: "WANT", upNextPosition: 2 });
    expect(screen.getAllByText("Up Next #2").length).toBeGreaterThan(0);
    expect(getRemoveFrom()).not.toBeNull();
  });

  it("shows Replay for a queued Done game", () => {
    renderWith({ status: "DONE", upNextPosition: 1 });
    expect(screen.getAllByText("Replay").length).toBeGreaterThan(0);
  });

  it("offers no Up Next action and no marker for a Playing game", () => {
    renderWith({ status: "PLAYING", upNextPosition: null });
    expect(getPutIn()).toBeNull();
    expect(getRemoveFrom()).toBeNull();
    expect(screen.queryByTestId("queue-marker")).toBeNull();
  });
});

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

    it("does not render the library controls or Notes list for anonymous viewers", () => {
      expect(elements.queryStatusSwitcher()).toBeNull();
      expect(elements.queryNotesHeading()).toBeNull();
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
      expect(elements.queryNotesHeading()).toBeNull();
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
      expect(elements.queryNotesHeading()).toBeNull();
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
        "Status: Playing. Change"
      );
    });

    it("renders the overflow menu and Notes list", () => {
      expect(elements.queryMoreMenuTrigger()).not.toBeNull();
      expect(elements.queryNotesHeading()).not.toBeNull();
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
      expect(elements.queryNotesHeading()).not.toBeNull();
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

    it("orders the bento cells Rating, Times, About, Themes, Notes, Related", () => {
      const record = elements.queryYourRecord()!;
      const times = elements.queryTimesToBeatSlot()!;
      const about = elements.queryAboutCard()!;
      const themes = elements.queryThemesTagsCard()!;
      const journal = elements.queryNotesHeading()!;
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

    it("renders the personal slots (Your Pace / Times to beat and Notes)", () => {
      expect(elements.queryTimesToBeatSlot()).not.toBeNull();
      expect(elements.queryNotesHeading()).not.toBeNull();
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

  describe("given a signed-in viewer with three notes on the game", () => {
    const note = (id: string, content: string, day: number) => ({
      id,
      content,
      playedMinutes: null,
      createdAt: new Date(`2024-01-0${day}T10:00:00Z`),
    });

    beforeEach(() => {
      render(
        <GameDetail
          data={{
            ...buildData(buildLibraryEntry()),
            notes: [
              note("note-1", "Oldest note", 1),
              note("note-3", "Newest note", 3),
              note("note-2", "Middle note", 2),
            ],
          }}
          viewerUserId="user-1"
        />
      );
    });

    it("shows each note once", () => {
      expect(screen.getAllByText("Oldest note")).toHaveLength(1);
      expect(screen.getAllByText("Middle note")).toHaveLength(1);
      expect(screen.getAllByText("Newest note")).toHaveLength(1);
    });

    it("lists the notes newest first", () => {
      const list = screen.getByRole("list", { name: "Notes" });
      const texts = within(list)
        .getAllByRole("link")
        .map((link) => link.textContent);
      expect(texts[0]).toContain("Newest note");
      expect(texts[1]).toContain("Middle note");
      expect(texts[2]).toContain("Oldest note");
    });

    it("links every note to its note view", () => {
      const list = screen.getByRole("list", { name: "Notes" });
      expect(within(list).getAllByRole("link")).toHaveLength(3);
    });
  });

  describe("given a signed-in viewer with a played game", () => {
    const history = [
      {
        id: "older",
        startedAt: new Date(2024, 0, 5),
        finishedAt: new Date(2024, 0, 19),
      },
      {
        id: "newer",
        startedAt: new Date(2024, 2, 3),
        finishedAt: new Date(2024, 2, 20),
      },
    ];

    beforeEach(() => {
      render(
        <GameDetail
          data={{ ...buildData(buildLibraryEntry()), history }}
          viewerUserId="user-1"
        />
      );
    });

    it("shows no playthroughs panel, timeline, jump entry, or new-playthrough button", () => {
      expect(elements.queryPlaythroughsPanel()).toBeNull();
      expect(elements.queryPlaythroughTimeline()).toBeNull();
      expect(elements.queryPlaythroughsJump()).toBeNull();
      expect(elements.queryStartNewPlaythrough()).toBeNull();
    });

    it("offers a collapsed History section", () => {
      expect(elements.queryHistoryToggle()).toHaveAttribute(
        "aria-expanded",
        "false"
      );
    });

    it("lists the plays newest first once History is expanded", async () => {
      await userEvent.click(elements.queryHistoryToggle()!);
      const entries = within(screen.getByTestId("play-history"))
        .getAllByRole("listitem")
        .map((li) => li.textContent);
      expect(entries).toEqual([
        "3 Mar 2024 \u2013 20 Mar 2024",
        "5 Jan 2024 \u2013 19 Jan 2024",
      ]);
    });
  });

  describe("given a signed-in viewer with no ended plays", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
        />
      );
    });

    it("shows no History section", () => {
      expect(elements.queryHistoryToggle()).toBeNull();
    });
  });

  describe("given a signed-in viewer who rated the game 7", () => {
    beforeEach(() => {
      vi.mocked(updateLibraryItemFn).mockReset();
      vi.mocked(updateLibraryItemFn).mockResolvedValue({} as never);
      render(
        <GameDetail
          data={buildData(buildLibraryItem({ id: 42, rating: 7 }))}
          viewerUserId="user-1"
        />
      );
    });

    it("shows a single rating of three and a half stars and no Best rating", () => {
      expect(
        screen.getAllByRole("slider", { name: "Rated 3.5 of 5" })
      ).toHaveLength(1);
      expect(screen.queryByText(/best rating/i)).toBeNull();
    });

    it("saves a changed rating through updateLibraryItemFn", async () => {
      await userEvent.click(screen.getByTestId("rating-star-5"));
      await waitFor(() =>
        expect(vi.mocked(updateLibraryItemFn)).toHaveBeenCalledWith({
          data: { itemId: 42, rating: 10 },
        })
      );
    });
  });

  describe("Log time (spec 2.15)", () => {
    const getLogTimeButtons = () =>
      screen.queryAllByRole("button", { name: "Log time" });

    it("opens the Log form with the game chosen when the viewer has the game in their library", async () => {
      mockNavigate.mockReset();
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
          gameSlug="hollow-knight"
        />
      );

      const [first] = getLogTimeButtons();
      await userEvent.click(first!);

      const updater = mockNavigate.mock.calls[0]![0].search as (
        prev: Record<string, unknown>
      ) => Record<string, unknown>;
      expect(updater({})).toMatchObject({
        action: "log-session",
        game: "hollow-knight",
      });
    });

    it("navigates relative to the current page so the game page stays open", async () => {
      mockNavigate.mockReset();
      mockUseNavigate.mockReset();
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
          gameSlug="hollow-knight"
        />
      );

      const rail = screen.getByTestId("game-detail-detail-rail");
      await userEvent.click(
        within(rail).getByRole("button", { name: "Log time" })
      );

      expect(mockNavigate.mock.calls[0]![0].to).toBe(".");
      for (const [options] of mockUseNavigate.mock.calls) {
        expect(options?.from).toBeUndefined();
      }
    });

    it("shows no Log time when the game is not in the viewer's library", () => {
      render(
        <GameDetail
          data={buildData(null)}
          viewerUserId="user-1"
          gameSlug="hollow-knight"
        />
      );
      expect(getLogTimeButtons()).toHaveLength(0);
    });

    it("shows no Log time to a signed-out visitor", () => {
      render(
        <GameDetail
          data={buildData(null)}
          viewerUserId={null}
          gameSlug="hollow-knight"
        />
      );
      expect(getLogTimeButtons()).toHaveLength(0);
    });
  });

  // ---------------------------------------------------------------------------
  // Slice 7 — desktop layout (AC GD-5)
  // Layout is CSS-driven: both the detail rail and the action bar are always in
  // the DOM; Tailwind hidden/md:block classes control visibility. No JS branching
  // on viewport means no useIsDesktop mock needed here.
  // ---------------------------------------------------------------------------

  describe("Slice 7 — desktop layout (AC GD-5)", () => {
    describe("given a library entry with a critic score and gameSlug", () => {
      beforeEach(() => {
        render(
          <GameDetail
            data={buildData(buildLibraryEntry(), {
              aggregated_rating: 88,
            })}
            viewerUserId="user-1"
            gameSlug="hollow-knight"
          />
        );
      });

      it("renders the sticky detail rail in the DOM", () => {
        expect(screen.queryByTestId("game-detail-detail-rail")).not.toBeNull();
      });

      it("renders the mobile action bar in the DOM (CSS hides it on desktop)", () => {
        expect(screen.queryByTestId("game-detail-action-bar")).not.toBeNull();
      });

      it("renders the library controls inside the detail rail", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        const switcher = within(rail).queryByTestId("game-library-controls");
        expect(switcher).not.toBeNull();
      });

      it("renders a Log time button inside the detail rail", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        const logBtn = within(rail).queryByRole("button", {
          name: "Log time",
        });
        expect(logBtn).not.toBeNull();
      });

      it("renders the critic score ring inside the detail rail", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        const ring = within(rail).queryByLabelText("Critic score");
        expect(ring).not.toBeNull();
      });

      it("shows the Time played label inside the detail rail", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        expect(within(rail).queryByText("Time played")).not.toBeNull();
      });

      it("renders the jump spine in the DOM (both mobile and desktop variants)", () => {
        // Two instances: md:hidden (mobile) + hidden md:block (desktop)
        expect(
          screen.queryAllByTestId("game-detail-jump-spine").length
        ).toBeGreaterThan(0);
      });
    });

    describe("given a library entry with gameSlug but no critic score", () => {
      beforeEach(() => {
        render(
          <GameDetail
            data={buildData(buildLibraryEntry(), {
              aggregated_rating: undefined,
            })}
            viewerUserId="user-1"
            gameSlug="hollow-knight"
          />
        );
      });

      it("does not render the critic ring inside the detail rail when no score exists", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        expect(within(rail).queryByLabelText("Critic score")).toBeNull();
      });
    });

    describe("given a library entry with playtime data", () => {
      beforeEach(() => {
        render(
          <GameDetail
            data={{
              ...buildData(buildLibraryEntry()),
              playtimeTotalMinutes: 360,
              playtimeSessionCount: 4,
            }}
            viewerUserId="user-1"
            gameSlug="hollow-knight"
          />
        );
      });

      it("shows time played and no old labels inside the rail", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        expect(within(rail).queryByText("Time played")).not.toBeNull();
        expect(within(rail).queryByText("Total played")).toBeNull();
        expect(within(rail).queryByText("Your time")).toBeNull();
      });

      it("shows the sessions count inside the rail", () => {
        const rail = screen.getByTestId("game-detail-detail-rail");
        expect(within(rail).queryByText("Sessions")).not.toBeNull();
      });
    });
  });

  // ---------------------------------------------------------------------------
  // Slice 6 — mobile layout (AC GD-1…GD-4)
  // Both the mobile top bar and the desktop breadcrumb are always in the DOM;
  // Tailwind md:hidden / hidden md:flex classes gate their visibility. No
  // useIsDesktop mock needed.
  // ---------------------------------------------------------------------------

  describe("Slice 6 — mobile layout (AC GD-1…GD-4)", () => {
    describe("given a library entry with gameSlug", () => {
      beforeEach(() => {
        render(
          <GameDetail
            data={buildData(buildLibraryEntry())}
            viewerUserId="user-1"
            gameSlug="hollow-knight"
          />
        );
      });

      // Both nav variants are always present in the DOM (CSS-gated)
      it("renders both the mobile top bar and the breadcrumb nav in the DOM", () => {
        expect(screen.queryByRole("link", { name: "Back" })).not.toBeNull();
        expect(elements.queryBreadcrumbLibrary()).not.toBeNull();
        expect(elements.queryBreadcrumbGames()).not.toBeNull();
      });

      // GD-4: mobile top bar must expose Back + More affordances
      it("shows a Back link in the mobile top bar", () => {
        expect(screen.queryByRole("link", { name: "Back" })).not.toBeNull();
      });

      it("shows a More button in the mobile top bar", () => {
        expect(screen.queryByRole("button", { name: "More" })).not.toBeNull();
      });

      // GD-3: cover renders above title in the DOM (stacked hero, no grid collision)
      it("renders the game cover image above the title heading in the DOM", () => {
        const cover = screen.queryByRole("img", {
          name: "Hollow Knight",
        });
        const title = elements.getTitle();
        expect(cover).not.toBeNull();
        expect(
          Boolean(
            title.compareDocumentPosition(cover!) &
            Node.DOCUMENT_POSITION_PRECEDING
          )
        ).toBe(true);
      });
    });
  });

  describe("given a signed-in viewer with a played game (earlier plays)", () => {
    const renderGame = (status: "WANT" | "PLAYING") =>
      render(
        <GameDetail
          data={buildData(buildLibraryItem({ id: 42, status }))}
          viewerUserId="user-1"
          gameSlug="hollow-knight"
        />
      );

    beforeEach(() => {
      vi.mocked(setStatusFn).mockReset();
      vi.mocked(toast.error).mockReset();
    });

    describe("when the header pill is tapped", () => {
      beforeEach(async () => {
        renderGame("PLAYING");
        await userEvent.click(elements.getHeaderStatusPill("Playing"));
      });

      it("opens a picker with Want, Playing and Done", () => {
        expect(
          elements.getStatusRadios().map((radio) => radio.textContent)
        ).toEqual(["Want", "Playing", "Done"]);
      });

      describe("and Done is picked", () => {
        beforeEach(async () => {
          vi.mocked(setStatusFn).mockResolvedValue({
            status: "DONE",
            upNextPosition: null,
            undo: {} as never,
          });
          await userEvent.click(elements.getStatusRadio("Done"));
        });

        it("shows Done in the header pill", async () => {
          await waitFor(() => {
            expect(elements.getHeaderStatusPill("Done")).toBeDefined();
          });
        });

        it("shows Done in the phone action bar pill", async () => {
          await waitFor(() => {
            expect(elements.getActionBarStatusPill("Done")).toBeDefined();
          });
        });
      });
    });

    describe("when Start playing is tapped on a Want game", () => {
      beforeEach(async () => {
        vi.mocked(setStatusFn).mockResolvedValue({
          status: "PLAYING",
          upNextPosition: null,
          undo: {} as never,
        });
        renderGame("WANT");
        await userEvent.click(elements.getNextStepButton("Start playing"));
      });

      it("shows Playing in the header and the phone action bar", async () => {
        await waitFor(() => {
          expect(elements.getHeaderStatusPill("Playing")).toBeDefined();
          expect(elements.getActionBarStatusPill("Playing")).toBeDefined();
        });
      });
    });

    describe("when saving the status fails", () => {
      beforeEach(async () => {
        vi.mocked(setStatusFn).mockRejectedValue(new Error("boom"));
        renderGame("PLAYING");
        await userEvent.click(elements.getHeaderStatusPill("Playing"));
        await userEvent.click(elements.getStatusRadio("Done"));
      });

      it("keeps the previous status in the header and the phone bar", async () => {
        await waitFor(() => {
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
            "Couldn't save. Try again."
          );
        });
        expect(elements.getHeaderStatusPill("Playing")).toBeDefined();
        expect(elements.getActionBarStatusPill("Playing")).toBeDefined();
      });
    });
  });
});
