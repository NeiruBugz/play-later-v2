import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type {
  Game,
  LibraryItem,
} from "../../../../../shared/lib/prisma/client";

import { GameDetail } from "./game-detail";
import type { GameDetailData } from "./game-detail.type";

// CTAs use @tanstack/react-router (useRouter().invalidate) — mock at module
// level so the widget renders without a router context.
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
}));

// Server fns invoked by the CTAs. Mocked so a render pass never crosses the
// server boundary; click behavior in the dedicated CTA tests is covered by
// their own files.
vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

// AddGameModal (transitively re-exported from @/features/add-game) loads
// searchGamesFn at module init, which pulls in IGDB → shared/lib logger.
// Mock the module so the widget render never crosses the IGDB graph.
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
}));

const buildGame = (): Game => ({
  id: "game-1",
  igdbId: 1234,
  hltbId: null,
  title: "Hollow Knight",
  description: "A challenging metroidvania.",
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

const buildData = (libraryEntry: LibraryItem | null): GameDetailData => ({
  game: buildGame(),
  relatedGames: [],
  libraryEntry,
  journalTeaser: [],
});

const elements = {
  queryAddCta: () =>
    screen.queryByRole("button", { name: "Add Hollow Knight to library" }),
  queryManageCta: () =>
    screen.queryByRole("button", { name: "Manage Hollow Knight in library" }),
  getTitle: () =>
    screen.getByRole("heading", { name: "Hollow Knight", level: 1 }),
};

describe("GameDetail", () => {
  describe("given an anonymous viewer", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId={null} />);
    });

    it("renders the game title", () => {
      expect(elements.getTitle()).toBeDefined();
    });

    it("does not render the Add to library CTA", () => {
      expect(elements.queryAddCta()).toBeNull();
    });

    it("does not render the Manage in library CTA", () => {
      expect(elements.queryManageCta()).toBeNull();
    });
  });

  describe("given a signed-in viewer with no library entry", () => {
    beforeEach(() => {
      render(<GameDetail data={buildData(null)} viewerUserId="user-1" />);
    });

    it("renders the Add to library CTA", () => {
      expect(elements.queryAddCta()).not.toBeNull();
    });

    it("does not render the Manage in library CTA", () => {
      expect(elements.queryManageCta()).toBeNull();
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

    it("renders the Manage in library CTA", () => {
      expect(elements.queryManageCta()).not.toBeNull();
    });

    it("does not render the Add to library CTA", () => {
      expect(elements.queryAddCta()).toBeNull();
    });
  });
});
