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
 *   - The FAILED variant ("Steam sync failed") is Slice 5 and not covered here.
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
});
