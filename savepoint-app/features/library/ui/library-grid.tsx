"use client";

import { useLibraryData } from "@/features/library/hooks/use-library-data";
import { useLibraryFilters } from "@/features/library/hooks/use-library-filters";
import { Button } from "@/shared/components/ui/button";
import { LibraryItemStatus } from "@/shared/types";

import { LibraryCard } from "./library-card";
import { LibraryCardListRow } from "./library-card-list-row";
import { LibraryEmptyState } from "./library-empty-state";
import { LibraryGridSkeleton } from "./library-grid-skeleton";
import type { LibraryErrorStateProps } from "./library-grid.types";

const UP_NEXT_NUDGE_THRESHOLD = 10;

function LibraryErrorState({ error }: LibraryErrorStateProps) {
  return (
    <div className="px-lg py-5xl flex flex-col items-center justify-center text-center">
      <div className="text-destructive mb-xl text-5xl">⚠</div>
      <h2 className="heading-lg mb-md">Failed to Load Library</h2>
      <p className="body-md text-muted-foreground mb-xl max-w-md">
        {error.message ||
          "An error occurred while loading your library. Please try again."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="body-md text-primary hover:underline"
      >
        Reload Page
      </button>
    </div>
  );
}

export function LibraryGrid() {
  const filters = useLibraryFilters();
  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useLibraryData(filters);

  if (isLoading) {
    return <LibraryGridSkeleton />;
  }
  if (error) {
    return <LibraryErrorState error={error} />;
  }

  const items = data?.pages.flatMap((page) => page.items) ?? [];

  if (items.length === 0) {
    return <LibraryEmptyState status={filters.status} />;
  }

  // Prefer the server-reported total so the nudge fires on first render for
  // large queues, not only after the user loads more pages.
  const queueSize = data?.pages[0]?.total ?? items.length;
  const showUpNextNudge =
    filters.status === LibraryItemStatus.UP_NEXT &&
    queueSize > UP_NEXT_NUDGE_THRESHOLD;

  return (
    <div className="space-y-xl pb-12">
      {showUpNextNudge && (
        <div
          role="note"
          className="border-border/60 bg-muted/40 text-muted-foreground rounded-md border px-4 py-3 text-sm"
        >
          Your queue is growing — what&apos;s next, actually? Patience is the
          point; consider sending a few back to the shelf.
        </div>
      )}
      <div
        className="flex flex-col gap-2 sm:hidden"
        role="list"
        aria-label="Your game library (mobile list)"
        data-testid="library-list"
      >
        {items.map((item) => (
          <LibraryCardListRow
            key={item.id}
            item={item}
            activeStatusFilter={filters.status}
          />
        ))}
      </div>
      <div
        className="hidden sm:grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,200px))] md:gap-[14px] lg:grid-cols-[repeat(auto-fill,minmax(180px,220px))] lg:gap-4"
        role="list"
        aria-label="Your game library"
      >
        {items.map((item, index) => (
          <LibraryCard
            key={item.id}
            item={item}
            index={index}
            activeStatusFilter={filters.status}
          />
        ))}
      </div>

      {hasNextPage && (
        <div className="flex justify-center">
          <Button
            variant="secondary"
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage}
          >
            {isFetchingNextPage ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}
