import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameDetailsResponseItem } from "@/shared/api/igdb";

import type {
  Game,
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
  rating: null,
});

const buildData = (
  libraryEntry: LibraryItem | null,
  igdbOverrides: Partial<GameDetailsResponseItem> = {},
  gameOverrides: Partial<Game> = {}
): GameDetailData => ({
  game: buildGame(gameOverrides),
  igdbDetails: buildIgdbDetails(igdbOverrides),
  relatedGames: [],
  libraryEntry,
  journalTeaser: [],
});

const elements = {
  getTitle: () =>
    screen.getByRole("heading", { name: "Hollow Knight", level: 1 }),
  queryBreadcrumbLibrary: () => screen.queryByRole("link", { name: "Library" }),
  queryBreadcrumbGames: () => screen.queryByRole("link", { name: "Games" }),
  queryStatusPill: (label: string) =>
    screen.queryByRole("tab", { name: label }),
  queryStatusSwitcher: () => screen.queryByTestId("library-status-switcher"),
  queryRatingSlider: () => screen.queryByRole("slider"),
  queryMoreMenuTrigger: () =>
    screen.queryByRole("button", { name: "More library actions" }),
  getOverviewTab: () => screen.getByRole("tab", { name: "Overview" }),
  queryJournalTab: () => screen.queryByRole("tab", { name: /^Journal/ }),
  queryTimesToBeatTab: () =>
    screen.queryByRole("tab", { name: "Times to beat" }),
  queryRelatedTab: () => screen.queryByRole("tab", { name: "Related" }),
  querySummary: () => screen.queryByLabelText("Game summary"),
  queryGameDetailLabel: () => screen.queryByText("// GAME.DETAIL"),
  queryGenresLabel: () => screen.queryByText("// GENRES"),
  queryPlatformsLabel: () => screen.queryByText("// PLATFORMS"),
  getSummaryText: () => screen.getByLabelText("Game summary"),
  queryGenresList: () => screen.queryByLabelText("Genres"),
  queryPlatformsList: () => screen.queryByLabelText("Platforms"),
};

describe("GameDetail", () => {
  describe("given an anonymous viewer with no slots", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId={null} />);
    });

    it("renders the game title, breadcrumbs, Overview tab, and metadata labels", () => {
      expect(elements.getTitle()).toBeDefined();
      expect(elements.queryBreadcrumbLibrary()).not.toBeNull();
      expect(elements.queryBreadcrumbGames()).not.toBeNull();
      expect(elements.getOverviewTab()).toBeDefined();
      expect(elements.queryGameDetailLabel()).not.toBeNull();
      expect(elements.queryGenresLabel()).not.toBeNull();
      expect(elements.queryPlatformsLabel()).not.toBeNull();
    });

    it("does not render the status switcher or Journal tab for anonymous viewers", () => {
      expect(elements.queryStatusSwitcher()).toBeNull();
      expect(elements.queryJournalTab()).toBeNull();
    });
  });

  describe("given a signed-in viewer with no library entry", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId="user-1" />);
    });

    it("renders the status switcher with all 5 pills unchecked", () => {
      expect(elements.queryStatusSwitcher()).not.toBeNull();
      for (const label of [
        "Up Next",
        "Playing",
        "Shelf",
        "Played",
        "Wishlist",
      ]) {
        expect(elements.queryStatusPill(label)).toHaveAttribute(
          "aria-selected",
          "false"
        );
      }
    });

    it("does not render the rating slider or overflow menu when there is no entry", () => {
      expect(elements.queryRatingSlider()).toBeNull();
      expect(elements.queryMoreMenuTrigger()).toBeNull();
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

    it("marks only the Playing pill as active", () => {
      expect(elements.queryStatusPill("Playing")).toHaveAttribute(
        "aria-selected",
        "true"
      );
      expect(elements.queryStatusPill("Shelf")).toHaveAttribute(
        "aria-selected",
        "false"
      );
    });

    it("renders the rating slider, overflow menu, and Journal tab", () => {
      expect(elements.queryRatingSlider()).not.toBeNull();
      expect(elements.queryMoreMenuTrigger()).not.toBeNull();
      expect(elements.queryJournalTab()).not.toBeNull();
    });
  });

  describe("given both phase-2 slots are passed", () => {
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

    it("renders the Related tab and the Times to beat tab", () => {
      expect(elements.queryRelatedTab()).not.toBeNull();
      expect(elements.queryTimesToBeatTab()).not.toBeNull();
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

  describe("given igdbDetails with an involved developer company", () => {
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

    it("shows the developer name uppercased in the eyebrow row, not the publisher", () => {
      const eyebrow = screen.getByLabelText("Release metadata");
      expect(eyebrow.textContent).toContain("TEAM CHERRY");
      expect(eyebrow.textContent).not.toContain("SKYBOUND");
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

    it("renders the em-dash placeholder for both genres and platforms", () => {
      expect(elements.queryGenresList()?.textContent).toBe("—");
      expect(elements.queryPlatformsList()?.textContent).toBe("—");
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
      expect(elements.queryStatusPill("Playing")).toHaveAttribute(
        "aria-selected",
        "false"
      );
      expect(elements.queryRatingSlider()).toBeNull();
    });
  });
});
