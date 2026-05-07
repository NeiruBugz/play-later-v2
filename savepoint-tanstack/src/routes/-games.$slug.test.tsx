import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameDetailPageView } from "@/features/game-detail/api";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./games.$slug";

vi.mock("@/features/game-detail/api", () => ({
  getGameDetailPageDataFn: vi.fn(),
}));

vi.mock("@/widgets/game-detail", () => ({
  GameDetail: ({
    data,
    viewerUserId,
    relatedGamesSlot,
    timesToBeatSlot,
  }: {
    data: GameDetailPageView["data"];
    viewerUserId: string | null;
    relatedGamesSlot?: React.ReactNode;
    timesToBeatSlot?: React.ReactNode;
  }) => (
    <div data-testid="game-detail">
      <h1>{data.game.title}</h1>
      <span data-testid="viewer-user-id">{viewerUserId ?? "anon"}</span>
      <span data-testid="journal-count">{data.journalTeaser.length}</span>
      <div data-testid="related-games-slot">{relatedGamesSlot}</div>
      <div data-testid="times-to-beat-slot">{timesToBeatSlot}</div>
    </div>
  ),
}));

vi.mock("@/features/browse-related-games", () => ({
  RelatedGamesInfiniteList: ({
    collectionId,
  }: {
    collectionId: number;
  }) => <div data-testid={`infinite-list-${collectionId}`} />,
  RelatedGamesSkeleton: () => <div data-testid="related-games-skeleton" />,
}));

vi.mock("@/features/game-detail/ui", () => ({
  TimesToBeatSection: ({
    timesToBeat,
  }: {
    timesToBeat: { mainStory: number | null; completionist: number | null };
  }) => (
    <div data-testid="times-to-beat-section">
      ms:{timesToBeat.mainStory ?? "null"}
    </div>
  ),
  TimesToBeatSkeleton: () => <div data-testid="times-to-beat-skeleton" />,
}));

vi.mock("@tanstack/react-router", async () => ({
  ...(await vi.importActual<any>("@tanstack/react-router")),
  createFileRoute: () => (opts: any) => ({
    options: opts,
    useLoaderData: vi.fn(),
  }),
  Link: ({ to, href, children, ...rest }: any) => (
    <a href={to ?? href} {...rest}>
      {children}
    </a>
  ),
}));

const buildView = (
  overrides: Partial<GameDetailPageView> = {}
): GameDetailPageView => ({
  data: {
    game: {
      id: "g1",
      igdbId: 1234,
      slug: "celeste",
      title: "Celeste",
      coverImage: null,
      releaseDate: null,
      description: null,
    } as unknown as GameDetailPageView["data"]["game"],
    relatedGames: [],
    libraryEntry: null,
    journalTeaser: [],
  },
  viewerUserId: null,
  deferredRelatedGames: Promise.resolve([]),
  deferredTimesToBeat: Promise.resolve(null),
  ...overrides,
});

const elements = {
  getDetail: () => screen.getByTestId("game-detail"),
  queryDetail: () => screen.queryByTestId("game-detail"),
  getViewerId: () => screen.getByTestId("viewer-user-id"),
  getNotFoundHeading: () =>
    screen.getByRole("heading", { name: "Game not found" }),
  getGenericErrorHeading: () =>
    screen.getByRole("heading", { name: "Something went wrong" }),
  getHomeLink: () => screen.getByRole("link", { name: "Go home" }),
  queryNotFoundHeading: () =>
    screen.queryByRole("heading", { name: "Game not found" }),
  queryRelatedGamesSkeleton: () =>
    screen.queryByTestId("related-games-skeleton"),
  queryTimesToBeatSkeleton: () =>
    screen.queryByTestId("times-to-beat-skeleton"),
  queryTimesToBeatSection: () =>
    screen.queryByTestId("times-to-beat-section"),
  queryInfiniteList: (collectionId: number) =>
    screen.queryByTestId(`infinite-list-${collectionId}`),
  getRelatedGamesAlert: () =>
    screen.getByText("Couldn't load related games"),
  getTimesToBeatAlert: () =>
    screen.getByText("Couldn't load times to beat"),
};

