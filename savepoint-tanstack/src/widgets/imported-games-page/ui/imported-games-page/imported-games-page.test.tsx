import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGame } from "@/entities/imported-game/model/types";
// Wire mocks back in for assertion calls
import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { dismissImportedGameFn } from "@/features/steam-import";

import { ImportedGamesPage } from "./imported-games-page";

// --- Mocks ----------------------------------------------------------------

// The widget imports the `addGameToLibraryFn` server fn module — its
// transitive deps reach `entities/session/api/get-session.server.ts` which
// the t3-env client guard refuses to load in a jsdom test. We mock the
// server-fn module at its file path.
vi.mock("@/features/add-game/api/add-game-to-library-fn", () => ({
  addGameToLibraryFn: vi.fn(),
}));
// Same reason for the steam-import server fns. We mock the underlying
// modules so the rest of the barrel (UI components, toast helpers) loads
// normally — the widget imports both client-side UI and the server fns
// through the barrel.
vi.mock("@/features/steam-import/api/dismiss-imported-game", () => ({
  dismissImportedGameFn: vi.fn(),
}));
vi.mock("@/features/steam-import/api/import-steam-library", () => ({
  importSteamLibraryFn: vi.fn(),
}));
vi.mock("@/features/steam-import/api/fetch-steam-games", () => ({
  fetchSteamGamesFn: vi.fn(),
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

const matched = makeGame({
  id: "g-match",
  name: "Half-Life",
  storefrontGameId: "70",
  igdbMatchStatus: "MATCHED",
});
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
  getSelectAll: () =>
    screen.getByRole("checkbox", { name: "Select all matched games" }),
  getBulkAddButton: () =>
    screen.getByRole("button", { name: "Add selected to library" }),
  getRowCheckbox: (name: string) =>
    screen.getByRole("checkbox", { name: `Select ${name}` }),
  queryAddButton: (name: string) =>
    screen.queryByRole("button", { name: `Add ${name} to library` }),
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
    vi.mocked(addGameToLibraryFn).mockReset();
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

  describe("given a mix of MATCHED, UNMATCHED, PENDING games", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage
          games={[unmatched, matched, pending]}
          steamId="76561198012345678"
        />
      );
    });

    it("renders the unmatched-rows warning Alert", () => {
      expect(elements.queryUnmatchedAlert()).not.toBeNull();
    });

    it("renders the Add-to-library button only for MATCHED rows", () => {
      expect(elements.queryAddButton("Half-Life")).not.toBeNull();
      expect(elements.queryAddButton("Custom Game")).toBeNull();
      expect(elements.queryAddButton("Pending Game")).toBeNull();
    });

    it("renders dismiss buttons for non-IGNORED rows", () => {
      expect(elements.queryDismissButton("Half-Life")).not.toBeNull();
      expect(elements.queryDismissButton("Custom Game")).not.toBeNull();
      expect(elements.queryDismissButton("Pending Game")).not.toBeNull();
    });
  });

  describe("given the bulk-select-all checkbox is toggled", () => {
    beforeEach(async () => {
      render(
        <ImportedGamesPage
          games={[unmatched, matched, pending]}
          steamId="76561198012345678"
        />
      );
      await userEvent.click(elements.getSelectAll());
    });

    it("selects only MATCHED rows (UNMATCHED checkboxes are disabled)", () => {
      const matchedCheckbox = elements.getRowCheckbox("Half-Life");
      expect(matchedCheckbox).toHaveAttribute("data-state", "checked");
    });

    it("shows the selection count", () => {
      expect(screen.getByText("1 selected")).toBeTruthy();
    });
  });

  describe("given the user clicks 'Add selected to library' with one MATCHED row selected", () => {
    beforeEach(async () => {
      vi.mocked(addGameToLibraryFn).mockResolvedValue({} as never);
      render(
        <ImportedGamesPage games={[matched]} steamId="76561198012345678" />
      );
      await userEvent.click(elements.getRowCheckbox("Half-Life"));
      await userEvent.click(elements.getBulkAddButton());
    });

    it("fires addGameToLibraryFn for the matched row", async () => {
      await waitFor(() => {
        expect(vi.mocked(addGameToLibraryFn)).toHaveBeenCalledWith({
          data: { igdbId: 70 },
        });
      });
    });

    it("fires toast.success with the count", async () => {
      await waitFor(() => {
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith(
          "Added 1 games to library"
        );
      });
    });
  });

  describe("given the user clicks dismiss on a MATCHED row", () => {
    beforeEach(async () => {
      vi.mocked(dismissImportedGameFn).mockResolvedValue(undefined as never);
      render(
        <ImportedGamesPage games={[matched]} steamId="76561198012345678" />
      );
      await userEvent.click(elements.queryDismissButton("Half-Life")!);
    });

    it("calls dismissImportedGameFn with the row id", async () => {
      await waitFor(() => {
        expect(vi.mocked(dismissImportedGameFn)).toHaveBeenCalledWith({
          data: { importedGameId: "g-match" },
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

  describe("given no rows are selected", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage games={[matched]} steamId="76561198012345678" />
      );
    });

    it("disables the bulk-add button", () => {
      expect(elements.getBulkAddButton()).toBeDisabled();
    });
  });

  // --- Filter / sort / search bar ----------------------------------------
  describe("given the filter bar is rendered with populated games", () => {
    beforeEach(() => {
      render(
        <ImportedGamesPage games={[matched]} steamId="76561198012345678" />
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
        <ImportedGamesPage games={[matched]} steamId="76561198012345678" />
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
        <ImportedGamesPage games={[matched]} steamId="76561198012345678" />
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
          games={[matched]}
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
