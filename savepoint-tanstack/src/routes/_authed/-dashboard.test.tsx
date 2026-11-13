import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { refreshReleaseDatesFn } from "@/features/release-dates/api/refresh-release-dates";

import { Route } from "./dashboard";

type RouteHooks = { useLoaderData: ReturnType<typeof vi.fn> };

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
  }),
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/dashboard", () => ({
  getDashboardPageDataFn: vi.fn(),
}));

vi.mock("@/features/release-dates/api/refresh-release-dates", () => ({
  refreshReleaseDatesFn: vi.fn(),
}));

vi.mock("@/widgets/dashboard-page", () => ({
  DashboardPage: () => <div data-testid="dashboard-page" />,
}));

const refreshMock = refreshReleaseDatesFn as unknown as ReturnType<
  typeof vi.fn
>;

const elements = {
  getDashboardPage: () => screen.getByTestId("dashboard-page"),
};

const actions = {
  openHome: () => {
    const HomeRoute = Route.options.component as ComponentType;
    return render(<HomeRoute />);
  },
  letPendingWorkSettle: () => new Promise((resolve) => setTimeout(resolve, 10)),
};

describe("/dashboard route component", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    (Route as unknown as RouteHooks).useLoaderData.mockReturnValue({});
  });

  describe("given Home opens and the refresh succeeds", () => {
    let view: ReturnType<typeof actions.openHome>;

    beforeEach(async () => {
      refreshMock.mockResolvedValue({ checked: 1, updated: 1 });
      view = actions.openHome();
      await actions.letPendingWorkSettle();
    });

    it("shows Home", () => {
      expect(elements.getDashboardPage()).toBeDefined();
    });

    it("asks for a release date refresh once", () => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });

    describe("when Home re-renders", () => {
      beforeEach(async () => {
        const HomeRoute = Route.options.component as ComponentType;
        view.rerender(<HomeRoute />);
        await actions.letPendingWorkSettle();
      });

      it("does not ask again", () => {
        expect(refreshMock).toHaveBeenCalledTimes(1);
      });
    });
  });

  describe("given Home opens and the refresh fails", () => {
    beforeEach(async () => {
      refreshMock.mockRejectedValue(new Error("catalogue unavailable"));
      actions.openHome();
      await actions.letPendingWorkSettle();
    });

    it("still shows Home, with no error", () => {
      expect(elements.getDashboardPage()).toBeDefined();
    });
  });
});
