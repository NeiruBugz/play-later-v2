/**
 * RED component tests for CommandPalette (Slice 17).
 *
 * This file is intentionally failing: the component module
 * `@/features/command-palette/ui/command-palette` does not exist until the
 * GREEN step. The import below produces a module-not-found / vite
 * import-analysis error — that IS the expected RED signal. Do not implement
 * the component here.
 *
 * =============================================================================
 * CONTRACT
 *
 * Component:
 *   src/features/command-palette/ui/command-palette/command-palette.tsx
 *   Named export: CommandPalette
 *
 * The component is self-contained: it mounts a global keyboard listener
 * (⌘K / Ctrl+K) that toggles its own open/closed state (mirroring the
 * canonical's `useCommandPalette` hook). When open it renders a search input;
 * when closed the input is absent from the DOM.
 *
 * When the user types a query the component debounces (300 ms, matching the
 * canonical `useDebouncedValue(query, 300)`) before calling `searchGamesFn`
 * from `@/features/search-games`. Results are rendered as clickable rows;
 * clicking a row navigates to `/games/$slug` via TanStack Router.
 *
 * Debounce window (canonical discovery):
 *   savepoint-app/features/command-palette/ui/desktop-command-palette.tsx:
 *     const debouncedQuery = useDebouncedValue(query, 300);
 *   → 300 ms.
 *
 * NOT tested here:
 *   - Desktop vs. mobile branching (viewport-agnostic test)
 *   - Quick-add and undo-toast flow (separate feature surface)
 *   - Navigation-group and quick-actions-group (palette sub-components)
 *   - Exact IGDB cover image URL format
 *   - Server fn correctness (covered by search-games integration tests)
 *
 * =============================================================================
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

// RED import — vite import-analysis fails here until the GREEN step creates
// this module. That failure IS the required RED signal.
import { CommandPalette } from "@/features/command-palette/ui/command-palette";

// ---------------------------------------------------------------------------
// Mock: @tanstack/react-router
// Mirrors the precedent established in related-games-infinite-list.test.tsx
// and compose-journal-entry-dialog.test.tsx. Link renders as a plain <a>;
// useNavigate returns a vi.fn() so navigation assertions are possible.
// ---------------------------------------------------------------------------

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
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
    children: React.ReactNode;
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

// ---------------------------------------------------------------------------
// Mock: @/features/search-games (foot-gun #8: never cross the real
// createServerFn boundary in vitest). The mock exposes searchGamesFn as a
// vi.fn() returning the SearchGamesResult shape.
//
// SearchGamesResult shape (from src/shared/api/igdb/search.ts):
//   { games: SearchResponseItem[]; count: number }
//
// SearchResponseItem shape includes at minimum: id, name, slug, cover.
// For the debounce and navigation tests, a minimal { id, name, slug } is
// sufficient; the component must render with or without cover data.
// ---------------------------------------------------------------------------

const mockSearchGamesFn = vi.fn();

vi.mock("@/features/search-games", () => ({
  searchGamesFn: (...args: unknown[]) => mockSearchGamesFn(...args),
}));

// ---------------------------------------------------------------------------
// Element vocabulary — domain-named, RTL-implementation-agnostic
// ---------------------------------------------------------------------------

const elements = {
  querySearchInput: () =>
    screen.queryByRole("combobox", { name: /search/i }) ??
    screen.queryByPlaceholderText(/search/i),
  getSearchInput: () =>
    screen.getByRole("combobox", { name: /search/i }) ??
    screen.getByPlaceholderText(/search/i),
  queryResultByName: (name: string) => screen.queryByText(name),
  getResultByName: (name: string) => screen.getByText(name),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  pressMetaK: () =>
    userEvent.keyboard("{Meta>}k{/Meta}"),
  pressCtrlK: () =>
    userEvent.keyboard("{Control>}k{/Control}"),
  typeQuery: (user: ReturnType<typeof userEvent.setup>, query: string) =>
    user.type(elements.getSearchInput(), query),
  clickResult: (name: string) =>
    userEvent.click(elements.getResultByName(name)),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchGamesFn.mockResolvedValue({ games: [], count: 0 });
  });

  // =========================================================================
  // 1. ⌘K binding opens the palette
  // =========================================================================

  describe("given the palette is mounted and initially closed", () => {
    beforeEach(() => {
      render(<CommandPalette />);
    });

    it("does not show the search input before the keyboard shortcut is pressed", () => {
      expect(elements.querySearchInput()).toBeNull();
    });

    describe("given the user presses Meta+K (⌘K)", () => {
      beforeEach(async () => {
        await actions.pressMetaK();
      });

      it("makes the search input visible in the document", () => {
        expect(elements.querySearchInput()).not.toBeNull();
      });
    });

    describe("given the user presses Ctrl+K (Windows/Linux equivalent)", () => {
      beforeEach(async () => {
        await actions.pressCtrlK();
      });

      it("makes the search input visible in the document", () => {
        expect(elements.querySearchInput()).not.toBeNull();
      });
    });
  });

  // =========================================================================
  // 2. Debounce window enforced — searchGamesFn is NOT called on each
  //    keystroke; it is called exactly once after the 300 ms debounce window.
  //
  //    The vitest unit project has fakeTimers pre-configured for setTimeout /
  //    clearTimeout (see vitest.config.ts → fakeTimers). We use
  //    userEvent.setup({ advanceTimers }) so userEvent cooperates with the
  //    fake clock per the testing rule file's "escape hatch" note.
  // =========================================================================

  describe("given the palette is open and the user types a query", () => {
    // userEvent.setup with fake-timer cooperation (rule file escape hatch).
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    beforeEach(async () => {
      render(<CommandPalette />);
      // Open the palette via ⌘K
      await user.keyboard("{Meta>}k{/Meta}");
      // Type the query one character at a time — each character fires a
      // synthetic keydown/keypress/input/keyup sequence.
      await user.type(elements.getSearchInput(), "zelda");
    });

    it("does not call searchGamesFn during the keystroke sequence (debounce window active)", () => {
      expect(mockSearchGamesFn).not.toHaveBeenCalled();
    });

    describe("given 300 ms elapse after the last keystroke", () => {
      beforeEach(() => {
        vi.advanceTimersByTime(300);
      });

      it("calls searchGamesFn exactly once after the debounce window", () => {
        expect(mockSearchGamesFn).toHaveBeenCalledTimes(1);
      });

      it("calls searchGamesFn with the complete query string", () => {
        expect(mockSearchGamesFn).toHaveBeenCalledWith(
          expect.objectContaining({
            data: expect.objectContaining({ name: "zelda" }),
          })
        );
      });
    });
  });

  // =========================================================================
  // 3. Result click navigates via TanStack Router.
  //
  //    The palette renders result rows as elements that, when clicked, navigate
  //    to `/games/$slug` using TanStack Router's Link or useNavigate.
  //
  //    The canonical (desktop-command-palette.tsx) calls router.push(`/games/${slug}`)
  //    for recent games (navigate-to-detail path) and quickAdd for search hits.
  //    In the tanstack port, the expected pattern is a Link to="/games/$slug"
  //    with params={{ slug }} — matching how every other game row in the app
  //    is wired (game-card.tsx, library-card-menu.tsx).
  //
  //    We assert the rendered anchor's href contains the slug — this is
  //    equivalent to asserting `to="/games/$slug"` with the right params.
  // =========================================================================

  describe("given the palette is open with a search result", () => {
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    const GAME = {
      id: 1942,
      name: "The Legend of Zelda: Breath of the Wild",
      slug: "the-legend-of-zelda-breath-of-the-wild",
    };

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({
        games: [
          {
            id: GAME.id,
            name: GAME.name,
            slug: GAME.slug,
            cover: null,
            first_release_date: null,
            platforms: [],
          },
        ],
        count: 1,
      });

      render(<CommandPalette />);

      // Open palette
      await user.keyboard("{Meta>}k{/Meta}");

      // Type query and advance past debounce
      await user.type(elements.getSearchInput(), "zelda");
      vi.advanceTimersByTime(300);

      // Wait for the result to appear in the DOM
      await waitFor(() => {
        expect(elements.queryResultByName(GAME.name)).not.toBeNull();
      });
    });

    it("renders the result row with an href pointing to the game-detail route", () => {
      const anchor = elements.getResultByName(GAME.name).closest("a");
      expect(anchor?.getAttribute("href")).toContain(GAME.slug);
    });

    it("the result row href is the full /games/$slug path", () => {
      const anchor = elements.getResultByName(GAME.name).closest("a");
      expect(anchor?.getAttribute("href")).toBe(`/games/${GAME.slug}`);
    });
  });
});
