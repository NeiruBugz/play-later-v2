import { QueryClient } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { currentUserQueryOptions } from "@/entities/session/api/current-user-query";
import {
  getCurrentUserFn,
  type CurrentUser,
} from "@/entities/session/api/get-current-user";

import { Route as RootRoute, RootShell } from "./__root";
import { Route as AuthedRoute } from "./_authed";

void RootRoute;

vi.mock("@/features/done-follow-up/api/save-done-follow-up-fn", () => ({
  saveDoneFollowUpFn: vi.fn(),
}));
vi.mock("@/features/done-follow-up/api/set-done-outcome-fn", () => ({
  setDoneOutcomeFn: vi.fn(),
}));
vi.mock("@/features/library-prompts/api/answer-prompt-fn", () => ({
  answerPromptFn: vi.fn(),
}));
vi.mock("@/features/library-prompts/api/dismiss-prompt-fn", () => ({
  dismissPromptFn: vi.fn(),
}));
vi.mock("@/widgets/app-sidebar", () => ({
  AppSidebar: () => <div data-testid="app-sidebar" />,
}));

// RootShell mounts <CommandPalette/> when authed. Stub the command-palette
// barrel so its real UI (which statically chains to authed server fns →
// auth.server's module-level env read) is not loaded in this jsdom test.
vi.mock("@/features/command-palette", () => ({
  CommandPalette: () => null,
  openCommandPalette: vi.fn(),
}));

// RootShell mounts <GlobalActionHost/> when authed. Stub so its transitive
// server-fn imports (→ auth.server env reads) are not loaded in jsdom.
vi.mock("@/features/add-game", () => ({
  AddGameAction: () => null,
}));

vi.mock("@/widgets/add-flow", () => ({
  AddFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/widgets/done-flow", () => ({
  DoneFlowProvider: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
}));

vi.mock("@/widgets/global-action-host", () => ({
  GlobalActionHost: () => null,
}));

vi.mock("@/widgets/navigation-progress", () => ({
  NavigationProgress: () => null,
}));

vi.mock("@/widgets/app-shell", () => ({
  AppShell: ({
    sidebar,
    children,
  }: {
    sidebar?: React.ReactNode;
    children: React.ReactNode;
  }) => (
    <div>
      {sidebar}
      {children}
    </div>
  ),
}));

vi.mock("@/entities/session/api/get-current-user", () => ({
  getCurrentUserFn: vi.fn(),
}));

// useRouteContextMock is hoisted so the vi.mock factory can close over it,
// and individual describe blocks can reconfigure it via mockReturnValue.
const { useRouteContextMock } = vi.hoisted(() => ({
  useRouteContextMock: vi.fn(
    (): { user: CurrentUser | null; statusModelNoticePending?: boolean } => ({
      user: null,
    })
  ),
}));

vi.mock("@/features/whats-new", () => ({
  StatusModelNotice: () => <div data-testid="status-model-notice" />,
  WhatsNewModal: () => <div data-testid="whats-new-modal" />,
}));

vi.mock("@tanstack/react-router", () => ({
  createRootRouteWithContext: () => (opts: any) => ({
    options: opts,
    useRouteContext: useRouteContextMock,
  }),
  createFileRoute: () => (opts: any) => ({ options: opts }),
  Outlet: () => <div data-testid="outlet" />,
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
  // CommandPalette (mounted in RootShell when authed) calls useNavigate
  // for the "New journal entry" quick action.
  useNavigate: () => vi.fn(),
  HeadContent: () => null,
  Scripts: () => null,
}));

vi.mock("@tanstack/react-devtools", () => ({
  TanStackDevtools: () => null,
}));

vi.mock("@tanstack/react-router-devtools", () => ({
  TanStackRouterDevtoolsPanel: () => null,
}));

vi.mock("../styles.css?url", () => ({ default: "" }));

