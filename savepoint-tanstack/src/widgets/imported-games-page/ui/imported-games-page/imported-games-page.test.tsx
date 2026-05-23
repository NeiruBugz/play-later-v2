import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGame } from "@/entities/imported-game/model/types";
import { dismissImportedGameFn } from "@/features/steam-import";

import { ImportedGamesPage } from "./imported-games-page";

// --- Mocks ----------------------------------------------------------------

// Mock every server-fn module the widget transitively imports — their deps
// reach `entities/session/api/get-session.server.ts` which the t3-env
// client guard refuses to load in jsdom.
vi.mock("@/features/steam-import/api/dismiss-imported-game", () => ({
  dismissImportedGameFn: vi.fn(),
}));
vi.mock("@/features/steam-import/api/import-steam-library", () => ({
  importSteamLibraryFn: vi.fn(),
}));
vi.mock("@/features/steam-import/api/fetch-steam-games", () => ({
  fetchSteamGamesFn: vi.fn(),
}));
vi.mock("@/features/steam-import/api/import-game-to-library", () => ({
  importGameToLibraryFn: vi.fn(),
}));
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));

const invalidateMock = vi.fn();
const navigateMock = vi.fn();
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: invalidateMock }),
  useNavigate: () => navigateMock,
  Link: ({
    to,
    children,
    ...rest
  }: {
    to: string;
    children: React.ReactNode;
  }) => (
    <a href={to} {...rest}>
      {children}
    </a>
  ),
}));

// --- Fixtures -------------------------------------------------------------

function makeGame(
  overrides: Partial<ImportedGame> & Pick<ImportedGame, "id" | "name">
): ImportedGame {
  return {
    storefront: "STEAM",
    storefrontGameId: "100",
    playtime: 0,
    playtimeWindows: 0,
    playtimeMac: 0,
    playtimeLinux: 0,
    lastPlayedAt: null,
    img_icon_url: null,
    img_logo_url: null,
    igdbMatchStatus: "MATCHED",
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    userId: "u-1",
    ...overrides,
  };
}

const unmatched = makeGame({
  id: "g-unmatch",
  name: "Custom Game",
  storefrontGameId: "999999",
  igdbMatchStatus: "UNMATCHED",
});
const pending = makeGame({
  id: "g-pending",
  name: "Pending Game",
  igdbMatchStatus: "PENDING",
});

// --- Element / action vocabulary ------------------------------------------

const elements = {
  queryEmptyConnect: () =>
    screen.queryByText("Connect Steam to see your games"),
  queryEmptyNoGames: () => screen.queryByText("No games imported yet"),
  querySyncButton: () =>
    screen.queryByRole("button", { name: /Sync from Steam/ }),
  queryConnectAction: () =>
    screen.queryByRole("link", { name: "Connect Steam" }) ??
    screen.queryByRole("button", { name: "Connect Steam" }),
  queryUnmatchedAlert: () =>
    screen.queryByText("Some games need a manual IGDB match"),
  queryAddButton: (name: string) =>
    screen.queryByRole("button", { name: `Add ${name} to library` }),
  querySearchIgdbButton: (name: string) =>
    screen.queryByRole("button", { name: `Search IGDB for ${name}` }),
  queryImportDialogTitle: () => screen.queryByText("Import to library"),
  querySearchDialogTitle: () => screen.queryByText("Select correct game"),
  queryDismissButton: (name: string) =>
    screen.queryByRole("button", { name: `Dismiss ${name}` }),
  getSearchInput: () =>
    screen.getByRole("textbox", { name: "Search imported games" }),
  getSortSelect: () => screen.getByRole("combobox", { name: "Sort games" }),
  getPlaytimeStatusSelect: () =>
    screen.getByRole("combobox", { name: "Filter by playtime status" }),
  getPlatformSelect: () =>
    screen.getByRole("combobox", { name: "Filter by platform" }),
  getShowDismissedCheckbox: () =>
    screen.getByRole("checkbox", { name: "Show dismissed games" }),
  queryRemoveFilterChip: (label: string) =>
    screen.queryByRole("button", { name: `Remove ${label} filter` }),
  queryNoMatchesEmptyState: () => screen.queryByText("No matches"),
};

/**
 * Pull the search-param patch out of the most recent `navigate(...)` call.
 * The bar passes `search: (prev) => next` so we invoke the updater with an
 * empty prev to inspect the resulting shape.
 */
function readLastNavigatePatch(): Record<string, unknown> {
  const lastCall = navigateMock.mock.calls.at(-1);
  if (!lastCall) return {};
  const arg = lastCall[0] as { search?: unknown };
  const searchArg = arg.search;
  if (typeof searchArg === "function") {
    return (
      searchArg as (prev: Record<string, unknown>) => Record<string, unknown>
    )({});
  }
  return (searchArg as Record<string, unknown>) ?? {};
}

// --- Tests ----------------------------------------------------------------

