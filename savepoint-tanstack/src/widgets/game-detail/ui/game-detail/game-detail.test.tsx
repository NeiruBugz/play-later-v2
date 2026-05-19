import { render, screen } from "@testing-library/react";
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

vi.mock("@/features/compose-journal-entry/api/create-journal-entry-fn", () => ({
  createJournalEntryFn: vi.fn(),
}));

const buildGame = (): Game => ({
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
  igdbOverrides: Partial<GameDetailsResponseItem> = {}
): GameDetailData => ({
  game: buildGame(),
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
    screen.queryByRole("radio", { name: label }),
  queryStatusSwitcher: () => screen.queryByTestId("library-status-switcher"),
  queryRatingSlider: () => screen.queryByRole("slider"),
  queryMoreMenuTrigger: () =>
    screen.queryByRole("button", { name: "More library actions" }),
  getOverviewTab: () => screen.getByRole("tab", { name: "Overview" }),
  queryJournalTab: () => screen.queryByRole("tab", { name: /^Journal/ }),
  queryPlaytimeTab: () => screen.queryByRole("tab", { name: "Playtime" }),
  querySummary: () => screen.queryByLabelText("Game summary"),
  queryGameDetailLabel: () => screen.queryByText("// GAME.DETAIL"),
  queryGenresLabel: () => screen.queryByText("// GENRES"),
  queryPlatformsLabel: () => screen.queryByText("// PLATFORMS"),
  queryRelatedSlot: () => screen.queryByTestId("related-games-slot"),
  queryTimesToBeatSlot: () => screen.queryByTestId("times-to-beat-slot"),
  getSummaryText: () => screen.getByLabelText("Game summary"),
  queryGenresList: () => screen.queryByLabelText("Genres"),
  queryPlatformsList: () => screen.queryByLabelText("Platforms"),
};

describe("GameDetail", () => {
  describe("given an anonymous viewer with no slots", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId={null} />);
    });

    it("renders the game title", () => {
      expect(elements.getTitle()).toBeDefined();
    });

    it("renders the Library breadcrumb segment", () => {
      expect(elements.queryBreadcrumbLibrary()).not.toBeNull();
    });

    it("renders the Games mid-segment in the breadcrumb", () => {
      expect(elements.queryBreadcrumbGames()).not.toBeNull();
    });

    it("does not render the inline status switcher", () => {
      expect(elements.queryStatusSwitcher()).toBeNull();
    });

    it("does not render the Journal tab for anonymous viewers", () => {
      expect(elements.queryJournalTab()).toBeNull();
    });

    it("renders the Overview tab", () => {
      expect(elements.getOverviewTab()).toBeDefined();
    });

    it("renders the IGDB summary paragraph", () => {
      expect(elements.querySummary()).not.toBeNull();
    });

    it("renders the terminal-style GAME.DETAIL label", () => {
      expect(elements.queryGameDetailLabel()).not.toBeNull();
    });

    it("renders the terminal-style GENRES label", () => {
      expect(elements.queryGenresLabel()).not.toBeNull();
    });

    it("renders the terminal-style PLATFORMS label", () => {
      expect(elements.queryPlatformsLabel()).not.toBeNull();
    });
  });

  describe("given a signed-in viewer with no library entry", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId="user-1" />);
    });

    it("renders the inline status switcher", () => {
      expect(elements.queryStatusSwitcher()).not.toBeNull();
    });

    it("renders all 5 status pills", () => {
      for (const label of [
        "Up Next",
        "Playing",
        "Shelf",
        "Played",
        "Wishlist",
      ]) {
        expect(elements.queryStatusPill(label)).not.toBeNull();
      }
    });

    it("does not render the rating slider when there is no entry", () => {
      expect(elements.queryRatingSlider()).toBeNull();
    });

    it("does not render the overflow menu trigger when there is no entry", () => {
      expect(elements.queryMoreMenuTrigger()).toBeNull();
    });

    it("marks no status pill as active", () => {
      for (const label of [
        "Up Next",
        "Playing",
        "Shelf",
        "Played",
        "Wishlist",
      ]) {
        expect(elements.queryStatusPill(label)).toHaveAttribute(
          "aria-checked",
          "false"
        );
      }
    });
  });

  describe("given a signed-in viewer with an existing library entry", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(buildLibraryEntry())}
          viewerUserId="user-1"
        />
      );
    });

    it("marks the Playing pill as active", () => {
      expect(elements.queryStatusPill("Playing")).toHaveAttribute(
        "aria-checked",
        "true"
      );
    });

    it("does NOT mark the Shelf pill as active", () => {
      expect(elements.queryStatusPill("Shelf")).toHaveAttribute(
        "aria-checked",
        "false"
      );
    });

    it("renders the rating slider", () => {
      expect(elements.queryRatingSlider()).not.toBeNull();
    });

    it("renders the overflow menu trigger", () => {
      expect(elements.queryMoreMenuTrigger()).not.toBeNull();
    });

    it("renders the Journal tab", () => {
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

    it("renders the related-games slot inside the Overview tab", () => {
      // Overview is the default-active tab so its content is in the DOM.
      expect(elements.queryRelatedSlot()).not.toBeNull();
    });

    it("renders the Playtime tab when times-to-beat slot is supplied", () => {
      expect(elements.queryPlaytimeTab()).not.toBeNull();
    });
  });

  describe("given igdbDetails with a populated summary", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, { summary: "Custom summary copy for this game." })}
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

    it("renders the genres joined by ' · ' next to the GENRES label", () => {
      expect(elements.queryGenresList()?.textContent).toBe(
        "Role-playing (RPG) · Adventure"
      );
    });
  });

  describe("given igdbDetails with three platforms", () => {
    beforeEach(() => {
      render(
        <GameDetail
          data={buildData(null, {
            platforms: [
              { id: 6, name: "PC" },
              { id: 167, name: "PlayStation 5" },
              { id: 169, name: "Xbox Series X" },
            ],
          })}
          viewerUserId={null}
        />
      );
    });

    it("renders the platforms joined by ' · ' next to the PLATFORMS label", () => {
      expect(elements.queryPlatformsList()?.textContent).toBe(
        "PC · PlayStation 5 · Xbox Series X"
      );
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

    it("includes the developer name in the eyebrow row", () => {
      // Eyebrow has aria-label="Release metadata"; developer is uppercased.
      const eyebrow = screen.getByLabelText("Release metadata");
      expect(eyebrow.textContent).toContain("TEAM CHERRY");
    });

    it("does NOT include the publisher name in the eyebrow row", () => {
      const eyebrow = screen.getByLabelText("Release metadata");
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

    it("renders the em-dash placeholder for genres", () => {
      expect(elements.queryGenresList()?.textContent).toBe("—");
    });

    it("renders the em-dash placeholder for platforms", () => {
      expect(elements.queryPlatformsList()?.textContent).toBe("—");
    });
  });
});