describe("_authed route", () => {
  describe("given the _authed route component is rendered", () => {
    beforeEach(() => {
      const AuthedComponent = AuthedRoute.options.component as ComponentType;
      render(<AuthedComponent />);
    });

    it("renders only the outlet — no standalone sidebar", () => {
      expect(screen.getByTestId("outlet")).toBeDefined();
      expect(screen.queryByTestId("app-sidebar")).toBeNull();
    });
  });
});

describe("__root beforeLoad", () => {
  const signedIn = {
    user: { id: "u1", name: "Ada", username: "ada", image: null },
    statusModelNoticePending: true,
  };

  const runBeforeLoad = (queryClient: QueryClient) =>
    (RootRoute.options.beforeLoad as (args: unknown) => Promise<unknown>)({
      context: { queryClient },
    });

  beforeEach(() => {
    vi.mocked(getCurrentUserFn).mockReset();
    vi.mocked(getCurrentUserFn).mockResolvedValue(signedIn);
  });

  it("puts the current user and notice flag into the route context", async () => {
    await expect(runBeforeLoad(new QueryClient())).resolves.toEqual(signedIn);
  });

  it("resolves the session once across repeated navigations", async () => {
    const queryClient = new QueryClient();

    await runBeforeLoad(queryClient);
    await runBeforeLoad(queryClient);

    expect(getCurrentUserFn).toHaveBeenCalledTimes(1);
  });

  it("re-resolves after the cached user is invalidated", async () => {
    const queryClient = new QueryClient();
    await runBeforeLoad(queryClient);

    await queryClient.invalidateQueries({
      queryKey: currentUserQueryOptions.queryKey,
    });
    await runBeforeLoad(queryClient);

    expect(getCurrentUserFn).toHaveBeenCalledTimes(2);
  });
});

describe("__root route shell", () => {
  describe("given user is not authenticated (user: null)", () => {
    beforeEach(() => {
      useRouteContextMock.mockReturnValue({ user: null });
      render(<RootShell />);
    });

    it("does not render the app sidebar", () => {
      expect(screen.queryByTestId("app-sidebar")).toBeNull();
    });
  });

  describe("given user is authenticated", () => {
    beforeEach(() => {
      useRouteContextMock.mockReturnValue({
        user: { id: "u1", name: "Ada", username: "ada", image: null },
      });
      render(<RootShell />);
    });

    it("renders the app sidebar", () => {
      expect(screen.getByTestId("app-sidebar")).toBeDefined();
    });
  });

  describe("given an authenticated user with the status notice pending", () => {
    beforeEach(() => {
      useRouteContextMock.mockReturnValue({
        user: { id: "u1", name: "Ada", username: "ada", image: null },
        statusModelNoticePending: true,
      });
      render(<RootShell />);
    });

    it("shows the status notice instead of What's New", () => {
      expect(screen.getByTestId("status-model-notice")).toBeDefined();
      expect(screen.queryByTestId("whats-new-modal")).toBeNull();
    });
  });

  describe("given an authenticated user with nothing pending", () => {
    beforeEach(() => {
      useRouteContextMock.mockReturnValue({
        user: { id: "u1", name: "Ada", username: "ada", image: null },
        statusModelNoticePending: false,
      });
      render(<RootShell />);
    });

    it("shows What's New and no status notice", () => {
      expect(screen.getByTestId("whats-new-modal")).toBeDefined();
      expect(screen.queryByTestId("status-model-notice")).toBeNull();
    });
  });
});

describe("__root head", () => {
  describe("given the document head is built", () => {
    let viewportContent: string | undefined;

    beforeEach(() => {
      const head = (RootRoute.options.head as any)();
      viewportContent = head.meta.find(
        (entry: { name?: string }) => entry.name === "viewport"
      )?.content;
    });

    it("extends the page under the notch and home indicator", () => {
      expect(viewportContent).toBe(
        "width=device-width, initial-scale=1, viewport-fit=cover"
      );
    });

    it("keeps pinch zoom available", () => {
      expect(viewportContent).not.toContain("maximum-scale");
      expect(viewportContent).not.toContain("user-scalable");
    });
  });
});
