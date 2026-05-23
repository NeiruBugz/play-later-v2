import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { CurrentUser } from "@/entities/session/api/get-current-user";

import { Route as RootRoute, RootShell } from "./__root";
import { Route as AuthedRoute } from "./_authed";

void RootRoute;

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

vi.mock("@/entities/session/api/require-user-id-or-redirect", () => ({
  requireUserIdOrRedirectFn: vi
    .fn()
    .mockResolvedValue({ userId: "user-stub-1" }),
}));

vi.mock("@/entities/session/api", () => ({
  getCurrentUserFn: vi.fn().mockResolvedValue({ user: null }),
}));

// useLoaderDataMock is hoisted so the vi.mock factory can close over it,
// and individual describe blocks can reconfigure it via mockReturnValue.
const { useLoaderDataMock } = vi.hoisted(() => ({
  useLoaderDataMock: vi.fn((): { user: CurrentUser | null } => ({
    user: null,
  })),
}));

vi.mock("@tanstack/react-router", () => ({
  createRootRoute: (opts: any) => ({
    options: opts,
    useLoaderData: useLoaderDataMock,
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

// CSS import stub
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

describe("__root route shell", () => {
  describe("given user is not authenticated (user: null)", () => {
    beforeEach(() => {
      useLoaderDataMock.mockReturnValue({ user: null });
      render(<RootShell />);
    });

    it("does not render the app sidebar", () => {
      expect(screen.queryByTestId("app-sidebar")).toBeNull();
    });
  });

  describe("given user is authenticated", () => {
    beforeEach(() => {
      useLoaderDataMock.mockReturnValue({
        user: { id: "u1", name: "Ada", username: "ada", image: null },
      });
      render(<RootShell />);
    });

    it("renders the app sidebar", () => {
      expect(screen.getByTestId("app-sidebar")).toBeDefined();
    });
  });
});
