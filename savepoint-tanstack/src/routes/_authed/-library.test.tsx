import { render, screen } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { refreshReleaseDatesFn } from "@/features/release-dates/api/refresh-release-dates";

import { Route } from "./library";

type RouteHooks = {
  useLoaderData: ReturnType<typeof vi.fn>;
  useSearch: ReturnType<typeof vi.fn>;
};

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
    useSearch: vi.fn(),
  }),
  useRouter: () => ({ invalidate: vi.fn() }),
}));

vi.mock("@/features/library-list", () => ({
  getLibraryPageDataFn: vi.fn(),
}));

vi.mock("@/features/release-dates/api/refresh-release-dates", () => ({
  refreshReleaseDatesFn: vi.fn(),
}));

vi.mock("@/widgets/library-page", () => ({
  LibraryPage: () => <div data-testid="library-page" />,
}));

const refreshMock = refreshReleaseDatesFn as unknown as ReturnType<
  typeof vi.fn
>;

const elements = {
  getLibraryPage: () => screen.getByTestId("library-page"),
};

const actions = {
  openLibrary: () => {
    const LibraryRoute = Route.options.component as ComponentType;
    return render(<LibraryRoute />);
  },
  letPendingWorkSettle: () => new Promise((resolve) => setTimeout(resolve, 10)),
};

describe("/library route component", () => {
  beforeEach(() => {
    refreshMock.mockReset();
    const route = Route as unknown as RouteHooks;
    route.useLoaderData.mockReturnValue({
      items: [],
      total: 0,
      platforms: [],
      statusCounts: { WANT: 0, PLAYING: 0, DONE: 0 },
      onboarding: { journalEntryCount: 0, image: null, steamId64: null },
    });
    route.useSearch.mockReturnValue({});
  });

  describe("given the library opens and the refresh succeeds", () => {
    beforeEach(async () => {
      refreshMock.mockResolvedValue({ checked: 1, updated: 1 });
      actions.openLibrary();
      await actions.letPendingWorkSettle();
    });

    it("shows the library", () => {
      expect(elements.getLibraryPage()).toBeDefined();
    });

    it("asks for a release date refresh once", () => {
      expect(refreshMock).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the library opens and the refresh fails", () => {
    beforeEach(async () => {
      refreshMock.mockRejectedValue(new Error("catalogue unavailable"));
      actions.openLibrary();
      await actions.letPendingWorkSettle();
    });

    it("still shows the library, with no error", () => {
      expect(elements.getLibraryPage()).toBeDefined();
    });
  });
});
