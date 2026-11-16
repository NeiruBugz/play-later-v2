/**
 * RED component test for SyncFailureAlert (spec 030 functional 2.6.3, tech 2.7).
 *
 * Contract:
 *   - `features/storefront-sync/ui/sync-failure-alert/` exports `SyncFailureAlert`
 *     (no props) and is re-exported from `ui/index.ts` and the feature barrel.
 *   - Reads the shared status query ["storefront-sync", "status", "STEAM"] whose
 *     queryFn is `getSteamSyncStatusFn()` (`../../api/get-steam-sync-status`).
 *   - When the latest job is FAILED it renders a `role="alert"` whose text is
 *     `syncFailureMessage(failureCode)` (`../../lib/failure-copy`).
 *   - Nothing is rendered when there is no job, or the latest job is active
 *     (QUEUED | GATHERING | LOOKING_UP) or FINISHED. So the alert disappears as
 *     soon as a new sync starts: the shared query is refetched (the start
 *     button invalidates it) and the latest job is no longer FAILED.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { act } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSteamSyncStatusFn } from "../../api/get-steam-sync-status";
import type { SteamSyncStatus } from "../../model/types";
import { SyncFailureAlert } from "./sync-failure-alert";

vi.mock("../../api/get-steam-sync-status", () => ({
  getSteamSyncStatusFn: vi.fn(),
}));

const STATUS_QUERY_KEY = ["storefront-sync", "status", "STEAM"];

const makeStatus = (overrides: Partial<SteamSyncStatus>): SteamSyncStatus => ({
  jobId: "job-1",
  status: "FAILED",
  totalToLookUp: 0,
  lookedUp: 0,
  newGames: 0,
  refreshedGames: 0,
  addedToLibrary: 0,
  needsMatch: 0,
  addAllToLibrary: false,
  failureCode: null,
  finishedAt: new Date("2026-11-14T12:00:00.000Z"),
  noticeSeen: false,
  ...overrides,
});

const failedWith = (failureCode: SteamSyncStatus["failureCode"]) =>
  makeStatus({ status: "FAILED", failureCode });

let queryClient: QueryClient;

const elements = {
  expectAlertReading: (message: string) =>
    waitFor(() => expect(screen.getByRole("alert")).toHaveTextContent(message)),
  queryAlert: () => screen.queryByRole("alert"),
};

const actions = {
  renderAlert: () => {
    queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SyncFailureAlert />
      </QueryClientProvider>
    );
  },
  waitForStatusFetch: () =>
    vi.waitFor(() => expect(getSteamSyncStatusFn).toHaveBeenCalled()),
  startNewSync: async () => {
    vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
      makeStatus({ status: "GATHERING", failureCode: null, finishedAt: null })
    );
    await act(async () => {
      await queryClient.invalidateQueries({ queryKey: STATUS_QUERY_KEY });
    });
  },
};

describe("SyncFailureAlert", () => {
  beforeEach(() => {
    vi.mocked(getSteamSyncStatusFn).mockReset();
  });

  describe.each([
    {
      code: "PROFILE_PRIVATE",
      message:
        "We couldn't see any games on your Steam account. If you own games, open Steam → Privacy Settings, set 'Game details' to Public, and untick 'Always keep my total playtime private'. Steam can take a few minutes to apply the change — then sync again.",
    },
    {
      code: "STEAM_UNAVAILABLE",
      message: "Steam is temporarily unavailable. Please try again later.",
    },
    {
      code: "RATE_LIMITED",
      message:
        "Too many requests to Steam. Please wait a moment and try again.",
    },
    {
      code: "STALLED",
      message: "Steam sync stopped unexpectedly. Please sync again.",
    },
    {
      code: "START_FAILED",
      message: "Steam sync couldn't start. Please try again.",
    },
    { code: "UNKNOWN", message: "Steam sync failed. Please try again." },
  ] as const)(
    "given the latest sync failed with $code",
    ({ code, message }) => {
      beforeEach(() => {
        vi.mocked(getSteamSyncStatusFn).mockResolvedValue(failedWith(code));
        actions.renderAlert();
      });

      it("shows the reason in the spec's words", async () => {
        await elements.expectAlertReading(message);
      });
    }
  );

  describe("given the latest sync failed and the person starts a new one", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        failedWith("STEAM_UNAVAILABLE")
      );
      actions.renderAlert();
      await elements.expectAlertReading(
        "Steam is temporarily unavailable. Please try again later."
      );
      await actions.startNewSync();
    });

    it("takes the reason away", async () => {
      await waitFor(() => expect(elements.queryAlert()).toBeNull());
    });
  });

  describe.each([
    { situation: "no sync has ever run", status: null },
    {
      situation: "a sync is running",
      status: makeStatus({ status: "LOOKING_UP", finishedAt: null }),
    },
    {
      situation: "the latest sync finished",
      status: makeStatus({ status: "FINISHED" }),
    },
  ])("given $situation", ({ status }) => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(status);
      actions.renderAlert();
      await actions.waitForStatusFetch();
    });

    it("shows no failure reason", () => {
      expect(elements.queryAlert()).toBeNull();
    });
  });
});
