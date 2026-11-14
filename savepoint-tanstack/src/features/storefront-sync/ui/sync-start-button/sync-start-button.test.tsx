/**
 * RED component test for SyncStartButton (spec 030 functional 2.1, tech 2.7).
 *
 * Contract:
 *   - `features/storefront-sync/ui/sync-start-button/` exports `SyncStartButton`
 *     with props `{ connected: boolean }` (and `SyncStartButtonProps`).
 *   - Reads the shared status query ["storefront-sync", "status", "STEAM"] via
 *     `getSteamSyncStatusFn()` (`../../api/get-steam-sync-status`).
 *   - Start calls `startSteamSyncFn({ data: { addAllToLibrary } })`
 *     (`../../api/start-steam-sync`), which resolves
 *     `{ jobId, status, alreadyRunning }`.
 *   - connected, idle      -> button "Sync" opening the "Sync your Steam library"
 *                             dialog (checkbox "Also add all games to my library"
 *                             unticked, buttons "Start sync" and "Cancel").
 *   - active job           -> disabled button "Syncing…".
 *   - alreadyRunning: true -> the text "A sync is already running" is rendered.
 *   - not connected        -> link "Connect Steam to sync" to /settings/account,
 *                             no Sync button.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSteamSyncStatusFn } from "../../api/get-steam-sync-status";
import { startSteamSyncFn } from "../../api/start-steam-sync";
import type { SteamSyncStatus } from "../../model/types";
import { SyncStartButton } from "./sync-start-button";

vi.mock("../../api/start-steam-sync", () => ({
  startSteamSyncFn: vi.fn(),
}));

vi.mock("../../api/get-steam-sync-status", () => ({
  getSteamSyncStatusFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => ({ invalidate: vi.fn() }),
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

const activeStatus: SteamSyncStatus = {
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
};

const renderButton = (props: { connected: boolean }) => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SyncStartButton {...props} />
    </QueryClientProvider>
  );
};

const elements = {
  findSyncButton: () => screen.findByRole("button", { name: "Sync" }),
  findSyncingButton: () => screen.findByRole("button", { name: "Syncing…" }),
  querySyncButton: () => screen.queryByRole("button", { name: "Sync" }),
  getDialog: () =>
    screen.getByRole("dialog", { name: "Sync your Steam library" }),
  queryDialog: () => screen.queryByRole("dialog"),
  getAddAllCheckbox: () =>
    within(elements.getDialog()).getByRole("checkbox", {
      name: "Also add all games to my library",
    }),
  getStartSyncButton: () =>
    within(elements.getDialog()).getByRole("button", { name: "Start sync" }),
  getCancelButton: () =>
    within(elements.getDialog()).getByRole("button", { name: "Cancel" }),
  findAlreadyRunningMessage: () =>
    screen.findByText("A sync is already running"),
  queryConnectLink: () =>
    screen.queryByRole("link", { name: "Connect Steam to sync" }),
};

const actions = {
  openSyncDialog: async () => {
    await userEvent.click(await elements.findSyncButton());
  },
  tickAddAll: () => userEvent.click(elements.getAddAllCheckbox()),
  startSync: () => userEvent.click(elements.getStartSyncButton()),
  cancel: () => userEvent.click(elements.getCancelButton()),
};

describe("SyncStartButton", () => {
  beforeEach(() => {
    vi.mocked(startSteamSyncFn).mockReset();
    vi.mocked(getSteamSyncStatusFn).mockReset();
    vi.mocked(getSteamSyncStatusFn).mockResolvedValue(null);
    vi.mocked(startSteamSyncFn).mockResolvedValue({
      jobId: "job-1",
      status: "QUEUED",
      alreadyRunning: false,
    });
  });

  describe("given a connected user with no sync running", () => {
    describe("when they press Sync", () => {
      beforeEach(async () => {
        renderButton({ connected: true });
        await actions.openSyncDialog();
      });

      it("shows the confirmation titled 'Sync your Steam library'", () => {
        expect(elements.getDialog()).toBeInTheDocument();
      });

      it("leaves 'Also add all games to my library' unticked", () => {
        expect(elements.getAddAllCheckbox()).not.toBeChecked();
      });
    });

    describe("when they press Cancel in the confirmation", () => {
      beforeEach(async () => {
        renderButton({ connected: true });
        await actions.openSyncDialog();
        await actions.cancel();
      });

      it("closes the confirmation", async () => {
        await waitFor(() => expect(elements.queryDialog()).toBeNull());
      });

      it("starts no sync", () => {
        expect(startSteamSyncFn).not.toHaveBeenCalled();
      });
    });

    describe("when they press Start sync", () => {
      beforeEach(async () => {
        renderButton({ connected: true });
        await actions.openSyncDialog();
        await actions.startSync();
      });

      it("closes the confirmation", async () => {
        await waitFor(() => expect(elements.queryDialog()).toBeNull());
      });

      it("starts one sync without adding every game to the library", () => {
        expect(startSteamSyncFn).toHaveBeenCalledExactlyOnceWith({
          data: { addAllToLibrary: false },
        });
      });
    });

    describe("when they tick the box and press Start sync", () => {
      beforeEach(async () => {
        renderButton({ connected: true });
        await actions.openSyncDialog();
        await actions.tickAddAll();
        await actions.startSync();
      });

      it("starts the sync asking to add every game to the library", () => {
        expect(startSteamSyncFn).toHaveBeenCalledExactlyOnceWith({
          data: { addAllToLibrary: true },
        });
      });
    });

    describe("when another tab already started a sync", () => {
      beforeEach(async () => {
        vi.mocked(startSteamSyncFn).mockResolvedValue({
          jobId: "job-1",
          status: "GATHERING",
          alreadyRunning: true,
        });
        renderButton({ connected: true });
        await actions.openSyncDialog();
        await actions.startSync();
      });

      it("tells the user a sync is already running", async () => {
        expect(await elements.findAlreadyRunningMessage()).toBeInTheDocument();
      });
    });
  });

  describe("given a connected user with a sync running", () => {
    beforeEach(() => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(activeStatus);
      renderButton({ connected: true });
    });

    it("shows a disabled 'Syncing…' button", async () => {
      expect(await elements.findSyncingButton()).toBeDisabled();
    });

    it("offers no 'Sync' button to press", async () => {
      await elements.findSyncingButton();

      expect(elements.querySyncButton()).toBeNull();
    });
  });

  describe("given a user who has not connected Steam", () => {
    beforeEach(() => {
      renderButton({ connected: false });
    });

    it("links to account settings with 'Connect Steam to sync'", () => {
      expect(elements.queryConnectLink()).toHaveAttribute(
        "href",
        "/settings/account"
      );
    });

    it("offers no 'Sync' button", () => {
      expect(elements.querySyncButton()).toBeNull();
    });
  });
});
