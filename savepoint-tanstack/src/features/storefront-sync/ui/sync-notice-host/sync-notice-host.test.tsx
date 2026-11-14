/**
 * RED component test for SyncNoticeHost (spec 030 functional 2.5, tech 2.6/2.7).
 *
 * Contract:
 *   - `features/storefront-sync/ui/sync-notice-host/` exports `SyncNoticeHost`
 *     (no props, renders null). It is mounted once in RootShell for authed users.
 *   - It reads the shared status query ["storefront-sync", "status", "STEAM"]
 *     whose queryFn is `getSteamSyncStatusFn()` (`../../api/get-steam-sync-status`).
 *   - From an effect (never during render), when the latest job is FINISHED and
 *     `noticeSeen` is false, it calls, once per jobId:
 *       toast.success("Steam sync finished", {
 *         description: formatSyncSummary(status),   // "1 new game · 3 need a match"
 *         duration: Infinity,
 *         id: `steam-sync-notice-${jobId}`,
 *         action: { label: "Review games", onClick },
 *         onDismiss,
 *       })
 *   - `action.onClick` ("Review games") calls
 *     `markSyncNoticeSeenFn({ data: { jobId } })` (`../../api/mark-sync-notice-seen`)
 *     and navigates to `{ to: "/steam/games" }` (via `useRouter().navigate` or
 *     `useNavigate()`; this test supplies both).
 *   - `onDismiss` (the user closed the toast) calls
 *     `markSyncNoticeSeenFn({ data: { jobId } })` and does not navigate.
 *   - When a later poll shows the same job with `noticeSeen: true` (another tab
 *     marked it seen) it calls `toast.dismiss("steam-sync-notice-<jobId>")`.
 *   - A FINISHED job whose notice was already seen fires nothing.
 *   - Polling: one fetch on mount (staleTime 60 s), then a refetch every 20 s
 *     only while a job is active or a FINISHED notice is unseen. With nothing
 *     active and nothing unseen there is no refetchInterval.
 *
 * Slice 5 (FAILED variant), same once-per-job / dismiss / poll semantics:
 *   - When the latest job is FAILED and `noticeSeen` is false it calls, once
 *     per jobId:
 *       toast.error("Steam sync failed", {
 *         description: syncFailureMessage(failureCode),   // `../../lib/failure-copy`
 *         duration: Infinity,
 *         id: `steam-sync-notice-${jobId}`,
 *         onDismiss,
 *       })
 *     with NO action (there is nothing to review). `onDismiss` calls
 *     `markSyncNoticeSeenFn({ data: { jobId } })`.
 *   - A FAILED job whose notice was seen fires nothing; when a later poll shows
 *     the same job seen (another tab) it calls `toast.dismiss(id)`.
 *   - A FAILED notice nobody has seen yet keeps the 20 s poll going, like an
 *     unseen FINISHED one, so other tabs can close it.
 *   - It never fires "Steam sync finished" for a FAILED job.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, render } from "@testing-library/react";
import { toast } from "sonner";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getSteamSyncStatusFn } from "../../api/get-steam-sync-status";
import { markSyncNoticeSeenFn } from "../../api/mark-sync-notice-seen";
import type { SteamSyncStatus } from "../../model/types";
import { SyncNoticeHost } from "./sync-notice-host";

const { navigate, router } = vi.hoisted(() => {
  const navigateMock = vi.fn();
  return {
    navigate: navigateMock,
    router: { navigate: navigateMock, invalidate: vi.fn() },
  };
});

vi.mock("../../api/get-steam-sync-status", () => ({
  getSteamSyncStatusFn: vi.fn(),
}));

vi.mock("../../api/mark-sync-notice-seen", () => ({
  markSyncNoticeSeenFn: vi.fn(),
}));

vi.mock("sonner", () => ({
  toast: { success: vi.fn(), error: vi.fn(), dismiss: vi.fn() },
}));

vi.mock("@tanstack/react-router", () => ({
  useRouter: () => router,
  useNavigate: () => navigate,
}));

const NOTICE_POLL_INTERVAL_MS = 20_000;
const FINISHED_TITLE = "Steam sync finished";
const REVIEW_GAMES = "Review games";
const FAILED_TITLE = "Steam sync failed";
const STEAM_UNAVAILABLE_COPY =
  "Steam is temporarily unavailable. Please try again later.";
const PROFILE_PRIVATE_COPY =
  "We couldn't see any games on your Steam account. If you own games, open Steam → Privacy Settings, set 'Game details' to Public, and untick 'Always keep my total playtime private'. Steam can take a few minutes to apply the change — then sync again.";

const makeStatus = (overrides: Partial<SteamSyncStatus>): SteamSyncStatus => ({
  jobId: "job-1",
  status: "FINISHED",
  totalToLookUp: 0,
  lookedUp: 0,
  newGames: 1,
  refreshedGames: 0,
  addedToLibrary: 0,
  needsMatch: 3,
  addAllToLibrary: false,
  failureCode: null,
  finishedAt: new Date("2026-11-14T12:00:00.000Z"),
  noticeSeen: false,
  ...overrides,
});

const finishedUnseen = (jobId = "job-1") =>
  makeStatus({ jobId, status: "FINISHED", noticeSeen: false });
const finishedSeen = (jobId = "job-1") =>
  makeStatus({ jobId, status: "FINISHED", noticeSeen: true });
const failedUnseen = (
  jobId = "job-1",
  failureCode: SteamSyncStatus["failureCode"] = "STEAM_UNAVAILABLE"
) =>
  makeStatus({
    jobId,
    status: "FAILED",
    failureCode,
    noticeSeen: false,
    newGames: 0,
    needsMatch: 0,
  });
const failedSeen = (jobId = "job-1") =>
  makeStatus({
    jobId,
    status: "FAILED",
    failureCode: "STEAM_UNAVAILABLE",
    noticeSeen: true,
  });
const lookingUp = (jobId = "job-1") =>
  makeStatus({
    jobId,
    status: "LOOKING_UP",
    totalToLookUp: 1200,
    lookedUp: 340,
    finishedAt: null,
  });

type ToastOptions = NonNullable<Parameters<typeof toast.success>[1]>;
type ToastAction = { label: string; onClick: (event: unknown) => void };

const toastNoticeId = (jobId: string) => `steam-sync-notice-${jobId}`;

const elements = {
  statusFetchCount: () => vi.mocked(getSteamSyncStatusFn).mock.calls.length,
  finishedToastCalls: () =>
    vi
      .mocked(toast.success)
      .mock.calls.filter(([title]) => title === FINISHED_TITLE),
  latestFinishedToastOptions: (): ToastOptions => {
    const calls = elements.finishedToastCalls();
    const options = calls.at(-1)?.[1];
    if (!options) throw new Error("No 'Steam sync finished' toast was fired");
    return options;
  },
  failedToastCalls: () =>
    vi
      .mocked(toast.error)
      .mock.calls.filter(([title]) => title === FAILED_TITLE),
  latestFailedToastOptions: (): ToastOptions => {
    const options = elements.failedToastCalls().at(-1)?.[1];
    if (!options) throw new Error("No 'Steam sync failed' toast was fired");
    return options;
  },
  reviewGamesAction: (): ToastAction => {
    const action = elements.latestFinishedToastOptions().action;
    if (!action || typeof action !== "object" || !("onClick" in action)) {
      throw new Error("The toast has no 'Review games' action");
    }
    return action as ToastAction;
  },
  dismissedToastIds: () =>
    vi.mocked(toast.dismiss).mock.calls.map(([toastId]) => toastId),
};

const actions = {
  mountWithStatuses: async (...statuses: Array<SteamSyncStatus | null>) => {
    const fetchStatus = vi.mocked(getSteamSyncStatusFn);
    for (const status of statuses.slice(0, -1)) {
      fetchStatus.mockResolvedValueOnce(status);
    }
    fetchStatus.mockResolvedValue(statuses.at(-1) ?? null);
    const queryClient = new QueryClient({
      defaultOptions: { queries: { retry: false } },
    });
    render(
      <QueryClientProvider client={queryClient}>
        <SyncNoticeHost />
      </QueryClientProvider>
    );
    await vi.waitFor(() => expect(elements.statusFetchCount()).toBe(1));
  },
  waitForNextPoll: async () => {
    const before = elements.statusFetchCount();
    await act(async () => {
      await vi.advanceTimersByTimeAsync(NOTICE_POLL_INTERVAL_MS);
    });
    await vi.waitFor(() =>
      expect(elements.statusFetchCount()).toBeGreaterThan(before)
    );
  },
  letTimePass: (ms: number) =>
    act(async () => {
      await vi.advanceTimersByTimeAsync(ms);
    }),
  pressReviewGames: () =>
    act(async () => {
      elements.reviewGamesAction().onClick(new MouseEvent("click"));
      await Promise.resolve();
    }),
  closeToast: () =>
    act(async () => {
      elements.latestFinishedToastOptions().onDismiss?.({
        id: toastNoticeId("job-1"),
      });
      await Promise.resolve();
    }),
  closeFailedToast: (jobId = "job-1") =>
    act(async () => {
      elements.latestFailedToastOptions().onDismiss?.({
        id: toastNoticeId(jobId),
      });
      await Promise.resolve();
    }),
};

describe("SyncNoticeHost", () => {
  beforeEach(() => {
    vi.useFakeTimers({
      toFake: ["setTimeout", "clearTimeout", "setInterval", "clearInterval"],
      shouldAdvanceTime: true,
      advanceTimeDelta: 20,
    });
    vi.mocked(getSteamSyncStatusFn).mockReset();
    vi.mocked(markSyncNoticeSeenFn).mockReset();
    vi.mocked(markSyncNoticeSeenFn).mockResolvedValue(undefined);
    vi.mocked(toast.success).mockReset();
    vi.mocked(toast.error).mockReset();
    vi.mocked(toast.dismiss).mockReset();
    navigate.mockReset();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("given a sync finished while nobody was in SavePoint", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedUnseen());
      await vi.waitFor(() =>
        expect(elements.finishedToastCalls()).toHaveLength(1)
      );
    });

    it("shows 'Steam sync finished' once, with the summary and a 'Review games' action, until the user acts", () => {
      expect(toast.success).toHaveBeenCalledExactlyOnceWith(
        FINISHED_TITLE,
        expect.objectContaining({
          description: "1 new game · 3 need a match",
          duration: Infinity,
          id: toastNoticeId("job-1"),
          action: expect.objectContaining({ label: REVIEW_GAMES }),
        })
      );
    });

    it("does not fire it again on later polls of the same job", async () => {
      await actions.waitForNextPoll();
      await actions.waitForNextPoll();

      expect(elements.finishedToastCalls()).toHaveLength(1);
    });
  });

  describe("given the user presses 'Review games' on the notice", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedUnseen("job-7"));
      await vi.waitFor(() =>
        expect(elements.finishedToastCalls()).toHaveLength(1)
      );
      await actions.pressReviewGames();
    });

    it("marks that sync's notice as seen", async () => {
      await vi.waitFor(() =>
        expect(markSyncNoticeSeenFn).toHaveBeenCalledExactlyOnceWith({
          data: { jobId: "job-7" },
        })
      );
    });

    it("opens the import page", async () => {
      await vi.waitFor(() =>
        expect(navigate).toHaveBeenCalledExactlyOnceWith({
          to: "/steam/games",
        })
      );
    });
  });

  describe("given the user closes the notice", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedUnseen("job-7"));
      await vi.waitFor(() =>
        expect(elements.finishedToastCalls()).toHaveLength(1)
      );
      await actions.closeToast();
    });

    it("marks that sync's notice as seen", async () => {
      await vi.waitFor(() =>
        expect(markSyncNoticeSeenFn).toHaveBeenCalledExactlyOnceWith({
          data: { jobId: "job-7" },
        })
      );
    });

    it("stays on the current page", () => {
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe("given a sync whose notice the user has already seen", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedSeen());
      await actions.letTimePass(NOTICE_POLL_INTERVAL_MS);
    });

    it("shows no notice", () => {
      expect(toast.success).not.toHaveBeenCalled();
    });
  });

  describe("given a sync is running when the user opens SavePoint", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(lookingUp(), finishedUnseen());
    });

    it("shows no notice while the sync is still running", () => {
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("keeps checking, and shows the notice once the sync finishes", async () => {
      await actions.waitForNextPoll();

      await vi.waitFor(() =>
        expect(toast.success).toHaveBeenCalledExactlyOnceWith(
          FINISHED_TITLE,
          expect.objectContaining({ id: toastNoticeId("job-1") })
        )
      );
    });
  });

  describe("given the notice is showing and another tab marks it seen", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedUnseen(), finishedSeen());
      await vi.waitFor(() =>
        expect(elements.finishedToastCalls()).toHaveLength(1)
      );
      await actions.waitForNextPoll();
    });

    it("closes this tab's notice for that sync", async () => {
      await vi.waitFor(() =>
        expect(elements.dismissedToastIds()).toContain(toastNoticeId("job-1"))
      );
    });

    it("does not show it again", () => {
      expect(elements.finishedToastCalls()).toHaveLength(1);
    });
  });

  describe("given a second sync finishes after the first one's notice", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(
        finishedUnseen("job-1"),
        finishedUnseen("job-2")
      );
      await vi.waitFor(() =>
        expect(elements.finishedToastCalls()).toHaveLength(1)
      );
      await actions.waitForNextPoll();
      await vi.waitFor(() =>
        expect(elements.finishedToastCalls()).toHaveLength(2)
      );
    });

    it("shows one notice per sync, each with its own id", () => {
      expect(
        elements.finishedToastCalls().map(([, options]) => options?.id)
      ).toEqual([toastNoticeId("job-1"), toastNoticeId("job-2")]);
    });
  });

  describe("given the user has never synced", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(null);
      await actions.letTimePass(2 * NOTICE_POLL_INTERVAL_MS);
    });

    it("shows no notice", () => {
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("does not poll", () => {
      expect(elements.statusFetchCount()).toBe(1);
    });
  });

  describe("given the latest sync finished and its notice was seen", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedSeen());
      await actions.letTimePass(3 * NOTICE_POLL_INTERVAL_MS);
    });

    it("fetched the status once on mount and has not polled since", () => {
      expect(elements.statusFetchCount()).toBe(1);
    });
  });

  describe("given a sync is running", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(lookingUp());
    });

    it("polls every 20 seconds", async () => {
      await actions.waitForNextPoll();
      await actions.waitForNextPoll();

      expect(elements.statusFetchCount()).toBeGreaterThanOrEqual(3);
    });
  });

  describe("given a finished sync whose notice nobody has seen yet", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(finishedUnseen());
    });

    it("keeps polling every 20 seconds so other tabs can close it", async () => {
      await actions.waitForNextPoll();
      await actions.waitForNextPoll();

      expect(elements.statusFetchCount()).toBeGreaterThanOrEqual(3);
    });
  });
  describe("given a sync failed while nobody was in SavePoint", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(
        failedUnseen("job-1", "STEAM_UNAVAILABLE")
      );
      await vi.waitFor(() =>
        expect(elements.failedToastCalls()).toHaveLength(1)
      );
    });

    it("shows 'Steam sync failed' once, with the reason, until the user closes it", () => {
      expect(toast.error).toHaveBeenCalledExactlyOnceWith(
        FAILED_TITLE,
        expect.objectContaining({
          description: STEAM_UNAVAILABLE_COPY,
          duration: Infinity,
          id: toastNoticeId("job-1"),
        })
      );
    });

    it("offers no 'Review games' action", () => {
      expect(elements.latestFailedToastOptions().action).toBeUndefined();
    });

    it("does not announce it as a finished sync", () => {
      expect(toast.success).not.toHaveBeenCalled();
    });

    it("does not fire it again on later polls of the same job", async () => {
      await actions.waitForNextPoll();
      await actions.waitForNextPoll();

      expect(elements.failedToastCalls()).toHaveLength(1);
    });
  });

  describe("given the sync failed because the Steam profile is private", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(failedUnseen("job-1", "PROFILE_PRIVATE"));
      await vi.waitFor(() =>
        expect(elements.failedToastCalls()).toHaveLength(1)
      );
    });

    it("explains the Steam privacy settings in the notice", () => {
      expect(elements.latestFailedToastOptions().description).toBe(
        PROFILE_PRIVATE_COPY
      );
    });
  });

  describe("given the user closes the failure notice", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(failedUnseen("job-7"));
      await vi.waitFor(() =>
        expect(elements.failedToastCalls()).toHaveLength(1)
      );
      await actions.closeFailedToast("job-7");
    });

    it("marks that sync's notice as seen", async () => {
      await vi.waitFor(() =>
        expect(markSyncNoticeSeenFn).toHaveBeenCalledExactlyOnceWith({
          data: { jobId: "job-7" },
        })
      );
    });

    it("stays on the current page", () => {
      expect(navigate).not.toHaveBeenCalled();
    });
  });

  describe("given a failed sync whose notice the user has already seen", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(failedSeen());
      await actions.letTimePass(NOTICE_POLL_INTERVAL_MS);
    });

    it("shows no notice", () => {
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("fetched the status once on mount and has not polled since", () => {
      expect(elements.statusFetchCount()).toBe(1);
    });
  });

  describe("given the failure notice is showing and another tab marks it seen", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(failedUnseen(), failedSeen());
      await vi.waitFor(() =>
        expect(elements.failedToastCalls()).toHaveLength(1)
      );
      await actions.waitForNextPoll();
    });

    it("closes this tab's notice for that sync", async () => {
      await vi.waitFor(() =>
        expect(elements.dismissedToastIds()).toContain(toastNoticeId("job-1"))
      );
    });

    it("does not show it again", () => {
      expect(elements.failedToastCalls()).toHaveLength(1);
    });
  });

  describe("given a failed sync whose notice nobody has seen yet", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(failedUnseen());
    });

    it("keeps polling every 20 seconds so other tabs can close it", async () => {
      await actions.waitForNextPoll();
      await actions.waitForNextPoll();

      expect(elements.statusFetchCount()).toBeGreaterThanOrEqual(3);
    });
  });

  describe("given a sync is running and then fails", () => {
    beforeEach(async () => {
      await actions.mountWithStatuses(lookingUp(), failedUnseen());
    });

    it("shows no notice while the sync is still running", () => {
      expect(toast.error).not.toHaveBeenCalled();
    });

    it("shows the failure notice once the failure is polled", async () => {
      await actions.waitForNextPoll();

      await vi.waitFor(() =>
        expect(toast.error).toHaveBeenCalledExactlyOnceWith(
          FAILED_TITLE,
          expect.objectContaining({ id: toastNoticeId("job-1") })
        )
      );
    });
  });
});
