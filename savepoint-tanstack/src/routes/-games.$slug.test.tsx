import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { isNotFound } from "@tanstack/react-router";
import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameDetailPageView } from "@/features/game-detail/api";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./games.$slug";

vi.mock("@/features/game-detail/api", () => ({
  getGameDetailPageDataFn: vi.fn(),
}));

vi.mock("@/features/browse-related-games/api", () => ({
  getRelatedCollectionsFn: vi.fn(),
}));

vi.mock("@/widgets/game-detail", () => ({
  GameDetail: ({
    data,
    viewerUserId,
    gameSlug,
    relatedGamesSlot,
  }: {
    data: GameDetailPageView["data"];
    viewerUserId: string | null;
    gameSlug?: string;
    relatedGamesSlot?: React.ReactNode;
  }) => (
    <div data-testid="game-detail">
      <h1>{data.game.title}</h1>
      <span data-testid="viewer-user-id">{viewerUserId ?? "anon"}</span>
      <span data-testid="game-slug">{gameSlug ?? "missing"}</span>
      <span data-testid="note-count">{data.notes.length}</span>
      <span data-testid="time-to-credits">
        {data.timeToCreditsSeconds ?? "none"}
      </span>
      <span data-testid="time-to-complete">
        {data.timeToCompleteSeconds ?? "none"}
      </span>
      <div data-testid="related-games-slot">{relatedGamesSlot}</div>
    </div>
  ),
}));

vi.mock("@/features/browse-related-games", () => ({
  RelatedGamesTabs: ({
    sections,
  }: {
    sections: ReadonlyArray<{ collectionId: number }>;
  }) => (
    <div data-testid="related-games-tabs">
      {sections.map((section) => (
        <div
          key={section.collectionId}
          data-testid={`related-list-${section.collectionId}`}
        />
      ))}
    </div>
  ),
  RelatedGamesSkeleton: () => <div data-testid="related-games-skeleton" />,
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
    igdbDetails: {
      id: 1234,
      name: "Celeste",
      slug: "celeste",
    },
    libraryEntry: null,
    doneOutcome: null,
    prompts: { why: false, stayed: false },
    notes: [],
    playtimeTotalMinutes: 0,
    playtimeSessionCount: 0,
    history: [],
    timeToCreditsSeconds: 36_000,
    timeToCompleteSeconds: 90_000,
    coverTint: null,
  },
  viewerUserId: null,
  ...overrides,
});

const elements = {
  getDetail: () => screen.getByTestId("game-detail"),
  queryDetail: () => screen.queryByTestId("game-detail"),
  getViewerId: () => screen.getByTestId("viewer-user-id"),
  getGameSlug: () => screen.getByTestId("game-slug"),
  getNotFoundHeading: () =>
    screen.getByRole("heading", { name: "Game not found" }),
  getGenericErrorHeading: () =>
    screen.getByRole("heading", { name: "Something went wrong" }),
  getHomeLink: () => screen.getByRole("link", { name: "Go home" }),
  queryNotFoundHeading: () =>
    screen.queryByRole("heading", { name: "Game not found" }),
  queryRelatedGamesSkeleton: () =>
    screen.queryByTestId("related-games-skeleton"),
  getTimeToCredits: () => screen.getByTestId("time-to-credits"),
  getTimeToComplete: () => screen.getByTestId("time-to-complete"),
  queryRelatedList: (collectionId: number) =>
    screen.queryByTestId(`related-list-${collectionId}`),
  getRelatedGamesAlert: () => screen.getByText("Couldn't load related games"),
};

async function arrangeRelatedGames(relatedGames: Promise<unknown>) {
  const relatedApi = await import("@/features/browse-related-games/api");
  vi.mocked(relatedApi.getRelatedCollectionsFn).mockReturnValue(
    relatedGames as any
  );
}

function renderRoute(view: GameDetailPageView) {
  (
    Route as unknown as { useLoaderData: () => GameDetailPageView }
  ).useLoaderData = () => view;
  const Component = Route.options.component as ComponentType;
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0, staleTime: 0 } },
  });
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={client}>{children}</QueryClientProvider>
  );
  render(<Component />, { wrapper: Wrapper });
}

