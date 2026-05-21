/**
 * Component tests for CommandPalette (Slice 17).
 *
 * CONTRACT
 * - ⌘K / Ctrl+K toggles open; closed state hides the search input.
 * - Typing debounces 300 ms before calling searchGamesFn exactly once.
 * - Search result rows render as <Link to="/games/$slug"> anchors.
 *
 * NOT tested: desktop/mobile branching, quick-add flow, navigation-group,
 * quick-actions-group, IGDB cover format, server fn correctness.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/features/command-palette/ui/command-palette";

// ---------------------------------------------------------------------------
// Mock: @tanstack/react-router — Link resolves to a plain <a> with the
// interpolated href so href assertions work without a RouterProvider.
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
// createServerFn boundary in vitest).
// ---------------------------------------------------------------------------

const mockSearchGamesFn = vi.fn();

vi.mock("@/features/search-games", () => ({
  searchGamesFn: (...args: unknown[]) => mockSearchGamesFn(...args),
}));

// ---------------------------------------------------------------------------
// Mock: the palette's own quick-add server fns (foot-gun #8 — these wrap
// createServerFn and transitively import server-only auth/env, which crashes
// the jsdom unit env). Quick-add behaviour itself is covered by
// game-result-item.test.tsx.
// ---------------------------------------------------------------------------

vi.mock("../../api/quick-add-to-library-fn", () => ({
  quickAddToLibraryFn: vi.fn(),
}));

vi.mock("../../api/remove-library-item-fn", () => ({
  removeLibraryItemFn: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Element vocabulary
// ---------------------------------------------------------------------------

const elements = {
  // cmdk's CommandInput renders role="combobox"; the accessible name comes from
  // the `label` prop on the Command root ("Search games" in command-palette.tsx).
  querySearchInput: () =>
    screen.queryByRole("combobox", { name: "Search games" }),
  getSearchInput: () => screen.getByRole("combobox", { name: "Search games" }),
  queryResultByName: (name: string) => screen.queryByText(name),
  getResultByName: (name: string) => screen.getByText(name),
};

// ---------------------------------------------------------------------------
// Action vocabulary
// ---------------------------------------------------------------------------

const actions = {
  pressMetaK: () => userEvent.keyboard("{Meta>}k{/Meta}"),
  pressCtrlK: () => userEvent.keyboard("{Control>}k{/Control}"),
};

// ---------------------------------------------------------------------------
// Suite
// ---------------------------------------------------------------------------

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSearchGamesFn.mockResolvedValue({ games: [], count: 0 });
  });

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

  // userEvent.setup with fake-timer cooperation so userEvent cooperates with
  // vitest's pre-configured fakeTimers (setTimeout / clearTimeout).
  describe("given the palette is open and the user types a query", () => {
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    beforeEach(async () => {
      render(<CommandPalette />);
      await user.keyboard("{Meta>}k{/Meta}");
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
      await user.keyboard("{Meta>}k{/Meta}");
      await user.type(elements.getSearchInput(), "zelda");
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(elements.queryResultByName(GAME.name)).not.toBeNull();
      });
    });

    it("renders the result row with an href pointing to the full /games/$slug route", () => {
      const anchor = elements.getResultByName(GAME.name).closest("a");
      expect(anchor?.getAttribute("href")).toBe(`/games/${GAME.slug}`);
    });
  });
});
