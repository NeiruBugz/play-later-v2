import { useCallback, useEffect, useRef, useState } from "react";

import { GameCard } from "@/widgets/game-card";

import { getRelatedGamesFn, type RelatedGame } from "../../api";
import type {
  RelatedGamesInfiniteListProps,
  RelatedGamesPage,
} from "./related-games-infinite-list.type";

/**
 * Variant B (hybrid client-append) infinite-scroll list.
 *
 * SSR delivers `firstPage`; pages 2+ are fetched directly via `getRelatedGamesFn`
 * and appended to local state. No URL sync — page index is UI-only state, not a
 * shareable deep-link (multi-collection makes a single `?page=N` ambiguous, and
 * loader revalidation on URL change would re-fire all phase-2 IGDB chains).
 *
 * - Sentinel rendered only when `hasMore` is true.
 * - IntersectionObserver triggers next-page fetch (scoped to the inner scroll
 *   container so the page-level scroll doesn't auto-load).
 * - In-flight guard via ref dedupes rapid intersections.
 * - On rejection: inline `role="alert"` rendered; sentinel removed; no further fetches.
 */
export function RelatedGamesInfiniteList({
  collectionId,
  pageSize,
  firstPage,
}: RelatedGamesInfiniteListProps) {
  const [games, setGames] = useState<RelatedGame[]>(firstPage.games);
  const [latestPage, setLatestPage] = useState<RelatedGamesPage>(firstPage);
  const [error, setError] = useState<string | null>(null);

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
            <li key={game.igdbId}>
              <GameCard
                game={{
                  slug: game.slug,
                  title: game.title,
                  coverImageId: game.coverImageId,
                }}
                density="minimal"
              />
            </li>
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
      </div>

      {error !== null ? (
        <div role="alert" className="text-destructive text-sm">
          {error}
        </div>
      ) : null}
    </div>
  );
}