describe("ImportedGamesPage", () => {
  beforeEach(() => {
    vi.mocked(dismissImportedGameFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    invalidateMock.mockReset();
    navigateMock.mockReset();
  });

  describe("given zero games and no Steam connection", () => {
    beforeEach(() => {
      render(<ImportedGamesPage games={[]} steamId={null} />);
    });

    it("renders the Connect-Steam empty state", () => {
      expect(elements.queryEmptyConnect()).not.toBeNull();
    });

    it("renders a CTA linking to /settings/account", () => {
      const action = elements.queryConnectAction();
      expect(action).not.toBeNull();
      expect(action).toHaveAttribute("href", "/settings/account");
    });
  });

  describe("given zero games but Steam is connected", () => {
    beforeEach(() => {
      render(<ImportedGamesPage games={[]} steamId="76561198012345678" />);
    });

    it("renders the No-games-yet empty state", () => {
      expect(elements.queryEmptyNoGames()).not.toBeNull();
    });

    it("renders a Sync-from-Steam CTA", () => {
      expect(
        screen.queryByRole("button", { name: "Sync from Steam" })
      ).not.toBeNull();
    });
  });

  describe("given a mix of UNMATCHED + PENDING games (MATCHED rows excluded by the entity query)", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage
          games={[unmatched, pending]}
          steamId="76561198012345678"
        />
      );
    });

    it("renders the unmatched-rows warning Alert", () => {
      expect(elements.queryUnmatchedAlert()).not.toBeNull();
    });

    it("renders the Add-to-library button for every visible row", () => {
      expect(elements.queryAddButton("Custom Game")).not.toBeNull();
      expect(elements.queryAddButton("Pending Game")).not.toBeNull();
    });

    it("renders dismiss buttons for non-IGNORED rows", () => {
      expect(elements.queryDismissButton("Custom Game")).not.toBeNull();
      expect(elements.queryDismissButton("Pending Game")).not.toBeNull();
    });
  });

  describe("given the user clicks the per-row Add button on a PENDING row", () => {
    beforeEach(async () => {
      render(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
      await userEvent.click(elements.queryAddButton("Pending Game")!);
    });

    it("opens the import modal on the status-picker view", () => {
      expect(elements.queryImportDialogTitle()).not.toBeNull();
    });
  });

  describe("given the user clicks dismiss on a PENDING row", () => {
    beforeEach(async () => {
      vi.mocked(dismissImportedGameFn).mockResolvedValue(undefined as never);
      render(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
      await userEvent.click(elements.queryDismissButton("Pending Game")!);
    });

    it("calls dismissImportedGameFn with the row id", async () => {
      await waitFor(() => {
        expect(vi.mocked(dismissImportedGameFn)).toHaveBeenCalledWith({
          data: { importedGameId: "g-pending" },
        });
      });
    });

    it("fires the removed-from-list toast and invalidates the router", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          "Removed from list"
        );
      });
      expect(invalidateMock).toHaveBeenCalled();
    });
  });

  // --- Filter / sort / search bar ----------------------------------------
  describe("given the filter bar is rendered with populated games", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
    });

    it("renders the search input", () => {
      expect(elements.getSearchInput()).toBeTruthy();
    });

    it("renders the sort select", () => {
      expect(elements.getSortSelect()).toBeTruthy();
    });

    it("renders the show-dismissed checkbox", () => {
      expect(elements.getShowDismissedCheckbox()).toBeTruthy();
    });
  });

  describe("given the user types a search query and presses Enter", () => {
    beforeEach(async () => {
      render(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
      await userEvent.type(elements.getSearchInput(), "halo{Enter}");
    });

    it("navigates with `q` in the search params", () => {
      const patch = readLastNavigatePatch();
      expect(patch).toEqual(expect.objectContaining({ q: "halo" }));
    });
  });

  describe("given the user toggles 'Show dismissed games'", () => {
    beforeEach(async () => {
      render(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
      await userEvent.click(elements.getShowDismissedCheckbox());
    });

    it("navigates with `include=ignored`", () => {
      const patch = readLastNavigatePatch();
      expect(patch).toEqual(expect.objectContaining({ include: "ignored" }));
    });
  });

  describe("given a search filter is active in the URL", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage
          games={[pending]}
          steamId="76561198012345678"
          filters={{ q: "halo" }}
        />
      );
    });

    it("renders a removable chip for the active search", () => {
      expect(elements.queryRemoveFilterChip("Search: halo")).not.toBeNull();
    });

    it("clears the q param when the chip is clicked", async () => {
      await userEvent.click(elements.queryRemoveFilterChip("Search: halo")!);
      const patch = readLastNavigatePatch();
      // `q` is undefined in the patch (the bar strips it) so the URL
      // ends up without it.
      expect(patch.q).toBeUndefined();
    });
  });

  describe("given filters are active but the server returned zero rows", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage
          games={[]}
          steamId="76561198012345678"
          filters={{ q: "missing" }}
        />
      );
    });

    it("renders the no-matches empty state, not the onboarding empty state", () => {
      expect(elements.queryNoMatchesEmptyState()).not.toBeNull();
      expect(elements.queryEmptyNoGames()).toBeNull();
      expect(elements.queryEmptyConnect()).toBeNull();
    });

    it("still renders the filter bar so the user can refine", () => {
      expect(elements.getSearchInput()).toBeTruthy();
    });
  });
});
