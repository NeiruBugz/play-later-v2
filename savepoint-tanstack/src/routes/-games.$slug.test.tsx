import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ComponentType, ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { GameDetailPageView } from "@/features/game-detail/api";
import { NotFoundError } from "@/shared/lib/errors";

import { Route } from "./games.$slug";

vi.mock("@/features/game-detail/api", () => ({
  getGameDetailPageDataFn: vi.fn(),
  getRelatedGamesForGameFn: vi.fn(),
  getTimesToBeatForGameFn: vi.fn(),
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
  RelatedGamesTabs: ({
    sections,
  }: {
    sections: ReadonlyArray<{ collectionId: number }>;
  }) => (
    <div data-testid="related-games-tabs">
      {sections.map((section) => (
        <div
          key={section.collectionId}
          data-testid={`infinite-list-${section.collectionId}`}
        />
      ))}
    </div>
  ),
  RelatedGamesSkeleton: () => <div data-testid="related-games-skeleton" />,
}));

vi.mock("@/features/game-detail/ui", () => ({
  TimesToBeatSection: ({
    timesToBeat,
  }: {
    timesToBeat: {
      mainStory: number | null;
      completionist: number | null;
    } | null;
  }) => (
    <div data-testid="times-to-beat-section">
      ms:{timesToBeat?.mainStory ?? "null"}
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
    igdbDetails: {
      id: 1234,
      name: "Celeste",
      slug: "celeste",
    },
    libraryEntry: null,
    journalTeaser: [],
    journalCount: 0,
    playtimeTotalMinutes: 0,
    playtimeSessionCount: 0,
    recentSessionMinutes: [],
    playthroughs: [],
    derivedStatus: "SHELF" as const,
    statusIsManual: false,
    hasBeenPlayed: false,
    unattachedJournalEntries: [],
  },
  viewerUserId: null,
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
  queryTimesToBeatSection: () => screen.queryByTestId("times-to-beat-section"),
  queryInfiniteList: (collectionId: number) =>
    screen.queryByTestId(`infinite-list-${collectionId}`),
  getRelatedGamesAlert: () => screen.getByText("Couldn't load related games"),
  getTimesToBeatAlert: () => screen.getByText("Couldn't load times to beat"),
};

async function arrangeSlotFns({
  relatedGames,
  timesToBeat,
}: {
  relatedGames: Promise<unknown>;
  timesToBeat: Promise<unknown>;
}) {
  const api = await import("@/features/game-detail/api");
  vi.mocked(api.getRelatedGamesForGameFn).mockReturnValue(relatedGames as any);
  vi.mocked(api.getTimesToBeatForGameFn).mockReturnValue(timesToBeat as any);
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
      await arrangeSlotFns({
        relatedGames: Promise.resolve([]),
        timesToBeat: Promise.resolve(null),
      });
      renderRoute(buildView({ viewerUserId: "user-123" }));
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
    beforeEach(async () => {
      await arrangeSlotFns({
        relatedGames: Promise.resolve([]),
        timesToBeat: Promise.resolve(null),
      });
      renderRoute(buildView({ viewerUserId: null }));
    });

    it("forwards null viewerUserId so the widget hides the journal teaser", () => {
      expect(elements.getViewerId().textContent).toBe("anon");
    });
  });

  describe("slot suspense + error states", () => {
    it("renders the related-games skeleton while the slot fetch is pending", async () => {
      await arrangeSlotFns({
        relatedGames: new Promise(() => undefined),
        timesToBeat: Promise.resolve(null),
      });
      renderRoute(buildView());

      expect(elements.queryRelatedGamesSkeleton()).not.toBeNull();
    });

    it("renders the times-to-beat skeleton while the slot fetch is pending", async () => {
      await arrangeSlotFns({
        relatedGames: Promise.resolve([]),
        timesToBeat: new Promise(() => undefined),
      });
      renderRoute(buildView());

      expect(elements.queryTimesToBeatSkeleton()).not.toBeNull();
    });

    it("renders the resolved times-to-beat section once the slot fetch settles", async () => {
      await arrangeSlotFns({
        relatedGames: Promise.resolve([]),
        timesToBeat: Promise.resolve({
          mainStory: 36000,
          completionist: 72000,
        }),
      });
      renderRoute(buildView());

      await waitFor(() => {
        expect(elements.queryTimesToBeatSection()).not.toBeNull();
      });
    });

    it("renders the resolved related-games infinite list once the slot fetch settles", async () => {
      await arrangeSlotFns({
        relatedGames: Promise.resolve([
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
        timesToBeat: Promise.resolve(null),
      });
      renderRoute(buildView());

      await waitFor(() => {
        expect(elements.queryInfiniteList(99)).not.toBeNull();
      });
    });

    it("renders an inline error alert when the related-games slot fetch rejects", async () => {
      await arrangeSlotFns({
        relatedGames: Promise.reject(new Error("upstream boom")),
        timesToBeat: Promise.resolve(null),
      });
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      renderRoute(buildView());

      await waitFor(() => {
        expect(elements.getRelatedGamesAlert()).toBeDefined();
      });

      consoleErrorSpy.mockRestore();
    });

    it("renders an inline error alert when the times-to-beat slot fetch rejects", async () => {
      await arrangeSlotFns({
        relatedGames: Promise.resolve([]),
        timesToBeat: Promise.reject(new Error("upstream boom")),
      });
      const consoleErrorSpy = vi
        .spyOn(console, "error")
        .mockImplementation(() => undefined);
      renderRoute(buildView());

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
      render(<ErrorComponent error={new NotFoundError("Game not found")} />);
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
      const { getGameDetailPageDataFn } =
        await import("@/features/game-detail/api");
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
