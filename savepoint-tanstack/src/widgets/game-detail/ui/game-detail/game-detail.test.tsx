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
  useRouter: () => ({ invalidate: vi.fn(), history: { back: vi.fn() } }),
  useCanGoBack: () => false,
  useNavigate: () => mockNavigate,
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

vi.mock("@/entities/session/model", () => ({
  useEveningMinutes: () => 105,
}));
vi.mock("sonner", () => ({
  toast: Object.assign(vi.fn(), { error: vi.fn(), success: vi.fn() }),
}));

const buildGame = (overrides: Partial<Game> = {}): Game => ({
  id: "game-1",
  igdbId: 1234,
  title: "Hollow Knight",
  description: null,
  coverImage: null,
  releaseDate: new Date("2017-02-24T00:00:00Z"),
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
  coverTint: null,
});

const elements = {
  getTitle: () =>
    screen.getByRole("heading", { name: "Hollow Knight", level: 1 }),
  queryStatusPill: () =>
    screen.queryAllByRole("button", { name: /^Status: .*\. Change$/ })[0] ??
    null,
  getHeaderStatusPill: (label: string) =>
    within(document.body).getAllByRole("button", {
      name: `Status: ${label}. Change`,
    })[0]!,
  getStatusRadio: (label: string) => screen.getByRole("radio", { name: label }),
  getStatusRadios: () => screen.getAllByRole("radio"),
  getNextStepButton: (label: string) =>
    screen.getAllByRole("button", { name: label })[0]!,
  getAddToLibraryButtons: () =>
    screen.queryAllByRole("button", { name: "Add to library" }),
  queryAddToLibrary: () => elements.getAddToLibraryButtons()[0] ?? null,
  queryStatusSwitcher: () =>
    screen.queryAllByTestId("game-library-controls")[0] ?? null,
  queryMoreMenuTrigger: () =>
    screen.queryAllByRole("button", { name: "More library actions" })[0] ??
    null,
  queryAllTablists: () => screen.queryAllByRole("tablist"),
  queryAllTabpanels: () => screen.queryAllByRole("tabpanel"),
  queryRelatedSlot: () => screen.queryByTestId("related-games-slot"),
  queryYourPlay: () => screen.queryByTestId("your-play-card"),
  queryAbout: () => screen.queryByTestId("game-detail-about-card"),
  queryScreenshots: () =>
    screen.queryByLabelText("Screenshots of Hollow Knight"),
  queryLayoutGrid: () => screen.queryByTestId("game-detail-body-grid"),
  querySummary: () => screen.queryByLabelText("Game summary"),
  queryNotesHeading: () => screen.queryByRole("heading", { name: "Notes" }),
  queryCriticScore: () => screen.queryAllByLabelText("Critic score")[0] ?? null,
  queryTimePlayedCard: () => screen.queryByText("Time played"),
  queryRightColumn: () => screen.queryByTestId("game-detail-detail-rail"),
  queryJumpSpine: () => screen.queryByTestId("game-detail-jump-spine"),
  queryBentoGrid: () => screen.queryByTestId("game-detail-bento-grid"),
  queryThemesHeading: () => screen.queryByRole("heading", { name: "Themes" }),
  queryPlatformsHeading: () =>
    screen.queryByRole("heading", { name: "Platforms" }),
  queryEmDash: () => screen.queryByText("—"),
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
  describe("given an anonymous viewer with a description", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId={null} />);
    });

    it("renders the game title as the page heading and the About card", () => {
      expect(elements.getTitle()).toBeDefined();
      expect(elements.queryAbout()).not.toBeNull();
      expect(elements.querySummary()).toHaveTextContent(
        "A challenging metroidvania."
      );
    });

    it("renders the panels inline with no tablist, tab, or tabpanel roles", () => {
      expect(elements.queryAllTablists()).toHaveLength(0);
      expect(elements.queryAllTabpanels()).toHaveLength(0);
    });

    it("shows no Your play card, library controls or Notes list", () => {
      expect(elements.queryYourPlay()).toBeNull();
      expect(elements.queryStatusSwitcher()).toBeNull();
      expect(elements.queryNotesHeading()).toBeNull();
    });

    it("lets About span the full width", () => {
      expect(elements.queryAbout()).toHaveClass("md:col-span-2");
    });
  });

  describe("given a signed-in viewer with no library entry", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId="user-1" />);
    });

    it("renders exactly one Add to library action and no status pill", () => {
      expect(elements.getAddToLibraryButtons()).toHaveLength(1);
      expect(elements.queryStatusPill()).toBeNull();
    });

    it("does not render the overflow menu when there is no entry", () => {
      expect(elements.queryMoreMenuTrigger()).toBeNull();
    });

    it("shows no Your play card, and About spans the full width", () => {
      expect(elements.queryYourPlay()).toBeNull();
      expect(elements.queryAbout()).toHaveClass("md:col-span-2");
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

    it("renders the overflow menu", () => {
      expect(elements.queryMoreMenuTrigger()).not.toBeNull();
    });

    it("renders Your play beside About, each taking half the width", () => {
      expect(elements.queryYourPlay()).not.toBeNull();
      expect(elements.queryLayoutGrid()).toHaveClass("md:grid-cols-2");
      expect(elements.queryAbout()).not.toHaveClass("md:col-span-2");
    });
  });

  describe("given a fully-populated in-library viewer", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={{
            ...buildData(buildLibraryEntry(), {
              summary: "A challenging metroidvania.",
              genres: [{ id: 12, name: "Adventure" }],
              themes: [{ id: 17, name: "Fantasy" }],
              platforms: [{ id: 6, name: "PC (Microsoft Windows)" }],
              aggregated_rating: 91.4,
              screenshots: [
                { id: 1, image_id: "abc123" },
                { id: 2, image_id: "def456" },
              ],
            }),
            playtimeTotalMinutes: 270,
            playtimeSessionCount: 3,
            timeToCreditsSeconds: 52200,
            timeToCompleteSeconds: 68400,
          }}
          viewerUserId="user-1"
          relatedGamesSlot={<div data-testid="related-games-slot" />}
        />
      );
    });

    it("orders header, Your play, About, screenshots, related", () => {
      const title = elements.getTitle();
      const yourPlay = elements.queryYourPlay()!;
      const about = elements.queryAbout()!;
      const screenshots = elements.queryScreenshots()!;
      const related = elements.queryRelatedSlot()!;

      expect(precedes(title, yourPlay)).toBe(true);
      expect(precedes(yourPlay, about)).toBe(true);
      expect(precedes(about, screenshots)).toBe(true);
      expect(precedes(screenshots, related)).toBe(true);
    });

    it("reads the viewer's own time in Your play", () => {
      expect(
        within(elements.queryYourPlay()!).getByText("3 sessions · 4.5 h")
      ).toBeInTheDocument();
    });

    it("lists the typical times in About", () => {
      expect(
        within(elements.queryAbout()!).getByText("Main story")
      ).toBeInTheDocument();
      expect(
        within(elements.queryAbout()!).getByText("100%")
      ).toBeInTheDocument();
    });

    it("shows themes and genres as one tag group in About", () => {
      const tags = within(elements.queryAbout()!).getByRole("list", {
        name: "Themes and genres",
      });
      expect(
        within(tags)
          .getAllByRole("listitem")
          .map((tag) => tag.textContent)
      ).toEqual(["Fantasy", "Adventure"]);
    });

    it("has no tabs, critic ring, Time played card, jump spine or right column", () => {
      expect(elements.queryAllTablists()).toHaveLength(0);
      expect(elements.queryAllTabpanels()).toHaveLength(0);
      expect(elements.queryCriticScore()).toBeNull();
      expect(elements.queryTimePlayedCard()).toBeNull();
      expect(elements.queryRightColumn()).toBeNull();
      expect(elements.queryJumpSpine()).toBeNull();
      expect(elements.queryBentoGrid()).toBeNull();
    });

    it("has no separate Themes or Platforms card", () => {
      expect(elements.queryThemesHeading()).toBeNull();
      expect(elements.queryPlatformsHeading()).toBeNull();
    });
  });

  describe("given a logged-out viewer with a related slot", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null)}
          viewerUserId={null}
          relatedGamesSlot={<div data-testid="related-games-slot" />}
        />
      );
    });

    it("renders the catalog related slot", () => {
      expect(elements.queryRelatedSlot()).not.toBeNull();
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
        />
      );
    });

    it("renders the title, status pill and Your play", () => {
      expect(elements.getTitle()).toBeDefined();
      expect(elements.queryStatusPill()).not.toBeNull();
      expect(elements.queryYourPlay()).not.toBeNull();
    });

    it("omits About, screenshots and related rather than rendering empty boxes", () => {
      expect(elements.queryAbout()).toBeNull();
      expect(elements.queryScreenshots()).toBeNull();
      expect(elements.queryRelatedSlot()).toBeNull();
    });

    it("never renders an em-dash placeholder", () => {
      expect(elements.queryEmDash()).toBeNull();
    });
  });

  describe("given a game with no played time", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
        />
      );
    });

    it("reads No sessions yet and shows no zero hours anywhere", () => {
      expect(screen.getByText("No sessions yet")).toBeInTheDocument();
      expect(document.body).not.toHaveTextContent("0 h");
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

    it("does not render an empty related row", () => {
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

      // GD-4: mobile top bar must expose Back + More affordances
      it("shows a Back link in the mobile top bar", () => {
        expect(screen.queryByRole("link", { name: "Back" })).not.toBeNull();
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

      it("shows Playing in the header", async () => {
        await waitFor(() => {
          expect(elements.getHeaderStatusPill("Playing")).toBeDefined();
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

      it("keeps the previous status in the header", async () => {
        await waitFor(() => {
          expect(vi.mocked(toast.error)).toHaveBeenCalledWith(
            "Couldn't save. Try again."
          );
        });
        expect(elements.getHeaderStatusPill("Playing")).toBeDefined();
      });
    });
  });
});
