import { Loader2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

import { getRelatedGamesFn, type RelatedGame } from "../../api";
import type {
  RelatedGamesInfiniteListProps,
  RelatedGamesPage,
} from "./related-games-infinite-list.type";

export function RelatedGamesInfiniteList({
  collectionId,
  pageSize,
  firstPage,
  renderGame,
}: RelatedGamesInfiniteListProps) {
  const [games, setGames] = useState<RelatedGame[]>(firstPage.games);
  const [latestPage, setLatestPage] = useState<RelatedGamesPage>(firstPage);
  const [error, setError] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);

  const sentinelRef = useRef<HTMLDivElement | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const isFetchingRef = useRef(false);
  const latestPageRef = useRef<RelatedGamesPage>(firstPage);
  const errorRef = useRef<string | null>(null);

  useEffect(() => {
    latestPageRef.current = latestPage;
  }, [latestPage]);

  useEffect(() => {
    errorRef.current = error;
  }, [error]);

  const showSentinel = latestPage.hasMore && error === null;

  const fetchNextPage = useCallback(async () => {
    if (isFetchingRef.current) return;
    if (errorRef.current !== null) return;
    if (!latestPageRef.current.hasMore) return;

    isFetchingRef.current = true;
    setIsFetching(true);
    const nextPage = latestPageRef.current.page + 1;

    try {
      const result = (await getRelatedGamesFn({
        data: { collectionId, page: nextPage, pageSize },
      })) as RelatedGamesPage;

      setGames((prev) => [...prev, ...result.games]);
      setLatestPage(result);
      latestPageRef.current = result;
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to load related games";
      setError(message);
      errorRef.current = message;
    } finally {
      isFetchingRef.current = false;
      setIsFetching(false);
    }
  }, [collectionId, pageSize]);

  useEffect(() => {
    if (!showSentinel) return;
    const node = sentinelRef.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        if (!entry.isIntersecting) return;
        void fetchNextPage();
      },
      {
        root: scrollContainerRef.current,
        rootMargin: "120px",
      }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [showSentinel, fetchNextPage]);

  return (
    <div className="flex flex-col gap-4">
      <div
        ref={scrollContainerRef}
        className="max-h-[480px] overflow-y-auto pr-2"
      >
        <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {games.map((game) => (
            <li key={game.igdbId}>{renderGame(game)}</li>
          ))}
        </ul>

        {showSentinel ? (
          <div
            ref={sentinelRef}
            data-testid="related-games-sentinel"
            aria-hidden="true"
            className="h-px w-full"
          />
        ) : null}

        {isFetching ? (
          <div
            role="status"
            aria-live="polite"
            className="text-muted-foreground gap-sm py-md flex items-center justify-center text-sm"
          >
            <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
            <span>Loading more games</span>
          </div>
        ) : null}
      </div>

      {error !== null ? (
        <div role="alert" className="text-destructive text-sm">
          {error}
        </div>
      ) : null}
    </div>
  );
}
