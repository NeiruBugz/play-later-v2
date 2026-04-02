"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef } from "react";

import { useActivityFeed } from "../hooks/use-activity-feed";
import type { PaginatedFeed } from "../types";
import { ActivityFeedItem } from "./activity-feed-item";

type ActivityFeedClientProps = {
  initialData: PaginatedFeed;
};

export function ActivityFeedClient({ initialData }: ActivityFeedClientProps) {
  const sentinelRef = useRef<HTMLDivElement>(null);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useActivityFeed({ initialData });

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const [entry] = entries;
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
        }
      },
      { rootMargin: "200px" }
    );

    observer.observe(sentinel);

    return () => {
      observer.disconnect();
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const allItems = data?.pages.flatMap((page) => page.items) ?? [];

  if (allItems.length === 0) {
    return (
      <p className="text-muted-foreground py-6 text-center text-sm">
        No activity yet. Follow some users to see their updates here.
      </p>
    );
  }

  return (
    <>
      <div className="divide-border/40 divide-y">
        {allItems.map((item) => (
          <ActivityFeedItem key={item.id} item={item} />
        ))}
      </div>

      <div ref={sentinelRef} className="flex justify-center py-4">
        {isFetchingNextPage && (
          <Loader2 className="text-muted-foreground h-5 w-5 animate-spin" />
        )}
        {!hasNextPage && allItems.length > 0 && (
          <p className="text-muted-foreground text-xs">No more activity</p>
        )}
      </div>
    </>
  );
}
