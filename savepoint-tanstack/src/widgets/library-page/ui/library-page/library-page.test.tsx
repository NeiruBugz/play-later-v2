import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { LibraryPage } from "./library-page";

// LibraryFilters uses useNavigate from @tanstack/react-router; mock module
// so we don't need a router context for a pure widget render test.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// AddGameTrigger renders an <AddGameModal/> inside a Dialog, which calls these
// server fns when the user submits a search / clicks Add. We mock them at the
// module level so the widget render test never crosses the server boundary.
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));

// LibraryModal calls these server fns on Save / Confirm-Delete. We mock at the
// module level so opening the modal in this widget test never crosses the
// server boundary. Click-to-open behavior does not invoke them.
vi.mock("@/features/manage-library-entry/api/update-library-item-fn", () => ({
  updateLibraryItemFn: vi.fn(),
}));

vi.mock("@/features/manage-library-entry/api/delete-library-item-fn", () => ({
  deleteLibraryItemFn: vi.fn(),
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
  queryAddGameTrigger: () => screen.queryByRole("button", { name: "Add game" }),
  getCardButton: (title: string) => screen.getByRole("button", { name: title }),
  queryDialog: () => screen.queryByRole("dialog"),
  getDialog: () => screen.getByRole("dialog"),
  getDialogCloseButton: () => screen.getByRole("button", { name: "Close" }),
  queryDialogTitle: (title: string) =>
    screen.queryByRole("heading", { name: title, level: 2 }),
};

const actions = {
  clickCard: async (title: string) =>
    userEvent.click(elements.getCardButton(title)),
  closeDialog: async () => userEvent.click(elements.getDialogCloseButton()),
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

    it("mounts the AddGameTrigger in the page header", () => {
      expect(elements.queryAddGameTrigger()).not.toBeNull();
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

    it("mounts the AddGameTrigger in the page header", () => {
      expect(elements.queryAddGameTrigger()).not.toBeNull();
    });

    it("exposes each card as an accessible button named after the game", () => {
      expect(elements.getCardButton("Hollow Knight")).toBeDefined();
      expect(elements.getCardButton("Celeste")).toBeDefined();
    });

    it("does not render the dialog before any card is clicked", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("given the user clicks a library card", () => {
    beforeEach(async () => {
      const items = [
        buildItem({ id: 1, gameTitle: "Hollow Knight" }),
        buildItem({ id: 2, gameTitle: "Celeste" }),
      ];
      render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
      await actions.clickCard("Hollow Knight");
    });

    it("opens the library modal", () => {
      expect(elements.queryDialog()).not.toBeNull();
    });

    it("preselects the clicked entry by surfacing its title in the dialog", () => {
      // <DialogTitle> renders as h2 inside the Radix dialog content.
      expect(elements.queryDialogTitle("Hollow Knight")).not.toBeNull();
    });

    it("does not preselect any other entry", () => {
      expect(elements.queryDialogTitle("Celeste")).toBeNull();
    });
  });

  describe("given the user clicks card A, closes the modal, then clicks card B", () => {
    beforeEach(async () => {
      const items = [
        buildItem({ id: 1, gameTitle: "Hollow Knight" }),
        buildItem({ id: 2, gameTitle: "Celeste" }),
      ];
      render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
      await actions.clickCard("Hollow Knight");
      await actions.closeDialog();
      await actions.clickCard("Celeste");
    });

    it("re-opens the dialog for the second entry", () => {
      expect(elements.queryDialog()).not.toBeNull();
      expect(elements.queryDialogTitle("Celeste")).not.toBeNull();
    });

    it("no longer surfaces the first entry's title in the dialog", () => {
      expect(elements.queryDialogTitle("Hollow Knight")).toBeNull();
    });
  });

  describe("given the user opens the modal then closes it", () => {
    beforeEach(async () => {
      const items = [buildItem({ id: 1, gameTitle: "Hollow Knight" })];
      render(<LibraryPage items={items} total={1} {...defaultViewProps} />);
      await actions.clickCard("Hollow Knight");
      await actions.closeDialog();
    });

    it("removes the dialog from the DOM", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });
});
