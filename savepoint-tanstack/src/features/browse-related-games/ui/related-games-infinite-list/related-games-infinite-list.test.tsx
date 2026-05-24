import { act, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

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
  queryLoadingStatus: () => screen.queryByText("Loading more games"),
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
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );
    });

    it("renders all firstPage games with page order preserved and shows the sentinel", () => {
      for (const game of PAGE_1_GAMES) {
        expect(elements.getGameByName(game.title)).toBeDefined();
      }
      const imgs = screen.getAllByRole("img");
      expect(imgs[0]?.getAttribute("alt")).toBe(
        `Cover for ${PAGE_1_GAMES[0]!.title}`
      );
      expect(elements.getSentinel()).toBeDefined();
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
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      actions.triggerSentinelIntersection();
      // Let the resolved promise flush
      await act(async () => {});
    });

    it("appends page-2 games after page-1 games in DOM order", () => {
      const imgs = screen.getAllByRole("img");
      const names = imgs.map((img) => img.getAttribute("alt") ?? "");
      const firstPage1Idx = names.findIndex((n) =>
        n.includes(PAGE_1_GAMES[0]!.title)
      );
      const firstPage2Idx = names.findIndex((n) =>
        n.includes(PAGE_2_GAMES[0]!.title)
      );
      expect(firstPage1Idx).toBeLessThan(firstPage2Idx);
      expect(imgs).toHaveLength(PAGE_1_GAMES.length + PAGE_2_GAMES.length);
    });

    it("removes the sentinel after the last page is fetched", () => {
      expect(elements.querySentinel()).toBeNull();
    });
  });

  describe("given firstPage.hasMore is false", () => {
    beforeEach(() => {
      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_NO_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );
    });

    it("does not render the sentinel when there are no more pages", () => {
      expect(elements.querySentinel()).toBeNull();
    });
  });

  describe("given two sentinel intersections fire before the first resolves", () => {
    beforeEach(async () => {
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
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      // Fire two intersections before the first promise resolves
      actions.triggerSentinelIntersection();
      actions.triggerSentinelIntersection();

      await act(async () => {
        resolvePage2!(PAGE_2_RESPONSE);
      });
    });

    it("does not duplicate games on rapid double-scroll", () => {
      const imgs = screen.getAllByRole("img");
      expect(imgs).toHaveLength(PAGE_1_GAMES.length + PAGE_2_GAMES.length);
    });
  });

  describe("given a next-page fetch is in flight", () => {
    let resolvePage2: ((value: typeof PAGE_2_RESPONSE) => void) | null = null;

    beforeEach(async () => {
      resolvePage2 = null;
      const deferred = new Promise<typeof PAGE_2_RESPONSE>((resolve) => {
        resolvePage2 = resolve;
      });
      mockGetRelatedGamesFn.mockReturnValue(deferred);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      actions.triggerSentinelIntersection();
      // Let microtasks settle so the isFetching state commits.
      await act(async () => {});
    });

    it("shows the loading indicator while fetching and hides it after the page resolves", async () => {
      expect(elements.queryLoadingStatus()).not.toBeNull();

      await act(async () => {
        resolvePage2!(PAGE_2_RESPONSE);
      });

      expect(elements.queryLoadingStatus()).toBeNull();
    });
  });

  describe("given the next-page fetch rejects with a non-Error value", () => {
    beforeEach(async () => {
      mockGetRelatedGamesFn.mockRejectedValue("string rejection");

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      actions.triggerSentinelIntersection();
      await act(async () => {});
    });

    it("shows the fallback error message when cause is not an Error instance", () => {
      expect(elements.getErrorAlert().textContent).toContain(
        "Failed to load related games"
      );
    });
  });

  describe("given the sentinel exits the viewport (isIntersecting = false)", () => {
    beforeEach(async () => {
      mockGetRelatedGamesFn.mockResolvedValue(PAGE_2_RESPONSE);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      // Fire a non-intersecting entry — should NOT trigger a fetch.
      actions.triggerSentinelExit();
      await act(async () => {});
    });

    it("does not call getRelatedGamesFn when the sentinel is not intersecting", () => {
      expect(mockGetRelatedGamesFn).not.toHaveBeenCalled();
    });
  });

  describe("given a fetch error occurred and the intersection fires again (errorRef guard)", () => {
    beforeEach(async () => {
      mockGetRelatedGamesFn
        .mockRejectedValueOnce(new Error("IGDB error"))
        .mockResolvedValue(PAGE_2_RESPONSE);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      // First intersection — triggers fetch which rejects, sets error.
      actions.triggerSentinelIntersection();
      await act(async () => {});

      // After error, `showSentinel` = false and sentinel is removed. But the
      // captured callback still exists (mock disconnect is a no-op). Fire again —
      // this exercises `if (errorRef.current !== null) return` in fetchNextPage.
      actions.triggerSentinelIntersection();
      await act(async () => {});
    });

    it("does not call getRelatedGamesFn a second time when error is already set", () => {
      // First call (rejected), second call guarded by errorRef — only 1 total.
      expect(mockGetRelatedGamesFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("given all pages are loaded and the intersection fires again (hasMore guard)", () => {
    beforeEach(async () => {
      // First fetch returns the last page (hasMore = false).
      mockGetRelatedGamesFn.mockResolvedValue(PAGE_2_RESPONSE);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      // Trigger first fetch — loads page 2 (hasMore = false).
      actions.triggerSentinelIntersection();
      await act(async () => {});

      // Sentinel is now gone (showSentinel = false) but capturedCallback still
      // holds the old reference. Fire intersection again — exercises
      // `if (!latestPageRef.current.hasMore) return` in fetchNextPage.
      actions.triggerSentinelIntersection();
      await act(async () => {});
    });

    it("does not call getRelatedGamesFn a second time after all pages are loaded", () => {
      expect(mockGetRelatedGamesFn).toHaveBeenCalledTimes(1);
    });
  });

  describe("given the IntersectionObserver callback fires with an empty entries array", () => {
    beforeEach(async () => {
      mockGetRelatedGamesFn.mockResolvedValue(PAGE_2_RESPONSE);

      render(
        <RelatedGamesInfiniteList
          collectionId={COLLECTION_ID}
          pageSize={PAGE_SIZE}
          firstPage={FIRST_PAGE_WITH_MORE}
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      // Fire the callback with an empty entries array — exercises `if (!entry) return`.
      act(() => {
        capturedCallback?.([]);
      });
      await act(async () => {});
    });

    it("does not call getRelatedGamesFn when entries is empty", () => {
      expect(mockGetRelatedGamesFn).not.toHaveBeenCalled();
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
          renderGame={(game) => (
            <img
              alt={`Cover for ${game.title}`}
              src={`/covers/${game.coverImageId}`}
            />
          )}
        />
      );

      actions.triggerSentinelIntersection();
      await act(async () => {});
    });

    it("shows an error alert and preserves already-loaded games", () => {
      expect(elements.getErrorAlert().textContent).toContain(ERROR_MESSAGE);
      for (const game of PAGE_1_GAMES) {
        expect(elements.getGameByName(game.title)).toBeDefined();
      }
    });

    it("removes the sentinel after an error so no further fetches are attempted", () => {
      expect(elements.querySentinel()).toBeNull();
    });
  });
});
