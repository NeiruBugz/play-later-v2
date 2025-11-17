import { useCallback, useEffect, useRef } from "react";
type UseInfiniteScrollOptions = {
  onLoadMore: () => void;
  hasMore: boolean;
  enabled?: boolean;
  threshold?: number;
};
export function useInfiniteScroll({
  onLoadMore,
  hasMore,
  enabled = true,
  threshold = 0.5,
}: UseInfiniteScrollOptions) {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<HTMLDivElement | null>(null);
  const handleIntersect = useCallback(
    (entries: IntersectionObserverEntry[]) => {
      const [entry] = entries;
      if (entry.isIntersecting && hasMore && enabled) {
        onLoadMore();
      }
    },
    [onLoadMore, hasMore, enabled]
  );
  useEffect(() => {
    if (!elementRef.current) return;
    observerRef.current = new IntersectionObserver(handleIntersect, {
      threshold,
      rootMargin: "100px", // Trigger 100px before element enters viewport
    });
    observerRef.current.observe(elementRef.current);
    return () => {
      observerRef.current?.disconnect();
    };
  }, [handleIntersect, threshold]);
  return { ref: elementRef };
}
