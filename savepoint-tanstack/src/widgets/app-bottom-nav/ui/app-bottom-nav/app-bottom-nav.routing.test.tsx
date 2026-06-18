import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  redirect,
  RouterProvider,
} from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { z } from "zod";

import { AppBottomNav } from "./app-bottom-nav";

/**
 * Regression test for the "global Log does nothing" bug: the Log trigger sets a
 * root-level `?action=log-session` search param while staying on the current
 * page. The earlier component test mocked `useNavigate`, so it never exercised
 * the real navigate→URL round trip — and the real bug was that `from: "/"` with
 * no `to` resolved to the index route `/`, whose `beforeLoad` redirects authed
 * users to `/dashboard` and drops the inbound search param. This test drives a
 * real router (with that redirecting index route) so the param must survive.
 */
function makeRouterAt(initialPath: string) {
  const rootRoute = createRootRoute({
    validateSearch: z.object({
      action: z.enum(["log-session", "add-game"]).optional(),
      game: z.string().min(1).optional(),
    }),
  });

  const indexRoute = createRoute({
    getParentRoute: () => rootRoute,
    path: "/",
    beforeLoad: () => {
      throw redirect({ to: "/dashboard" });
    },
    component: () => null,
  });

  const navTargets = [
    "/dashboard",
    "/library",
    "/journal",
    "/profile",
  ] as const;
  const stubRoutes = navTargets.map((path) =>
    createRoute({
      getParentRoute: () => rootRoute,
      path,
      component: () => <AppBottomNav />,
    })
  );

  return createRouter({
    routeTree: rootRoute.addChildren([indexRoute, ...stubRoutes]),
    history: createMemoryHistory({ initialEntries: [initialPath] }),
  });
}

const elements = {
  getLogButton: () => screen.getByRole("button", { name: "Log a session" }),
};

describe("AppBottomNav routing (real router)", () => {
  describe("given the user is on /dashboard and taps Log", () => {
    it("sets action=log-session while staying on /dashboard", async () => {
      const router = makeRouterAt("/dashboard");
      render(<RouterProvider router={router} />);

      await waitFor(() => elements.getLogButton());
      await userEvent.click(elements.getLogButton());

      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/dashboard");
        expect(router.state.location.search).toMatchObject({
          action: "log-session",
        });
      });
    });
  });

  describe("given the user is on /library and taps Log", () => {
    it("sets action=log-session without bouncing to the dashboard", async () => {
      const router = makeRouterAt("/library");
      render(<RouterProvider router={router} />);

      await waitFor(() => elements.getLogButton());
      await userEvent.click(elements.getLogButton());

      await waitFor(() => {
        expect(router.state.location.pathname).toBe("/library");
        expect(router.state.location.search).toMatchObject({
          action: "log-session",
        });
      });
    });
  });
});
