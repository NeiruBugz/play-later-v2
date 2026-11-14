/**
 * RED component test for SyncProgress (spec 030 tech 2.7).
 *
 * Contract:
 *   - `features/storefront-sync/ui/sync-progress/` exports `SyncProgress` with
 *     props `{ variant: "page" | "card" }` (and `SyncProgressProps`).
 *   - Reads the shared status query ["storefront-sync", "status", "STEAM"] whose
 *     queryFn is `getSteamSyncStatusFn()` from `../../api/get-steam-sync-status`.
 *   - While a job is GATHERING it renders a `role="status"` region reading
 *     "Fetching your Steam library…"; with no active job it renders nothing.
 *   - While a job is LOOKING_UP (totalToLookUp > 0) the region's accessible
 *     name is "Looking up your games" (the live region announces the stage
 *     only) and its visible text is "Looking up your games — {lookedUp} of
 *     {total}", where the count "{lookedUp} of {total}" sits in its own
 *     `aria-hidden` span, numbers formatted with toLocaleString("en-US").
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { getSteamSyncStatusFn } from "../../api/get-steam-sync-status";
import type { SteamSyncStatus } from "../../model/types";
import { SyncProgress } from "./sync-progress";

vi.mock("../../api/get-steam-sync-status", () => ({
  getSteamSyncStatusFn: vi.fn(),
}));

const makeStatus = (overrides: Partial<SteamSyncStatus>): SteamSyncStatus => ({
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

const renderProgress = (variant: "page" | "card") => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <SyncProgress variant={variant} />
    </QueryClientProvider>
  );
};

const elements = {
  findFetchingStatus: () =>
    screen.findByRole("status", { name: "Fetching your Steam library…" }),
  queryStatus: () => screen.queryByRole("status"),
  findLookingUpStatus: () =>
    screen.findByRole("status", { name: "Looking up your games" }),
  findCount: (count: string, timeout = 1000) =>
    screen.findByText(count, undefined, { timeout }),
  queryCount: (count: string) => screen.queryByText(count),
};

describe("SyncProgress", () => {
  beforeEach(() => {
    vi.mocked(getSteamSyncStatusFn).mockReset();
  });

  describe.each(["page", "card"] as const)(
    "given the %s variant and a sync that is gathering the Steam library",
    (variant) => {
      beforeEach(() => {
        vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
          makeStatus({ status: "GATHERING" })
        );
        renderProgress(variant);
      });

      it("tells the user the Steam library is being fetched", async () => {
        expect(await elements.findFetchingStatus()).toBeInTheDocument();
      });
    }
  );

  describe("given no sync has ever run", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(null);
      renderProgress("page");
      await vi.waitFor(() => expect(getSteamSyncStatusFn).toHaveBeenCalled());
    });

    it("shows nothing", () => {
      expect(elements.queryStatus()).toBeNull();
    });
  });

  describe("given the latest sync has finished", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeStatus({ status: "FINISHED", finishedAt: new Date() })
      );
      renderProgress("card");
      await vi.waitFor(() => expect(getSteamSyncStatusFn).toHaveBeenCalled());
    });

    it("shows nothing", () => {
      expect(elements.queryStatus()).toBeNull();
    });
  });
  describe.each(["page", "card"] as const)(
    "given the %s variant and a sync that is looking up 340 of 1,200 games",
    (variant) => {
      beforeEach(() => {
        vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
          makeStatus({
            status: "LOOKING_UP",
            totalToLookUp: 1200,
            lookedUp: 340,
          })
        );
        renderProgress(variant);
      });

      it("announces the stage without the changing numbers", async () => {
        expect(await elements.findLookingUpStatus()).toBeInTheDocument();
      });

      it("shows how far the lookup has got, with thousands separated", async () => {
        expect(await elements.findCount("340 of 1,200")).toBeInTheDocument();
      });
    }
  );

  describe("given the lookup moves on between two polls", () => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn)
        .mockResolvedValueOnce(
          makeStatus({
            status: "LOOKING_UP",
            totalToLookUp: 1200,
            lookedUp: 340,
          })
        )
        .mockResolvedValue(
          makeStatus({
            status: "LOOKING_UP",
            totalToLookUp: 1200,
            lookedUp: 800,
          })
        );
      renderProgress("page");
      await elements.findCount("340 of 1,200");
    });

    it("updates the count without a reload", async () => {
      expect(
        await elements.findCount("800 of 1,200", 5000)
      ).toBeInTheDocument();
      expect(elements.queryCount("340 of 1,200")).toBeNull();
    }, 8000);
  });
});
