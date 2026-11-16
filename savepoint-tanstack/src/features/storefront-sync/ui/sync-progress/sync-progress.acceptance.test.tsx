/**
 * @spec: 030-background-storefront-import
 * @regression
 *
 * The Steam card on the account settings page shows the running sync's stage and
 * numbers, and nothing once it has ended (functional spec 2.2.1, 2.2.4). The
 * real account route, Steam card and progress are rendered; only the server fns
 * and the router are mocked, so a route that stopped mounting the progress in
 * the card would fail here.
 */
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { Route } from "@/routes/_authed/settings/account";

import { getSteamSyncStatusFn } from "../../api/get-steam-sync-status";
import type { SteamSyncStatus } from "../../model/types";

vi.mock("../../api/get-steam-sync-status", () => ({
  getSteamSyncStatusFn: vi.fn(),
}));
vi.mock("../../api/start-steam-sync", () => ({ startSteamSyncFn: vi.fn() }));
vi.mock("../../api/mark-sync-notice-seen", () => ({
  markSyncNoticeSeenFn: vi.fn(),
}));
vi.mock("@/features/steam-connect/api/disconnect-steam", () => ({
  disconnectSteamFn: vi.fn(),
}));
vi.mock("@/features/steam-connect/api/get-steam-connection", () => ({
  getSteamConnectionFn: vi.fn(),
}));
vi.mock("@/features/steam-connect/api/connect-steam", () => ({
  connectSteamFn: vi.fn(),
}));
vi.mock("@/features/auth-sign-out", () => ({
  LogoutButton: () => <button type="button">Sign out action</button>,
}));
vi.mock("@tanstack/react-router", async () => {
  const actual = await vi.importActual<any>("@tanstack/react-router");
  return {
    ...actual,
    createFileRoute: () => (opts: any) => ({
      options: opts,
      useLoaderData: () => ({
        steamId: "76561198012345678",
        connectUrl: "/api/steam/connect",
      }),
    }),
    useRouter: () => ({ invalidate: vi.fn() }),
    Link: ({ to, href, children, ...rest }: any) => (
      <a href={to ?? href} {...rest}>
        {children}
      </a>
    ),
  };
});

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

const elements = {
  getSteamCardTitle: () => screen.getByText("Steam Account Connected"),
  getDisconnectButton: () => screen.getByRole("button", { name: "Disconnect" }),
  getImportFromSteamLink: () =>
    screen.getByRole("link", { name: "Import from Steam" }),
  findFetchingStatus: () =>
    screen.findByRole("status", { name: "Fetching your Steam library…" }),
  findLookingUpStatus: () =>
    screen.findByRole("status", { name: "Looking up your games" }),
  queryAnyStatus: () => screen.queryByRole("status"),
};

function renderAccountPage() {
  const AccountPage = Route.options.component as ComponentType;
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  render(
    <QueryClientProvider client={queryClient}>
      <AccountPage />
    </QueryClientProvider>
  );
}

describe("@spec: 030-background-storefront-import @regression the Steam card on the account settings page", () => {
  beforeEach(() => {
    vi.mocked(getSteamSyncStatusFn).mockReset();
  });

  describe("given a sync has just started", () => {
    beforeEach(() => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeStatus({ status: "GATHERING" })
      );
      renderAccountPage();
    });

    it("shows 'Fetching your Steam library…' inside the connected card", async () => {
      expect(elements.getSteamCardTitle()).toBeInTheDocument();
      expect(await elements.findFetchingStatus()).toBeInTheDocument();
    });
  });

  describe("given the sync is looking up games, 340 of 1,200", () => {
    beforeEach(() => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(
        makeStatus({ status: "LOOKING_UP", totalToLookUp: 1200, lookedUp: 340 })
      );
      renderAccountPage();
    });

    it("shows the same stage and numbers as the import page", async () => {
      expect(await elements.findLookingUpStatus()).toHaveTextContent(
        "Looking up your games — 340 of 1,200"
      );
    });
  });

  describe.each([
    {
      case: "has finished",
      status: makeStatus({ status: "FINISHED", finishedAt: new Date() }),
    },
    {
      case: "has failed",
      status: makeStatus({
        status: "FAILED",
        failureCode: "RATE_LIMITED",
        finishedAt: new Date(),
      }),
    },
    { case: "never ran", status: null },
  ])("given a sync that $case", ({ status }) => {
    beforeEach(async () => {
      vi.mocked(getSteamSyncStatusFn).mockResolvedValue(status);
      renderAccountPage();
      await vi.waitFor(() => expect(getSteamSyncStatusFn).toHaveBeenCalled());
    });

    it("shows no progress", () => {
      expect(elements.queryAnyStatus()).toBeNull();
    });

    it("looks as it did before the sync: Disconnect and Import from Steam", () => {
      expect(elements.getDisconnectButton()).toBeInTheDocument();
      expect(elements.getImportFromSteamLink()).toBeInTheDocument();
    });
  });
});
