import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { LibraryItemWithGame } from "@/entities/library-item/model";

import { buildLibraryItemWithGame } from "../../../../../test/factories/builders.ts";
import { LibraryPage } from "./library-page";

// LibraryFilters uses useNavigate from @tanstack/react-router; LibraryItemCard
// (via GameCard) uses <Link>. Mock the module so we don't need a router
// context for a pure widget render test.
vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn(),
  useRouter: () => ({ invalidate: vi.fn() }),
  Link: ({
    to,
    href,
    params,
    children,
    ...rest
  }: {
    to?: string;
    href?: string;
    params?: Record<string, string>;
    children: ReactNode;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? href ?? "";
    if (params && to) {
      for (const [key, value] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, value);
      }
    }
    return (
      <a href={resolvedHref} {...rest}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/features/up-next/api/add-to-up-next-fn", () => ({
  addToUpNextFn: vi.fn(),
}));
vi.mock("@/features/up-next/api/remove-from-up-next-fn", () => ({
  removeFromUpNextFn: vi.fn(),
}));
vi.mock("@/features/up-next/api/move-in-up-next-fn", () => ({
  moveInUpNextFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));

vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
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

// Spec 025 Slice 3b: new server fns added to compose-journal-entry api barrel
// must be mocked to prevent server-env access during component tests.
vi.mock(
  "@/features/compose-journal-entry/api/get-log-session-game-data",
  () => ({
    getLogSessionGameDataFn: vi.fn(),
  })
);

vi.mock("@/features/compose-journal-entry/api/get-loggable-games", () => ({
  getLoggableGamesFn: vi.fn(),
}));

// Spec 016 §2.13 — mock the manage-playthrough feature so the drawer renders
// as a dialog in the DOM without needing the full feature runtime.
vi.mock("@/features/manage-playthrough", () => ({
  AddEditPlaythroughDrawer: ({
    open,
    libraryItemId,
  }: {
    open: boolean;
    libraryItemId: number;
    onOpenChange: (open: boolean) => void;
  }) =>
    open ? (
      <div role="dialog" aria-label="Add playthrough drawer">
        Add playthrough for {libraryItemId}
      </div>
    ) : null,
}));

const buildItem = (overrides: {
  id: number;
  gameTitle: string;
}): LibraryItemWithGame =>
  buildLibraryItemWithGame(
    { id: overrides.id, status: "PLAYING", platform: "PC" },
    {
      id: `game-${overrides.id}`,
      title: overrides.gameTitle,
      slug: overrides.gameTitle.toLowerCase().replace(/\s+/g, "-"),
    }
  );

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
  getPlayingFilterButton: () =>
    screen.getByRole("button", { name: "Filter by Playing" }),
  getAllFilterButton: () =>
    screen.getByRole("button", { name: "Show all statuses" }),
  getDoneFilterButton: () =>
    screen.getByRole("button", { name: "Filter by Done" }),
  queryGameTitleHeading: (title: string) =>
    screen.queryByRole("heading", { name: title, level: 3 }),
  getLibraryList: () => screen.getByRole("list", { name: "Library items" }),
  queryLibraryList: () => screen.queryByRole("list", { name: "Library items" }),
  queryAddGameTrigger: () => screen.queryByRole("button", { name: "Add game" }),
  getAddGameTrigger: () => screen.getByRole("button", { name: "Add game" }),
  getCardLink: (title: string) =>
    screen.getByRole("link", { name: `View ${title}` }),
  queryCardLink: (title: string) =>
    screen.queryByRole("link", { name: `View ${title}` }),
  queryMenuTrigger: (title: string) =>
    screen.queryByRole("button", { name: `Actions for ${title}` }),
  queryDialog: () => screen.queryByRole("dialog"),
  queryAddPlaythroughButton: () =>
    screen.queryByRole("button", { name: "Add playthrough" }),
  queryAddPlaythroughDrawer: () =>
    screen.queryByRole("dialog", { name: "Add playthrough drawer" }),
  queryFilterInput: () =>
    screen.queryByRole("searchbox", { name: "Filter library by title" }),
  getFilterInput: () =>
    screen.getByRole("searchbox", { name: "Filter library by title" }),
  queryCountChip: () => screen.queryByText("3 games"),
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

    it("offers the first-run dual CTAs (browse + import)", () => {
      expect(
        screen.getByRole("link", { name: "Browse games" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: "Import from Steam" })
      ).toBeInTheDocument();
    });

    it("does not offer Clear filters when no filters are active", () => {
      expect(
        screen.queryByRole("button", { name: "Clear filters" })
      ).toBeNull();
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

  describe("given filters are active but exclude every game", () => {
    beforeEach(() => {
      render(
        <LibraryPage
          items={[]}
          total={0}
          {...defaultViewProps}
          status="PLAYING"
        />
      );
    });

    it("shows the no-results template, not the first-run empty state", () => {
      expect(
        screen.getByRole("heading", {
          name: "Nothing matches these filters",
          level: 2,
        })
      ).toBeInTheDocument();
      expect(elements.queryEmptyHeading()).toBeNull();
    });

    it("offers a Clear filters action", () => {
      expect(
        screen.getByRole("button", { name: "Clear filters" })
      ).toBeInTheDocument();
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

    it("exposes each card as a navigation link to /games/$slug", () => {
      expect(elements.getCardLink("Hollow Knight")).toHaveAttribute(
        "href",
        "/games/hollow-knight"
      );
      expect(elements.getCardLink("Celeste")).toHaveAttribute(
        "href",
        "/games/celeste"
      );
    });

    it("renders the action-menu trigger for each card", () => {
      expect(elements.queryMenuTrigger("Hollow Knight")).not.toBeNull();
      expect(elements.queryMenuTrigger("Celeste")).not.toBeNull();
    });

    it("does not render the dialog at rest (modal-open is delegated to the action menu)", () => {
      expect(elements.queryDialog()).toBeNull();
    });
  });

  describe("Phase 3 visual-parity push", () => {
    describe("given a library with two PLAYING items and one WANT item", () => {
      beforeEach(() => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
          { ...buildItem({ id: 3, gameTitle: "Tunic" }), status: "WANT" },
        ] as LibraryItemWithGame[];
        render(<LibraryPage items={items} total={3} {...defaultViewProps} />);
      });

      it("renders the filter-by-title input above the grid", () => {
        expect(elements.queryFilterInput()).not.toBeNull();
      });

      it("does not render the `3 games` count chip in the header", () => {
        expect(elements.queryCountChip()).toBeNull();
      });

      it("mounts the AddGameTrigger as a FAB (still queryable by aria-label)", () => {
        const trigger = elements.getAddGameTrigger();
        expect(trigger.className).toMatch(/rounded-full/);
        expect(trigger.className).toMatch(/fixed/);
      });

      it("passes per-status counts through to LibraryFilters (rail renders count next to Playing)", () => {
        const playing = elements.getPlayingFilterButton();
        expect(playing.textContent).toContain("2");
      });

      it("renders the totalCount next to the All button", () => {
        const all = elements.getAllFilterButton();
        expect(all.textContent).toContain("3");
      });
    });

    describe("given full-library statusCounts while the grid is filtered to PLAYING", () => {
      beforeEach(() => {
        // The grid shows only the 2 PLAYING items, but the loader-supplied
        // statusCounts describe the WHOLE library (47 Done exist elsewhere).
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(
          <LibraryPage
            items={items}
            total={2}
            status="PLAYING"
            statusCounts={{
              WANT: 12,
              PLAYING: 2,
              DONE: 47,
            }}
            platform={undefined}
            minRating={undefined}
            sortBy="updatedAt"
            sortOrder="desc"
          />
        );
      });

      it("shows the full-library Done count (47), not 0, even though no Done item is on the page", () => {
        expect(elements.getDoneFilterButton().textContent).toContain("47");
      });

      it("still shows the PLAYING count from the full-library counts", () => {
        expect(elements.getPlayingFilterButton().textContent).toContain("2");
      });
    });

    describe("given the user types a substring into the filter input", () => {
      beforeEach(async () => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
        await userEvent.type(elements.getFilterInput(), "hollow");
      });

      it("only renders the matching card", () => {
        expect(elements.queryGameTitleHeading("Hollow Knight")).not.toBeNull();
        expect(elements.queryGameTitleHeading("Celeste")).toBeNull();
      });
    });
  });

  // Spec 025 Slice 4 — LIB-1…LIB-6: 2-up grid, status lens, view toggle.
  describe("Spec 025 Slice 4 — Library redesign (LIB-1…LIB-6)", () => {
    describe("given the library has items", () => {
      beforeEach(() => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
          buildItem({ id: 3, gameTitle: "Hades" }),
        ];
        render(
          <LibraryPage
            items={items}
            total={3}
            {...defaultViewProps}
            statusCounts={{
              WANT: 0,
              PLAYING: 3,
              DONE: 0,
            }}
          />
        );
      });

      // LIB-1: 2-up grid at phone width — grid has `grid-cols-2`
      it("renders the library list with grid-cols-2 class (LIB-1)", () => {
        const list = elements.getLibraryList();
        expect(list.className).toMatch(/grid-cols-2/);
      });

      // LIB-5: view toggle is present
      it("renders the grid/list view toggle buttons (LIB-5)", () => {
        expect(screen.getByRole("button", { name: "List view" })).toBeDefined();
        expect(screen.getByRole("button", { name: "Grid view" })).toBeDefined();
      });

      // LIB-2/LIB-3: status lens renders with All + status tabs
      it("renders the sticky status lens with All tab (LIB-2/LIB-3)", () => {
        expect(
          screen.getByRole("tablist", { name: "Filter by status" })
        ).toBeDefined();
        expect(screen.getByRole("tab", { name: /All/ })).toBeDefined();
      });

      it("renders the status lens with a Playing tab showing count (LIB-2)", () => {
        const playingTab = screen.getByRole("tab", { name: /Playing/ });
        expect(playingTab.textContent).toContain("3");
      });
    });

    describe("given the user taps List view toggle", () => {
      beforeEach(async () => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
        await userEvent.click(
          screen.getByRole("button", { name: "List view" })
        );
      });

      // LIB-5: switching to list view changes the presentation
      it("switches to list view — the grid list no longer has grid-cols-2 (LIB-5)", () => {
        const list = elements.getLibraryList();
        expect(list.className).not.toMatch(/grid-cols-2/);
      });
    });

    describe("given the user taps Grid view after switching to list", () => {
      beforeEach(async () => {
        const items = [buildItem({ id: 1, gameTitle: "Hollow Knight" })];
        render(<LibraryPage items={items} total={1} {...defaultViewProps} />);
        await userEvent.click(
          screen.getByRole("button", { name: "List view" })
        );
        await userEvent.click(
          screen.getByRole("button", { name: "Grid view" })
        );
      });

      it("returns to grid view with grid-cols-2 (LIB-5)", () => {
        const list = elements.getLibraryList();
        expect(list.className).toMatch(/grid-cols-2/);
      });
    });

    // LIB-4: secondary Filters trigger still exists
    describe("given filters are active (platform set)", () => {
      beforeEach(() => {
        const items = [buildItem({ id: 1, gameTitle: "Hollow Knight" })];
        render(
          <LibraryPage
            items={items}
            total={1}
            {...defaultViewProps}
            platform="PC"
          />
        );
      });

      it("shows the Filters trigger button (LIB-4)", () => {
        expect(
          screen.getByRole("button", { name: "Open filters" })
        ).toBeDefined();
      });
    });

    describe("given the library has items (single-row controls)", () => {
      beforeEach(() => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
      });

      it("renders the Filters, Grid view, and List view controls together", () => {
        expect(
          screen.getByRole("button", { name: "Open filters" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Grid view" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "List view" })
        ).toBeInTheDocument();
      });
    });

    describe("given filters are active (status + platform = 2 active filters)", () => {
      beforeEach(() => {
        const items = [buildItem({ id: 1, gameTitle: "Hollow Knight" })];
        render(
          <LibraryPage
            items={items}
            total={1}
            {...defaultViewProps}
            status="PLAYING"
            platform="PC"
          />
        );
      });

      it("shows a count badge of 2 on the Filters button", () => {
        const filtersBtn = screen.getByRole("button", { name: "Open filters" });
        expect(filtersBtn.textContent).toContain("2");
      });
    });

    describe("given no filters are active", () => {
      beforeEach(() => {
        const items = [buildItem({ id: 1, gameTitle: "Hollow Knight" })];
        render(<LibraryPage items={items} total={1} {...defaultViewProps} />);
      });

      it("does not show any numeric count badge on the Filters button when no filters active", () => {
        const filtersBtn = screen.getByRole("button", { name: "Open filters" });
        // Text should only be "Filters" with no numeric suffix (no count badge)
        expect(filtersBtn.textContent?.replace(/\s+/g, " ").trim()).toMatch(
          /^Filters$/
        );
      });
    });
  });

  // Spec 016 §2.13 — Library-card "Add playthrough" quick-add entry point.
  // The page lifts a single drawer state; each card's "Add playthrough" control
  // opens ONE AddEditPlaythroughDrawer (mode="add") over the library.
  describe("Add playthrough quick-add — spec 016 §2.13", () => {
    describe("given a library with items and the user has not clicked Add playthrough", () => {
      beforeEach(() => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
      });

      it("does not show the Add playthrough drawer at rest", () => {
        expect(elements.queryAddPlaythroughDrawer()).toBeNull();
      });
    });

    describe("given a library with items and the user clicks Add playthrough on a card", () => {
      beforeEach(async () => {
        const items = [
          buildItem({ id: 1, gameTitle: "Hollow Knight" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
        // Spec 025: inline quick-actions (incl. "Add playthrough") live in the
        // list view; the default grid shows clean cover tiles. Switch to list
        // first, then exercise the quick-add.
        await userEvent.click(
          screen.getByRole("button", { name: "List view" })
        );
        // Click the first "Add playthrough" button (Hollow Knight, id=1).
        // Two cards each have an "Add playthrough" button — getAllByRole gives
        // us both; index 0 is Hollow Knight (rendered first).
        const [firstBtn] = screen.getAllByRole("button", {
          name: "Add playthrough",
        });
        await userEvent.click(firstBtn);
      });

      it("opens the AddEditPlaythroughDrawer", () => {
        expect(elements.queryAddPlaythroughDrawer()).not.toBeNull();
      });

      it("passes the correct library item id to the drawer", () => {
        const drawer = elements.queryAddPlaythroughDrawer();
        expect(drawer?.textContent).toContain("1");
      });
    });
  });

  describe("given a desktop viewport", () => {
    beforeEach(() => {
      vi.stubGlobal("matchMedia", (query: string) => ({
        matches: query === "(min-width: 768px)",
        media: query,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));
      const items = [
        buildItem({ id: 1, gameTitle: "Hollow Knight" }),
        { ...buildItem({ id: 2, gameTitle: "Tunic" }), status: "WANT" },
      ] as LibraryItemWithGame[];
      render(<LibraryPage items={items} total={2} {...defaultViewProps} />);
    });

    afterEach(() => {
      vi.unstubAllGlobals();
    });

    it("shows the grid / list switch", () => {
      expect(screen.getByRole("button", { name: "Grid view" })).toBeVisible();
      expect(screen.getByRole("button", { name: "List view" })).toBeVisible();
    });

    it("shows a next-step button on every grid tile", () => {
      expect(
        screen.getByRole("button", { name: "Mark done" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Start playing" })
      ).toBeInTheDocument();
    });

    it("keeps next-step buttons on every row after switching to list view", async () => {
      await userEvent.click(screen.getByRole("button", { name: "List view" }));
      expect(
        screen.getByRole("button", { name: "Mark done" })
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Start playing" })
      ).toBeInTheDocument();
    });
  });

  describe("given the Up Next filter is selected", () => {
    describe("and games are queued", () => {
      beforeEach(() => {
        const queued = [
          buildItem({ id: 1, gameTitle: "Hades" }),
          buildItem({ id: 2, gameTitle: "Celeste" }),
        ];
        render(
          <LibraryPage
            items={queued}
            total={2}
            {...defaultViewProps}
            status="UP_NEXT"
          />
        );
      });

      it("lists the queued games as a numbered queue with move buttons", () => {
        expect(
          screen.getByRole("list", { name: "Up Next queue" })
        ).toBeInTheDocument();
        expect(
          screen.getByRole("button", { name: "Move Hades down" })
        ).toBeInTheDocument();
      });

      it("does not show the library grid", () => {
        expect(elements.queryLibraryList()).toBeNull();
      });
    });

    describe("and nothing is queued", () => {
      beforeEach(() => {
        render(
          <LibraryPage
            items={[]}
            total={0}
            {...defaultViewProps}
            status="UP_NEXT"
          />
        );
      });

      it("tells the user to queue up to 5 games", () => {
        expect(
          screen.getByText("Nothing queued yet — put up to 5 games in Up Next.")
        ).toBeInTheDocument();
      });
    });
  });

  describe("given Want games with and without ownership", () => {
    const buildWant = (id: number, title: string, isOwned: boolean) =>
      buildLibraryItemWithGame(
        { id, status: "WANT", isOwned },
        { id: `game-${id}`, title, slug: `game-${id}` }
      );

    it("tags only the Want game the user does not own", () => {
      render(
        <LibraryPage
          items={[buildWant(1, "Hades", true), buildWant(2, "Celeste", false)]}
          total={2}
          {...defaultViewProps}
          status="WANT"
        />
      );
      expect(screen.getAllByText("Not owned")).toHaveLength(1);
    });

    it("tags it in the list view too", async () => {
      render(
        <LibraryPage
          items={[buildWant(2, "Celeste", false)]}
          total={1}
          {...defaultViewProps}
        />
      );
      await userEvent.click(screen.getByRole("button", { name: /list/i }));
      expect(screen.getAllByText("Not owned")).toHaveLength(1);
    });

    it("offers the Not owned only toggle with the Want filter, and no Acquisition filter", () => {
      render(
        <LibraryPage
          items={[buildWant(2, "Celeste", false)]}
          total={1}
          {...defaultViewProps}
          status="WANT"
        />
      );
      expect(
        screen.getByRole("switch", { name: "Not owned only" })
      ).toBeDefined();
      expect(screen.queryByText("Acquisition")).toBeNull();
    });
  });

  describe("given grid tiles with different statuses", () => {
    beforeEach(() => {
      render(
        <LibraryPage
          items={[
            buildLibraryItemWithGame(
              { id: 21, status: "WANT", upNextPosition: null },
              { id: "g-21", title: "Wanted Game", slug: "wanted-game" }
            ),
            buildLibraryItemWithGame(
              { id: 22, status: "WANT", upNextPosition: 2 },
              { id: "g-22", title: "Queued Game", slug: "queued-game" }
            ),
            buildLibraryItemWithGame(
              { id: 23, status: "PLAYING", upNextPosition: null },
              { id: "g-23", title: "Playing Game", slug: "playing-game" }
            ),
          ]}
          total={3}
          {...defaultViewProps}
        />
      );
    });

    it("offers Put in Up Next in a Want game's menu", async () => {
      await userEvent.click(elements.queryMenuTrigger("Wanted Game")!);

      expect(
        screen.getByRole("menuitem", { name: "Put in Up Next" })
      ).toBeInTheDocument();
    });

    it("shows the Up Next number on a queued game", () => {
      expect(screen.getByText("Up Next #2")).toBeInTheDocument();
    });

    it("offers no Up Next action in a Playing game's menu", async () => {
      await userEvent.click(elements.queryMenuTrigger("Playing Game")!);

      expect(screen.queryByRole("menuitem", { name: /Up Next/ })).toBeNull();
    });
  });

  describe.each([
    { filter: "WANT" as const, viewLabel: "Grid view" },
    { filter: "WANT" as const, viewLabel: "List view" },
    { filter: "DONE" as const, viewLabel: "Grid view" },
    { filter: "DONE" as const, viewLabel: "List view" },
  ])(
    "given the $filter filter in $viewLabel with a queued game",
    ({ filter, viewLabel }) => {
      beforeEach(async () => {
        render(
          <LibraryPage
            items={[
              buildLibraryItemWithGame(
                { id: 31, status: filter, upNextPosition: 2 },
                { id: "g-31", title: "Queued Game", slug: "queued-game" }
              ),
              buildLibraryItemWithGame(
                { id: 32, status: filter, upNextPosition: null },
                { id: "g-32", title: "Plain Game", slug: "plain-game" }
              ),
            ]}
            total={2}
            {...defaultViewProps}
            status={filter}
          />
        );
        await userEvent.click(screen.getByRole("button", { name: viewLabel }));
      });

      it("shows the queue marker on the queued game only", () => {
        const expected = filter === "WANT" ? "Up Next #2" : "Replay";

        expect(screen.getAllByTestId("queue-marker")).toHaveLength(1);
        expect(screen.getByText(expected)).toBeInTheDocument();
      });
    }
  );
});
