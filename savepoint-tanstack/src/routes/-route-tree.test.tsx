import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import { act, render, screen, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { routeTree } from "../routeTree.gen";

const { counts, resolves, signedInUser } = vi.hoisted(() => ({
  counts: { currentUser: 0, connections: 0, profilePage: 0 },
  resolves:
    <T,>(value: T) =>
    async () =>
      value,
  signedInUser: {
    id: "user-1",
    name: "Test User",
    username: null,
    image: null,
  },
}));

vi.mock("@env", () => ({
  env: new Proxy(
    {},
    {
      get: (_target, key) =>
        key === "LOG_LEVEL"
          ? "silent"
          : key === "NODE_ENV"
            ? "test"
            : "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_test",
    }
  ),
}));

vi.mock("@/entities/session/api/get-current-user", () => ({
  getCurrentUserFn: async () => {
    counts.currentUser += 1;
    return { user: signedInUser, statusModelNoticePending: false };
  },
}));

vi.mock("@/features/profile-overview/api", () => ({
  getPublicProfilePageDataFn: async () => {
    counts.profilePage += 1;
    return {
      profile: { id: "user-2", name: "Other", username: "other", image: null },
      stats: {},
      followerCount: 0,
      followingCount: 0,
      isFollowing: false,
      viewerId: null,
      activity: null,
      libraryItems: [],
    };
  },
}));

vi.mock("@/features/view-activity-feed/api", () => ({
  getActivityFeedFn: resolves({ items: [], nextCursor: null }),
  getActivityForUserFn: resolves({ items: [], nextCursor: null }),
}));

vi.mock("@/features/setup-profile/api/get-profile-setup-status", () => ({
  getProfileSetupStatusFn: resolves({
    needsSetup: true,
    suggestedUsername: "suggested",
  }),
}));

vi.mock("@/features/social-discovery/api", () => ({
  listConnectionsFn: async () => {
    counts.connections += 1;
    return {
      profile: { id: "user-2", name: "Other", username: "other", image: null },
      entries: [],
      total: 0,
    };
  },
}));

vi.mock("@/features/journal-timeline", () => ({
  getJournalTimelinePageDataFn: resolves([]),
  getJournalGameOptionsFn: resolves([]),
  getJournalEntryPageDataFn: resolves({
    id: "entry-1",
    title: "Entry",
    content: "Body",
  }),
}));

vi.mock("@/features/edit-journal-entry", () => ({
  EditJournalEntryForm: () => <div data-testid="edit-form" />,
}));

vi.mock("@/widgets/journal-timeline-page", () => ({
  JournalTimelinePage: () => <div data-testid="journal-list" />,
}));

vi.mock("@/widgets/journal-entry-page", () => ({
  JournalEntryPage: () => <div data-testid="journal-detail" />,
}));

vi.mock("@/widgets/profile-setup-page", () => ({
  ProfileSetupForm: () => <div data-testid="profile-setup-form" />,
}));

vi.mock("@/widgets", () => ({
  UserConnectionsPage: ({ kind }: { kind: string }) => (
    <div data-testid={`user-list-${kind}`} />
  ),
  ProfileOverview: () => <div data-testid="profile-overview" />,
  ProfileActivityTab: () => null,
}));

vi.mock("@/widgets/app-shell", () => ({
  AppShell: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));
vi.mock("@/widgets/app-sidebar", () => ({ AppSidebar: () => null }));
vi.mock("@/widgets/app-mobile-topbar", () => ({ AppMobileTopbar: () => null }));
vi.mock("@/widgets/app-bottom-nav", () => ({ AppBottomNav: () => null }));
vi.mock("@/widgets/global-action-host", () => ({
  GlobalActionHost: () => null,
  LogFormHost: () => <div data-testid="compose-form" />,
}));
vi.mock("@/features/command-palette", () => ({
  CommandPalette: () => null,
  openCommandPalette: vi.fn(),
}));
vi.mock("@/features/whats-new", () => ({ WhatsNewModal: () => null }));
vi.mock("@tanstack/react-devtools", () => ({ TanStackDevtools: () => null }));
vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtoolsPanel: () => null,
}));

const renderAt = async (path: string) => {
  const queryClient = new QueryClient();
  const router = createRouter({
    routeTree,
    history: createMemoryHistory({ initialEntries: [path] }),
    context: { queryClient },
  });
  setupRouterSsrQueryIntegration({ router, queryClient });
  await act(async () => {
    render(<RouterProvider router={router} />);
    await router.load();
  });
  return router;
};

describe("real route tree", () => {
  it.each([
    ["/journal", "journal-list"],
    ["/journal/entry-1", "journal-detail"],
    ["/journal/new", "compose-form"],
    ["/journal/entry-1/edit", "edit-form"],
    ["/u/other", "profile-overview"],
    ["/u/other/followers", "user-list-followers"],
    ["/u/other/following", "user-list-following"],
    ["/profile/setup", "profile-setup-form"],
  ])("renders %s content", async (path, testId) => {
    const router = await renderAt(path);

    await waitFor(() => expect(screen.getByTestId(testId)).toBeInTheDocument());
    expect(router.state.location.pathname).toBe(path);
  });

  it("does not render the profile page on the followers route", async () => {
    await renderAt("/u/other/followers");

    await waitFor(() =>
      expect(screen.getByTestId("user-list-followers")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("profile-overview")).not.toBeInTheDocument();
  });

  it("does not render the journal list on a journal detail route", async () => {
    await renderAt("/journal/entry-1");

    await waitFor(() =>
      expect(screen.getByTestId("journal-detail")).toBeInTheDocument()
    );
    expect(screen.queryByTestId("journal-list")).not.toBeInTheDocument();
  });

  it("redirects /profile to /profile/setup once for a user without a username", async () => {
    const router = await renderAt("/profile");

    await waitFor(() =>
      expect(screen.getByTestId("profile-setup-form")).toBeInTheDocument()
    );
    expect(router.state.location.pathname).toBe("/profile/setup");
  });

  it("resolves the session once for a followers page: one list request, no profile-page fan-out", async () => {
    counts.currentUser = 0;
    counts.connections = 0;
    counts.profilePage = 0;

    await renderAt("/u/other/followers");

    await waitFor(() =>
      expect(screen.getByTestId("user-list-followers")).toBeInTheDocument()
    );
    expect(counts.connections).toBe(1);
    expect(counts.profilePage).toBe(0);
  });

  it("does not re-resolve the session on later navigations or a blanket invalidate", async () => {
    counts.currentUser = 0;
    const router = await renderAt("/journal");
    await waitFor(() =>
      expect(screen.getByTestId("journal-list")).toBeInTheDocument()
    );

    await act(async () => {
      await router.navigate({ to: "/journal/new" });
    });
    await act(async () => {
      await router.invalidate();
    });

    expect(router.state.location.pathname).toBe("/journal/new");
    expect(counts.currentUser).toBe(1);
  });
});
