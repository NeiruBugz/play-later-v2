/**
 * @spec: 030-background-storefront-import
 * @regression
 *
 * The import page as one person uses it to start and watch a sync (functional
 * spec 2.1.1, 2.1.2, 2.7.2). The real page, Sync button, confirmation and
 * progress are rendered; only the server fns and the router are mocked.
 */
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ImportedGameWithGame } from "@/entities/imported-game/model/types";
import { getSteamSyncStatusFn } from "@/features/storefront-sync/api/get-steam-sync-status";
import { startSteamSyncFn } from "@/features/storefront-sync/api/start-steam-sync";
import type { SteamSyncStatus } from "@/features/storefront-sync/model/types";

import { ImportedGamesPage } from "./imported-games-page";

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
vi.mock("@/features/storefront-sync/api/mark-sync-notice-seen", () => ({
  markSyncNoticeSeenFn: vi.fn(),
}));
vi.mock("@/features/add-game/api/search-games-fn", () => ({
  searchGamesFn: vi.fn(),
}));
vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() },
}));
vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
  useNavigate: () => vi.fn(),
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

const STEAM_ID = "76561198012345678";

const makeSyncStatus = (
  overrides: Partial<SteamSyncStatus> = {}
): SteamSyncStatus => ({
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
});

const gameOnTheList: ImportedGameWithGame = {
  id: "g-1",
  userId: "u-1",
  storefront: "STEAM",
  storefrontGameId: "220",
  name: "Half-Life 2",
  playtime: 0,
  playtimeWindows: 0,
  playtimeMac: 0,
  playtimeLinux: 0,
  lastPlayedAt: null,
  img_icon_url: null,
  img_logo_url: null,
  igdbMatchStatus: "PENDING",
  createdAt: new Date(),
  updatedAt: new Date(),
  deletedAt: null,
  gameId: null,
  lookedUpAt: null,
  game: null,
};

const OLD_COPY = [
  "We'll notify you when it's complete.",
  "Steam import started",
  "imported successfully",
];

const elements = {
  findSyncButton: () => screen.findByRole("button", { name: "Sync" }),
  findSyncingButton: () => screen.findByRole("button", { name: "Syncing…" }),
  querySyncButton: () => screen.queryByRole("button", { name: "Sync" }),
  getConfirmation: () =>
    screen.getByRole("dialog", { name: "Sync your Steam library" }),
  queryConfirmation: () =>
    screen.queryByRole("dialog", { name: "Sync your Steam library" }),
  getStartSyncButton: () => screen.getByRole("button", { name: "Start sync" }),
  findFetchingStatus: () =>
    screen.findByRole("status", { name: "Fetching your Steam library…" }),
  queryAllStatuses: () => screen.queryAllByRole("status"),
  findAlreadyRunningNote: () => screen.findByText("A sync is already running"),
  queryOldCopy: (copy: string) => screen.queryByText(copy, { exact: false }),
};

const actions = {
  openConfirmation: async () => {
    await userEvent.click(await elements.findSyncButton());
  },
  startSync: () => userEvent.click(elements.getStartSyncButton()),
};

function renderPage() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <ImportedGamesPage games={[gameOnTheList]} steamId={STEAM_ID} />
    </QueryClientProvider>
  );
}

function toastMessages(): string[] {
  return [toast.success, toast.error, toast.info].flatMap((fn) =>
    vi.mocked(fn).mock.calls.flatMap((call) => call.map(String))
  );
}

