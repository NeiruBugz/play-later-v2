import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { LibraryPage } from "./library-page";

// LibraryFilters uses useNavigate from @tanstack/react-router; mock module
// so we don't need a router context for a pure widget render test.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

const buildItem = (overrides: {
  id: number;
  gameTitle: string;
}): LibraryItemWithGame => ({
  id: overrides.id,
  userId: "user-1",
  gameId: `game-${overrides.id}`,
  status: "PLAYING",
  platform: "PC",
  rating: null,
  createdAt: new Date("2025-01-01T00:00:00Z"),
  updatedAt: new Date("2025-01-02T00:00:00Z"),
  statusChangedAt: null,
  acquisitionType: "DIGITAL",
  startedAt: null,
  completedAt: null,
  hasBeenPlayed: false,
  game: {
    id: `game-${overrides.id}`,
    igdbId: 1,
    title: overrides.gameTitle,
    slug: overrides.gameTitle.toLowerCase().replace(/\s+/g, "-"),
    coverImage: null,
    releaseDate: null,
  },
});

const defaultViewProps = {
  status: undefined,
  platform: undefined,
  minRating: undefined,
  sortBy: "updatedAt" as const,
  sortOrder: "desc" as const,
};

const elements = {
  getEmptyHeading: () =>
    screen.getByRole("heading", { name: "No games yet", level: 2 }),
  queryEmptyHeading: () =>
    screen.queryByRole("heading", { name: "No games yet", level: 2 }),
  getPageHeading: () =>
    screen.getByRole("heading", { name: "Library", level: 1 }),
  queryPlayingFilterButton: () =>
    screen.queryByRole("button", { name: "Filter by Playing" }),
  queryGameTitleHeading: (title: string) =>
    screen.queryByRole("heading", { name: title, level: 3 }),
  getLibraryList: () => screen.getByRole("list", { name: "Library items" }),
  queryLibraryList: () => screen.queryByRole("list", { name: "Library items" }),
};

describe("LibraryPage", () => {
  describe("given the library is empty", () => {
    beforeEach(() => {
      render(<LibraryPage items={[]} total={0} {...defaultViewProps} />);
    });

    it("renders the page heading", () => {
      expect(elements.getPageHeading()).toBeDefined();
    });

    it("renders the empty-state heading", () => {
      expect(elements.queryEmptyHeading()).not.toBeNull();
    });

    it("does not render the library list when empty", () => {
      expect(elements.queryLibraryList()).toBeNull();
    });

    it("mounts the LibraryFilters status controls", () => {
      expect(elements.queryPlayingFilterButton()).not.toBeNull();
    });
  });

  describe("given the library has items", () => {
    beforeEach(() => {
      const items = [
        buildItem({ id: 1, gameTitle: "Hollow Knight" }),
        buildItem({ id: 2, gameTitle: "Celeste" }),
      ];
      render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
    });

    it("renders the library list", () => {
      expect(elements.getLibraryList()).toBeDefined();
    });

    it("renders the first item's game title", () => {
      expect(elements.queryGameTitleHeading("Hollow Knight")).not.toBeNull();
    });

    it("renders the second item's game title", () => {
      expect(elements.queryGameTitleHeading("Celeste")).not.toBeNull();
    });

    it("does not render the empty-state heading when items are present", () => {
      expect(elements.queryEmptyHeading()).toBeNull();
    });

    it("still mounts LibraryFilters", () => {
      expect(elements.queryPlayingFilterButton()).not.toBeNull();
    });
  });
});
