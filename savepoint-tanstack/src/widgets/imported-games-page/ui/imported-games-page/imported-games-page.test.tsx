import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGame } from "@/entities/imported-game/model/types";
import { dismissImportedGameFn } from "@/features/steam-import";
import { getSteamSyncStatusFn } from "@/features/storefront-sync/api/get-steam-sync-status";
import type { SteamSyncStatus } from "@/features/storefront-sync/model/types";

import { ImportedGamesPage } from "./imported-games-page";

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
vi.mock("@/features/storefront-sync/api/start-steam-sync", () => ({
  startSteamSyncFn: vi.fn(),
}));
vi.mock("@/features/storefront-sync/api/get-steam-sync-status", () => ({
  getSteamSyncStatusFn: vi.fn(),
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

function renderPage(ui: React.ReactElement) {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>{ui}</QueryClientProvider>
  );
}

function makeSyncStatus(overrides: Partial<SteamSyncStatus>): SteamSyncStatus {
  return {
    jobId: "job-1",
    status: "GATHERING",
    totalToLookUp: 0,
    lookedUp: 0,
    newGames: 0,
    refreshedGames: 0,
    addedToLibrary: 0,
    needsMatch: 0,
    addAllToLibrary: false,
    failureCode: null,
    finishedAt: null,
    noticeSeen: false,
    ...overrides,
  };
}

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

const elements = {
  queryEmptyConnect: () =>
    screen.queryByText("Connect Steam to see your games"),
  queryEmptyNoGames: () => screen.queryByText("No games imported yet"),
  querySyncButton: () => screen.queryByRole("button", { name: "Sync" }),
  queryLegacyImportButton: () =>
    screen.queryByRole("button", { name: /Import from Steam/ }),
  findSyncingButton: () => screen.findByRole("button", { name: "Syncing…" }),
  queryConnectSyncLink: () =>
    screen.queryByRole("link", { name: "Connect Steam to sync" }),
  findFetchingStatus: () =>
    screen.findByRole("status", { name: "Fetching your Steam library…" }),
  queryConnectAction: () =>
    screen.queryByRole("link", { name: "Connect Steam" }) ??
    screen.queryByRole("button", { name: "Connect Steam" }),
  queryUnmatchedAlert: () =>
    screen.queryByText("Some games need a manual match"),
  queryAddButton: (name: string) =>
    screen.queryByRole("button", { name: `Add ${name}` }),
  querySearchIgdbButton: (name: string) =>
    screen.queryByRole("button", { name: `Search for ${name}` }),
  queryImportDialogTitle: () => screen.queryByText("Add game"),
  querySearchDialogTitle: () => screen.queryByText("Select correct game"),
  queryDismissButton: (name: string) =>
    screen.queryByRole("button", { name: `Remove ${name}` }),
  getSearchInput: () =>
    screen.getByRole("textbox", { name: "Search Steam games" }),
  getSortSelect: () => screen.getByRole("combobox", { name: "Sort games" }),
  getPlaytimeStatusSelect: () =>
    screen.getByRole("combobox", { name: "Filter by time played status" }),
  getPlatformSelect: () =>
    screen.getByRole("combobox", { name: "Filter by platform" }),
  getShowDismissedCheckbox: () =>
    screen.getByRole("checkbox", { name: "Show removed games" }),
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

describe("ImportedGamesPage", () => {
  beforeEach(() => {
    vi.mocked(dismissImportedGameFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    invalidateMock.mockReset();
    navigateMock.mockReset();
    vi.mocked(getSteamSyncStatusFn).mockReset();
    vi.mocked(getSteamSyncStatusFn).mockResolvedValue(null);
  });

  describe("given zero games and no Steam connection", () => {
    beforeEach(() => {
      renderPage(<ImportedGamesPage games={[]} steamId={null} />);
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
      renderPage(<ImportedGamesPage games={[]} steamId="76561198012345678" />);
    });

    it("renders the No-games-yet empty state", () => {
      expect(elements.queryEmptyNoGames()).not.toBeNull();
    });

    it("offers the Sync button in place of the legacy Import-from-Steam button", () => {
      expect(elements.querySyncButton()).not.toBeNull();
      expect(elements.queryLegacyImportButton()).toBeNull();
    });
  });

  describe("given zero games, Steam connected, and a sync running", () => {
    beforeEach(() => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeSyncStatus({ status: "GATHERING" })
      );
      renderPage(<ImportedGamesPage games={[]} steamId="76561198012345678" />);
    });

    it("tells the user the Steam library is being fetched", async () => {
      expect(await elements.findFetchingStatus()).toBeInTheDocument();
    });

    it("shows a disabled 'Syncing…' button", async () => {
      expect(await elements.findSyncingButton()).toBeDisabled();
    });
  });

  describe("given a populated list and Steam connected", () => {
    beforeEach(() => {
      renderPage(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
    });

    it("offers the Sync button above the list", () => {
      expect(elements.querySyncButton()).not.toBeNull();
      expect(elements.queryLegacyImportButton()).toBeNull();
    });
  });

  describe("given a populated list and no Steam connection", () => {
    beforeEach(() => {
      renderPage(<ImportedGamesPage games={[pending]} steamId={null} />);
    });

    it("links to account settings instead of offering Sync", () => {
      expect(elements.queryConnectSyncLink()).toHaveAttribute(
        "href",
        "/settings/account"
      );
      expect(elements.querySyncButton()).toBeNull();
    });
  });

  describe("given the sync moves from gathering to finished while the page is open", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeSyncStatus({ status: "GATHERING" })
      );
      renderPage(
        <ImportedGamesPage games={[pending]} steamId="76561198012345678" />
      );
      await elements.findSyncingButton();
      invalidateMock.mockClear();
    });

    it("refreshes the loader data once the stage changes", async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeSyncStatus({ status: "FINISHED", finishedAt: new Date() })
      );

      await waitFor(() => expect(invalidateMock).toHaveBeenCalledOnce(), {
        timeout: 5000,
      });
    }, 8000);
  });

  describe("given a mix of UNMATCHED + PENDING games (MATCHED rows excluded by the entity query)", () => {
    beforeEach(() => {
      renderPage(
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
      renderPage(
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
      renderPage(
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
        expect(vi.mocked(toast.success)).toHaveBeenCalledWith("Removed");
      });
      expect(invalidateMock).toHaveBeenCalled();
    });
  });

  describe("given the filter bar is rendered with populated games", () => {
    beforeEach(() => {
      renderPage(
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
      renderPage(
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
      renderPage(
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
      renderPage(
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
      renderPage(
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

    it("offers a Clear filters action (no-results template always can clear)", () => {
      expect(screen.getByText("Clear filters")).toBeInTheDocument();
    });
  });
});