describe("/games/$slug route", () => {
  describe("given the loader resolves with signed-in viewer data", () => {
    beforeEach(async () => {
      await arrangeRelatedGames(Promise.resolve([]));
      renderRoute(buildView({ viewerUserId: "user-123" }));
    });

    it("renders the game detail widget with the loaded data", () => {
      expect(elements.getDetail()).toBeDefined();
      expect(screen.getByText("Celeste")).toBeDefined();
    });

    it("forwards the resolved viewerUserId to the widget", () => {
      expect(elements.getViewerId().textContent).toBe("user-123");
    });

    it("forwards the stored time to credits and time to 100% to the widget", () => {
      expect([
        elements.getTimeToCredits().textContent,
        elements.getTimeToComplete().textContent,
      ]).toEqual(["36000", "90000"]);
    });

    it("forwards the game slug to the widget so the mobile action bar CTA targets the correct game", () => {
      expect(elements.getGameSlug().textContent).toBe("celeste");
    });
  });

  describe("given the loader resolves with anonymous viewer data", () => {
    beforeEach(async () => {
      await arrangeRelatedGames(Promise.resolve([]));
      renderRoute(buildView({ viewerUserId: null }));
    });

    it("forwards null viewerUserId so the widget hides the journal teaser", () => {
      expect(elements.getViewerId().textContent).toBe("anon");
    });
  });

  describe("slot suspense + error states", () => {
    it("renders the related-games skeleton while the slot fetch is pending", async () => {
      await arrangeRelatedGames(new Promise(() => undefined));
      renderRoute(buildView());

      expect(elements.queryRelatedGamesSkeleton()).not.toBeNull();
    });

    it("renders the resolved related-games tabs once the slot fetch settles", async () => {
      await arrangeRelatedGames(
        Promise.resolve([
          {
            collectionId: 99,
            collectionName: "Test Collection",
            games: [],
          },
        ])
      );
      renderRoute(buildView());

      await waitFor(() => {
        expect(elements.queryRelatedList(99)).not.toBeNull();
      });
    });

    it("renders an inline error alert when the related-games slot fetch rejects", async () => {
      await arrangeRelatedGames(Promise.reject(new Error("upstream boom")));
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      renderRoute(buildView());

      await waitFor(() => {
        expect(elements.getRelatedGamesAlert()).toBeDefined();
      });

      consoleErrorSpy.mockRestore();
    });
  });

  describe("given the game does not exist", () => {
    it("turns the NotFoundError into the router's notFound so the response is a 404", async () => {
      const { getGameDetailPageDataFn } =
        await import("@/features/game-detail/api");
      vi.mocked(getGameDetailPageDataFn).mockRejectedValue(
        new NotFoundError("Game not found")
      );
      const loader = Route.options.loader as (args: any) => Promise<unknown>;

      const thrown = await loader({
        params: { slug: "no-such-game" },
        context: { queryClient: new QueryClient() },
      }).catch((error: unknown) => error);

      expect(isNotFound(thrown)).toBe(true);
    });

    describe("when the not-found surface renders", () => {
      beforeEach(() => {
        const NotFoundComponent = Route.options
          .notFoundComponent as ComponentType;
        render(<NotFoundComponent />);
      });

      it("renders the friendly 404 surface", () => {
        expect(elements.getNotFoundHeading()).toBeDefined();
      });

      it("renders a link back home", () => {
        expect(elements.getHomeLink()).toHaveAttribute("href", "/");
      });
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
      const { getGameDetailPageDataFn } =
        await import("@/features/game-detail/api");
      vi.mocked(getGameDetailPageDataFn).mockResolvedValue(buildView());

      const loader = Route.options.loader as (args: any) => Promise<unknown>;
      await loader({
        params: { slug: "celeste" },
        context: { queryClient: new QueryClient() },
      });

      expect(getGameDetailPageDataFn).toHaveBeenCalledWith({
        data: { slug: "celeste" },
      });
    });
  });
});

describe("/games/$slug loader prefetch", () => {
  const runLoader = async (view: GameDetailPageView) => {
    const api = await import("@/features/game-detail/api");
    vi.mocked(api.getGameDetailPageDataFn).mockResolvedValue(view);
    const relatedApi = await import("@/features/browse-related-games/api");
    vi.mocked(relatedApi.getRelatedCollectionsFn).mockResolvedValue([]);
    vi.mocked(relatedApi.getRelatedCollectionsFn).mockClear();
    const queryClient = new QueryClient();
    const loader = Route.options.loader as (args: any) => Promise<unknown>;
    const result = await loader({
      params: { slug: "celeste" },
      context: { queryClient },
    });
    return { api, relatedApi, queryClient, result };
  };

  it("returns the page data without waiting on the slot queries", async () => {
    const api = await import("@/features/game-detail/api");
    const relatedApi = await import("@/features/browse-related-games/api");
    vi.mocked(relatedApi.getRelatedCollectionsFn).mockReturnValue(
      new Promise(() => undefined) as any
    );
    vi.mocked(api.getGameDetailPageDataFn).mockResolvedValue(buildView());
    const loader = Route.options.loader as (args: any) => Promise<unknown>;
    const result = await loader({
      params: { slug: "celeste" },
      context: { queryClient: new QueryClient() },
    });
    expect(result).toEqual(buildView());
  });

  it("prefetches related-games into the query client once", async () => {
    const { relatedApi, queryClient } = await runLoader(buildView());
    await vi.waitFor(() => {
      expect(queryClient.getQueryData(["related-games", 1234])).toEqual([]);
    });
    expect(relatedApi.getRelatedCollectionsFn).toHaveBeenCalledTimes(1);
    expect(relatedApi.getRelatedCollectionsFn).toHaveBeenCalledWith({
      data: { igdbId: 1234 },
    });
  });

  it("does not start a separate times-to-beat query, the times come with the page data", async () => {
    const { queryClient, result } = await runLoader(buildView());

    expect(
      queryClient.getQueryCache().findAll({ queryKey: ["times-to-beat"] })
    ).toHaveLength(0);
    expect(result).toMatchObject({
      data: { timeToCreditsSeconds: 36_000, timeToCompleteSeconds: 90_000 },
    });
  });
});
