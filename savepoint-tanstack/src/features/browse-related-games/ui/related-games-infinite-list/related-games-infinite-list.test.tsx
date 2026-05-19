import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// RED import — module does not exist until the GREEN step.
// Module-not-found IS the expected failure mode.
import { RelatedGamesInfiniteList } from "@/features/browse-related-games/ui/related-games-infinite-list";

// Foot-gun #8: mock the server fn wrapper (createServerFn returns undefined without the Vite plugin).
const mockGetRelatedGamesFn = vi.fn();
vi.mock("@/features/browse-related-games/api/get-related-games", () => ({
  getRelatedGamesFn: (...args: unknown[]) => mockGetRelatedGamesFn(...args),
}));

vi.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    href,
    params,
    children,
    ...rest
  }: {
    to?: string;
    href?: string;
    params?: Record<string, string>;
    children: React.ReactNode;
  } & Record<string, unknown>) => {
    let resolvedHref = to ?? href ?? "";
    if (params && to) {
      for (const [key, value] of Object.entries(params)) {
        resolvedHref = resolvedHref.replace(`$${key}`, value);
      }
    }
    return (
      <a href={resolvedHref} {...rest}>
        {children}
      </a>
    );
  },
}));

// IntersectionObserver mock: captures the callback so tests can fire entries
// synchronously via capturedCallback([{ isIntersecting: true }]) — no real viewport.
type IntersectionCallback = (
  entries: Partial<IntersectionObserverEntry>[]
) => void;

let capturedCallback: IntersectionCallback | null = null;

class MockIntersectionObserver {
  constructor(callback: IntersectionCallback) {
    capturedCallback = callback;
  }
  observe() {}
  unobserve() {}
  disconnect() {}
}

type RelatedGame = {
  igdbId: number;
  slug: string;
  title: string;
  coverImageId: string | null;
};

function makeGame(index: number): RelatedGame {
  return {
    igdbId: 10000 + index,
    slug: `related-game-${index + 1}`,
    title: `Related Game ${index + 1}`,
    coverImageId: `cover_${index + 1}`,
  };
}

const COLLECTION_ID = 42;
const PAGE_SIZE = 4;

const PAGE_1_GAMES: RelatedGame[] = [
  makeGame(0),
  makeGame(1),
  makeGame(2),
  makeGame(3),
];
const PAGE_2_GAMES: RelatedGame[] = [
  makeGame(4),
  makeGame(5),
  makeGame(6),
  makeGame(7),
];

const FIRST_PAGE_WITH_MORE = {
  games: PAGE_1_GAMES,
  total: 8,
  page: 1,
  pageSize: PAGE_SIZE,
  hasMore: true,
};

const FIRST_PAGE_NO_MORE = {
  games: PAGE_1_GAMES,
  total: 4,
  page: 1,
  pageSize: PAGE_SIZE,
  hasMore: false,
};

const PAGE_2_RESPONSE = {
  games: PAGE_2_GAMES,
  total: 8,
  page: 2,
  pageSize: PAGE_SIZE,
  hasMore: false,
};

const elements = {
  getGameByName: (name: string) =>
    screen.getByRole("img", { name: `Cover for ${name}` }),
  queryGameByName: (name: string) =>
    screen.queryByRole("img", { name: `Cover for ${name}` }),
  getSentinel: () => screen.getByTestId("related-games-sentinel"),
  querySentinel: () => screen.queryByTestId("related-games-sentinel"),
  getErrorAlert: () => screen.getByRole("alert"),
  queryErrorAlert: () => screen.queryByRole("alert"),
};

const actions = {
  triggerSentinelIntersection: () => {
    act(() => {
      capturedCallback?.([{ isIntersecting: true }]);
    });
  },
  triggerSentinelExit: () => {
    act(() => {
      capturedCallback?.([{ isIntersecting: false }]);
    });
  },
};

