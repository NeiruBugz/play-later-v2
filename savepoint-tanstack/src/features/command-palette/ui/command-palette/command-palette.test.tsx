/**
 * Component tests for CommandPalette (Slice 17).
 *
 * CONTRACT
 * - ⌘K / Ctrl+K toggles open; closed state hides the search input.
 * - Typing debounces 300 ms before calling searchGamesFn exactly once.
 * - Search result rows render as <Link to="/games/$slug"> anchors.
 *
 * NOT tested: desktop/mobile branching, navigation-group,
 * quick-actions-group, IGDB cover format, server fn correctness.
 */

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { CommandPalette } from "@/features/command-palette/ui/command-palette";

// Default to desktop (true); override to false in mobile-specific describe blocks.
let mockIsDesktop = true;

vi.mock("@/shared/lib/use-media-query", () => ({
  useIsDesktop: () => mockIsDesktop,
  useMediaQuery: () => mockIsDesktop,
}));

const mockNavigate = vi.fn();

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => mockNavigate,
  useRouter: vi.fn(() => ({ invalidate: vi.fn() })),
  Link: ({
    to,
    href,
    params,
    search,
    children,
    ...rest
  }: {
    to?: string;
    href?: string;
    search?: Record<string, string>;
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
      <a
        href={
          search
            ? `${resolvedHref}?${new URLSearchParams(search)}`
            : resolvedHref
        }
        {...rest}
      >
        {children}
      </a>
    );
  },
}));

const mockSearchGamesFn = vi.fn();

vi.mock("../../api/search-games-fn", () => ({
  searchGamesFn: (...args: unknown[]) => mockSearchGamesFn(...args),
}));

const elements = {
  // cmdk's CommandInput renders role="combobox"; the accessible name comes from
  // the `label` prop on the Command root ("Search games" in command-palette.tsx).
  querySearchInput: () =>
    screen.queryByRole("combobox", { name: "Search games" }),
  getSearchInput: () => screen.getByRole("combobox", { name: "Search games" }),
  queryResultByName: (name: string) => screen.queryByText(name),
  getResultByName: (name: string) => screen.getByText(name),
};

const actions = {
  pressMetaK: () => userEvent.keyboard("{Meta>}k{/Meta}"),
  pressCtrlK: () => userEvent.keyboard("{Control>}k{/Control}"),
};

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

  describe("given the palette is rendered in controlled mode (open prop provided)", () => {
    const onOpenChange = vi.fn();

    beforeEach(() => {
      render(<CommandPalette open={true} onOpenChange={onOpenChange} />);
    });

    it("renders the search input immediately (controlled open)", () => {
      expect(elements.querySearchInput()).not.toBeNull();
    });

    it("calls onOpenChange(false) when the user presses Escape in controlled mode", async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      await user.keyboard("{Escape}");
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("given the palette is rendered on a mobile viewport (isDesktop = false)", () => {
    beforeEach(() => {
      mockIsDesktop = false;
      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);
    });

    afterEach(() => {
      mockIsDesktop = true;
    });

    it("renders the mobile bottom-sheet container instead of the dialog", () => {
      expect(
        document.querySelector('[data-testid="command-palette-mobile-sheet"]')
      ).not.toBeNull();
    });

    it("still renders the search combobox inside the sheet", () => {
      expect(elements.querySearchInput()).not.toBeNull();
    });
  });

  describe("given the palette is open with a result that has a release date", () => {
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    const DATED_GAME = {
      id: 2000,
      name: "Elden Ring",
      slug: "elden-ring",
      first_release_date: 1645574400, // 2022-02-23
      cover: null,
      platforms: [],
    };

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({
        games: [DATED_GAME],
        count: 1,
      });

      render(<CommandPalette />);
      await user.keyboard("{Meta>}k{/Meta}");
      await user.type(elements.getSearchInput(), "elden");
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(elements.queryResultByName(DATED_GAME.name)).not.toBeNull();
      });
    });

    it("renders the result row with the correct game name", () => {
      expect(elements.queryResultByName(DATED_GAME.name)).not.toBeNull();
    });
  });

  describe("given the palette is open (uncontrolled) and the user presses Escape", () => {
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    beforeEach(async () => {
      render(<CommandPalette />);
      await user.keyboard("{Meta>}k{/Meta}");
      expect(elements.querySearchInput()).not.toBeNull();
      await user.keyboard("{Escape}");
    });

    it("closes the palette (search input is no longer visible)", async () => {
      await waitFor(() => expect(elements.querySearchInput()).toBeNull());
    });
  });

  describe("given the palette is open with no query", () => {
    beforeEach(() => {
      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);
    });

    it("has a New note quick action and no Add game quick action", () => {
      expect(screen.queryByRole("option", { name: "New note" })).not.toBeNull();
      expect(screen.queryByText("Add game to library")).toBeNull();
    });

    it("never shows the technical source name", () => {
      expect(document.body.textContent).not.toContain("IGDB");
    });
  });

  describe("given the user chooses New note", () => {
    const onOpenChange = vi.fn();

    beforeEach(async () => {
      render(<CommandPalette open={true} onOpenChange={onOpenChange} />);
      await userEvent.click(screen.getByRole("option", { name: "New note" }));
    });

    it("opens the note composer through the log-session action", () => {
      const options = mockNavigate.mock.calls[0]![0] as {
        search: (prev: object) => object;
      };
      expect(options.search({})).toEqual({
        action: "log-session",
        game: undefined,
      });
    });

    it("closes the palette", () => {
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });
  });

  describe("given a search with results and an injected add slot", () => {
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({
        games: [
          {
            id: 9,
            name: "Hades",
            slug: "hades",
            cover: null,
            first_release_date: null,
            platforms: [],
            library: null,
          },
        ],
        count: 1,
      });
      render(
        <CommandPalette
          open={true}
          onOpenChange={vi.fn()}
          renderAddAction={({ name }) => (
            <button type="button">{`Add ${name}`}</button>
          )}
        />
      );
      await user.type(elements.getSearchInput(), "hades");
      vi.advanceTimersByTime(300);
      await waitFor(() => {
        expect(elements.queryResultByName("Hades")).not.toBeNull();
      });
    });

    it("renders the add slot for the result", () => {
      expect(
        screen.queryByRole("button", { name: "Add Hades" })
      ).not.toBeNull();
    });

    it("links See all results to the search page with the same text", () => {
      const link = screen.getByText("See all results").closest("a");
      expect(link?.getAttribute("href")).toBe("/games/search?q=hades");
    });
  });

  describe("given the palette is open in controlled mode with a query that yields no results", () => {
    const user = userEvent.setup({
      advanceTimers: (ms) => vi.advanceTimersByTime(ms),
    });

    beforeEach(async () => {
      mockSearchGamesFn.mockResolvedValue({ games: [], count: 0 });

      render(<CommandPalette open={true} onOpenChange={vi.fn()} />);
      await user.type(elements.getSearchInput(), "xyzzy");
      vi.advanceTimersByTime(300);

      await waitFor(() => {
        expect(mockSearchGamesFn).toHaveBeenCalled();
      });
    });

    it("shows the no-results message when search returns an empty list", async () => {
      await waitFor(() => {
        expect(screen.queryByText(/no games found/i)).not.toBeNull();
      });
    });
  });
});