describe("@spec: 030-background-storefront-import @regression the import page starts a sync (2.1.1, 2.7.2)", () => {
  beforeEach(() => {
    vi.mocked(startSteamSyncFn).mockReset();
    vi.mocked(getSteamSyncStatusFn).mockReset();
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.info).mockReset();
    vi.mocked(toast.error).mockReset();
  });

  describe("given a connected person with no sync running who presses Sync and then 'Start sync'", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValueOnce(null);
      vi.mocked(startSteamSyncFn).mockImplementation(async () => {
        vi.mocked(getSteamSyncStatusFn).mockResolvedValue(makeSyncStatus());
        return { jobId: "job-1", status: "QUEUED", alreadyRunning: false };
      });
      renderPage();
      await actions.openConfirmation();
      await actions.startSync();
    });

    it("closes the confirmation", async () => {
      await waitFor(() => expect(elements.queryConfirmation()).toBeNull());
    });

    it("shows that a sync is running: a disabled 'Syncing…' button and the fetching stage", async () => {
      expect(await elements.findSyncingButton()).toBeDisabled();
      expect(await elements.findFetchingStatus()).toBeInTheDocument();
    });

    it("no longer offers a Sync button to press", async () => {
      await elements.findSyncingButton();

      expect(elements.querySyncButton()).toBeNull();
    });

    it.each(OLD_COPY)("never says '%s'", async (copy) => {
      await elements.findSyncingButton();

      expect(elements.queryOldCopy(copy)).toBeNull();
      expect(toastMessages().some((message) => message.includes(copy))).toBe(
        false
      );
    });
  });

  describe("given the person presses Sync and then Cancel", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(null);
      renderPage();
      await actions.openConfirmation();
      expect(elements.getConfirmation()).toBeInTheDocument();
      await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    });

    it("starts no sync and leaves the page as it was", async () => {
      await waitFor(() => expect(elements.queryConfirmation()).toBeNull());

      expect(startSteamSyncFn).not.toHaveBeenCalled();
      expect(await elements.findSyncButton()).toBeEnabled();
      expect(elements.queryAllStatuses()).toHaveLength(0);
    });
  });
});

describe("@spec: 030-background-storefront-import @regression one sync at a time, seen from the page (2.1.2)", () => {
  beforeEach(() => {
    vi.mocked(startSteamSyncFn).mockReset();
    vi.mocked(getSteamSyncStatusFn).mockReset();
  });

  describe("given another tab already started the sync when this tab presses 'Start sync'", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValueOnce(null);
      vi.mocked(startSteamSyncFn).mockImplementation(async () => {
        vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
          makeSyncStatus({ status: "LOOKING_UP", totalToLookUp: 10 })
        );
        return { jobId: "job-1", status: "GATHERING", alreadyRunning: true };
      });
      renderPage();
      await actions.openConfirmation();
      await actions.startSync();
    });

    it("says 'A sync is already running'", async () => {
      expect(await elements.findAlreadyRunningNote()).toBeInTheDocument();
    });

    it("shows that one sync's progress, once", async () => {
      await elements.findSyncingButton();

      await waitFor(() => expect(elements.queryAllStatuses()).toHaveLength(1));
    });
  });

  describe("given a sync is running when the page is opened (a new tab, a reload or another device)", () => {
    beforeEach(() => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeSyncStatus({
          status: "LOOKING_UP",
          totalToLookUp: 1200,
          lookedUp: 340,
        })
      );
      renderPage();
    });

    it("reads 'Syncing…' on a button that cannot be pressed", async () => {
      expect(await elements.findSyncingButton()).toBeDisabled();
    });

    it("shows the sync's progress, 'Looking up your games — 340 of 1,200'", async () => {
      expect(
        await screen.findByRole("status", { name: "Looking up your games" })
      ).toHaveTextContent("Looking up your games — 340 of 1,200");
    });

    // FINDING (spec 2.1.2: "the progress (2.2) appears directly below" the
    // Sync button): FAILS today. `imported-games-page.tsx` renders
    // <SyncProgress/> BEFORE the row holding <SyncStartButton/> (and above the
    // button in the empty state too), so the progress sits above the button.
    it("[FINDING] puts the progress directly below the Sync button", async () => {
      const button = await elements.findSyncingButton();
      const progress = await screen.findByRole("status", {
        name: "Looking up your games",
      });

      expect(
        button.compareDocumentPosition(progress) &
          Node.DOCUMENT_POSITION_FOLLOWING
      ).toBeTruthy();
    });
  });
});

describe("@spec: 030-background-storefront-import @regression the old import wording is gone from the app (2.7.2)", () => {
  const sourceRoot = join(process.cwd(), "src");
  const isProductionSource = (path: string) =>
    /\.(ts|tsx)$/.test(path) && !/\.test\.|\.acceptance\./.test(path);
  const sourceFiles = readdirSync(sourceRoot, { recursive: true })
    .map(String)
    .filter(isProductionSource);

  it.each(OLD_COPY)("no source file still contains '%s'", (copy) => {
    const offenders = sourceFiles.filter((file) =>
      readFileSync(join(sourceRoot, file), "utf8").includes(copy)
    );

    expect(offenders).toEqual([]);
  });
});