describe("RelatedGamesInfiniteList", () => {
  beforeEach(() => {
    capturedCallback = null;
    mockGetRelatedGamesFn.mockReset();
    // Install controllable IntersectionObserver before each render
    vi.stubGlobal("IntersectionObserver", MockIntersectionObserver);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe("given firstPage has games and hasMore is true", () => {
    beforeEach(() => {
      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
        />
      );
    });

    it("renders every game from the firstPage prop", () => {
      for (const game of PAGE_1_GAMES) {
        expect(elements.getGameByName(game.title)).toBeDefined();
      }
    });

    it("renders games in firstPage order (first game first)", () => {
      const imgs = screen.getAllByRole("img");
      const firstImgName = imgs[0]?.getAttribute("alt") ?? "";
      expect(firstImgName).toBe(`Cover for ${PAGE_1_GAMES[0]!.title}`);
    });

    it("does NOT call getRelatedGamesFn on initial render", () => {
      expect(mockGetRelatedGamesFn).not.toHaveBeenCalled();
    });

    it("renders the sentinel element below the list", () => {
      expect(elements.getSentinel()).toBeDefined();
    });
  });

  describe("given the sentinel is not intersecting (below viewport)", () => {
    beforeEach(() => {
      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
        />
      );
      actions.triggerSentinelExit();
    });

    it("does not call getRelatedGamesFn when sentinel is not intersecting", () => {
      expect(mockGetRelatedGamesFn).not.toHaveBeenCalled();
    });
  });

  describe("given the sentinel intersects (user scrolls to bottom)", () => {
    beforeEach(async () => {
      mockGetRelatedGamesFn.mockResolvedValue(PAGE_2_RESPONSE);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
        />
      );

      actions.triggerSentinelIntersection();
      // Let the resolved promise flush
      await act(async () => {});
    });

    it("calls getRelatedGamesFn with page=2", () => {
      expect(mockGetRelatedGamesFn).toHaveBeenCalledWith({
        data: { collectionId: COLLECTION_ID, page: 2, pageSize: PAGE_SIZE },
      });
    });

    it("calls getRelatedGamesFn exactly once", () => {
      expect(mockGetRelatedGamesFn).toHaveBeenCalledTimes(1);
    });

    it("appends page-2 games after page-1 games in the list", () => {
      for (const game of [...PAGE_1_GAMES, ...PAGE_2_GAMES]) {
        expect(elements.getGameByName(game.title)).toBeDefined();
      }
    });

    it("page-1 games appear before page-2 games in DOM order", () => {
      const imgs = screen.getAllByRole("img");
      const names = imgs.map((img) => img.getAttribute("alt") ?? "");
      const firstPage1Idx = names.findIndex((n) =>
        n.includes(PAGE_1_GAMES[0]!.title)
      );
      const firstPage2Idx = names.findIndex((n) =>
        n.includes(PAGE_2_GAMES[0]!.title)
      );
      expect(firstPage1Idx).toBeLessThan(firstPage2Idx);
    });

    it("total rendered game count equals page1 + page2 length", () => {
      const imgs = screen.getAllByRole("img");
      expect(imgs).toHaveLength(PAGE_1_GAMES.length + PAGE_2_GAMES.length);
    });
  });

  describe("given firstPage.hasMore is false", () => {
    beforeEach(() => {
      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_NO_MORE}
        />
      );
    });

    it("does not render the sentinel when there are no more pages", () => {
      expect(elements.querySentinel()).toBeNull();
    });

    it("does not call getRelatedGamesFn even if an intersection is forced", () => {
      // No sentinel means no observer; firing the callback simulates a
      // stale observer callback — the component must guard against this.
      actions.triggerSentinelIntersection();
      expect(mockGetRelatedGamesFn).not.toHaveBeenCalled();
    });
  });

  describe("given the final page has been fetched (hasMore: false after page 2)", () => {
    beforeEach(async () => {
      mockGetRelatedGamesFn.mockResolvedValue(PAGE_2_RESPONSE); // hasMore: false

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
        />
      );

      // Fetch page 2
      actions.triggerSentinelIntersection();
      await act(async () => {});
    });

    it("sentinel is removed from the DOM after hasMore becomes false", () => {
      expect(elements.querySentinel()).toBeNull();
    });

    it("does not call getRelatedGamesFn again on further intersections", () => {
      const callsBefore = mockGetRelatedGamesFn.mock.calls.length;
      actions.triggerSentinelIntersection();
      actions.triggerSentinelIntersection();
      expect(mockGetRelatedGamesFn.mock.calls.length).toBe(callsBefore);
    });
  });

  describe("given two sentinel intersections fire before the first resolves", () => {
    beforeEach(() => {
      // Deferred promise — we control when it resolves
      let resolvePage2: (value: typeof PAGE_2_RESPONSE) => void;
      const deferredPage2 = new Promise<typeof PAGE_2_RESPONSE>((resolve) => {
        resolvePage2 = resolve;
      });
      mockGetRelatedGamesFn.mockReturnValue(deferredPage2);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
        />
      );

      // Fire two intersections before the first promise resolves
      actions.triggerSentinelIntersection();
      actions.triggerSentinelIntersection();

      // Resolve to clean up (unrelated to assertion)
      act(() => {
        resolvePage2!(PAGE_2_RESPONSE);
      });
    });

    it("calls getRelatedGamesFn exactly once despite two rapid intersections", () => {
      expect(mockGetRelatedGamesFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the next-page fetch rejects with an error", () => {
    const ERROR_MESSAGE = "IGDB upstream error";

    beforeEach(async () => {
      mockGetRelatedGamesFn.mockRejectedValue(new Error(ERROR_MESSAGE));

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
        />
      );

      actions.triggerSentinelIntersection();
      await act(async () => {});
    });

    it("renders an inline role=alert element with the error message", () => {
      expect(elements.getErrorAlert()).toBeDefined();
      expect(elements.getErrorAlert().textContent).toContain(ERROR_MESSAGE);
    });

    it("preserves the previously rendered page-1 games after the error", () => {
      for (const game of PAGE_1_GAMES) {
        expect(elements.getGameByName(game.title)).toBeDefined();
      }
    });

    it("removes the sentinel after an error (no further fetches)", () => {
      expect(elements.querySentinel()).toBeNull();
    });

    it("does not call getRelatedGamesFn again after the error", () => {
      const callsBefore = mockGetRelatedGamesFn.mock.calls.length;
      actions.triggerSentinelIntersection();
      expect(mockGetRelatedGamesFn.mock.calls.length).toBe(callsBefore);
    });
  });
});