describe("/games/$slug route", () => {
  describe("given the loader resolves with signed-in viewer data", () => {
    const view = buildView({ viewerUserId: "user-123" });

    beforeEach(() => {
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("renders the game detail widget with the loaded data", () => {
      expect(elements.getDetail()).toBeDefined();
      expect(screen.getByText("Celeste")).toBeDefined();
    });

    it("forwards the resolved viewerUserId to the widget", () => {
      expect(elements.getViewerId().textContent).toBe("user-123");
    });
  });

  describe("given the loader resolves with anonymous viewer data", () => {
    const view = buildView({ viewerUserId: null });

    beforeEach(() => {
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);
    });

    it("forwards null viewerUserId so the widget hides the journal teaser", () => {
      expect(elements.getViewerId().textContent).toBe("anon");
    });
  });

  describe("phase-2 streaming sections", () => {
    it("renders the related-games skeleton while the deferred promise is pending", () => {
      const view = buildView({
        deferredRelatedGames: new Promise(() => {
          /* never resolves */
        }),
      });
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);

      expect(elements.queryRelatedGamesSkeleton()).not.toBeNull();
    });

    it("renders the times-to-beat skeleton while the deferred promise is pending", () => {
      const view = buildView({
        deferredTimesToBeat: new Promise(() => {
          /* never resolves */
        }),
      });
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);

      expect(elements.queryTimesToBeatSkeleton()).not.toBeNull();
    });

    it("renders the resolved times-to-beat section after the deferred promise resolves", async () => {
      const view = buildView({
        deferredTimesToBeat: Promise.resolve({
          mainStory: 36000,
          completionist: 72000,
        }),
      });
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);

      await waitFor(() => {
        expect(elements.queryTimesToBeatSection()).not.toBeNull();
      });
    });

    it("renders the resolved related-games infinite list after the deferred promise resolves", async () => {
      const view = buildView({
        deferredRelatedGames: Promise.resolve([
          {
            collectionId: 99,
            collectionName: "Test Collection",
            pageSize: 20,
            firstPage: {
              games: [],
              total: 0,
              page: 1,
              pageSize: 20,
              hasMore: false,
            },
          },
        ]),
      });
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      render(<Component />);

      await waitFor(() => {
        expect(elements.queryInfiniteList(99)).not.toBeNull();
      });
    });

    it("renders an inline error alert when the related-games promise rejects", async () => {
      const view = buildView({
        deferredRelatedGames: Promise.reject(new Error("upstream boom")),
      });
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      // Suppress React's expected error log for the rejected promise.
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      render(<Component />);

      await waitFor(() => {
        expect(elements.getRelatedGamesAlert()).toBeDefined();
      });

      consoleErrorSpy.mockRestore();
    });

    it("renders an inline error alert when the times-to-beat promise rejects", async () => {
      const view = buildView({
        deferredTimesToBeat: Promise.reject(new Error("upstream boom")),
      });
      (Route as unknown as { useLoaderData: () => GameDetailPageView }).useLoaderData =
        () => view;
      const Component = Route.options.component as ComponentType;
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      render(<Component />);

      await waitFor(() => {
        expect(elements.getTimesToBeatAlert()).toBeDefined();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("given the loader throws NotFoundError", () => {
    beforeEach(() => {
      const ErrorComponent = Route.options.errorComponent as ComponentType<{
        error: Error;
      }>;
      render(
        <ErrorComponent error={new NotFoundError("Game not found")} />
      );
    });

    it("renders the friendly 404 surface", () => {
      expect(elements.getNotFoundHeading()).toBeDefined();
    });

    it("renders a link back home", () => {
      expect(elements.getHomeLink()).toHaveAttribute("href", "/");
    });
  });

  describe("given the loader throws a non-NotFound error", () => {
    beforeEach(() => {
      const ErrorComponent = Route.options.errorComponent as ComponentType<{
        error: Error;
      }>;
      render(<ErrorComponent error={new Error("boom")} />);
    });

    it("renders the generic error surface", () => {
      expect(elements.getGenericErrorHeading()).toBeDefined();
    });

    it("does not render the 404 heading", () => {
      expect(elements.queryNotFoundHeading()).toBeNull();
    });
  });

  describe("loader wiring", () => {
    it("calls getGameDetailPageDataFn with the slug from params", async () => {
      const { getGameDetailPageDataFn } = await import(
        "@/features/game-detail/api"
      );
      vi.mocked(getGameDetailPageDataFn).mockResolvedValue(buildView());

      const loader = Route.options.loader as (args: {
        params: { slug: string };
      }) => Promise<unknown>;
      await loader({ params: { slug: "celeste" } });

      expect(getGameDetailPageDataFn).toHaveBeenCalledWith({
        data: { slug: "celeste" },
      });
    });
  });
});
