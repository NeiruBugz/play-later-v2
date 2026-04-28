"use client";

import { useEffect, type RefObject } from "react";

type Options = {
  hasNextPage: boolean | undefined;
  isFetchingNextPage: boolean;
  fetchNextPage: () => void;
  rootMargin?: string;
};

export function useInfiniteScrollSentinel(
  sentinelRef: RefObject<HTMLElement | null>,
  {
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    rootMargin = "200px",
  }: Options
) {
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [sentinelRef, hasNextPage, isFetchingNextPage, fetchNextPage, rootMargin]);
}
