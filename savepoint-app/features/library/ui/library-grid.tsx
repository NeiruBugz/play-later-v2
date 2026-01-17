"use client";

import { useLibraryData } from "@/features/library/hooks/use-library-data";
import { useLibraryFilters } from "@/features/library/hooks/use-library-filters";
import { Button } from "@/shared/components/ui/button";

import { LibraryCard } from "./library-card";
import { LibraryEmptyState } from "./library-empty-state";
import { LibraryGridSkeleton } from "./library-grid-skeleton";
import type { LibraryErrorStateProps } from "./library-grid.types";

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
    return <LibraryEmptyState />;
  }

  return (
    <div className="space-y-xl">
      <div
        className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8"
        role="feed"
        aria-label="Your game library"
      >
        {items.map((item, index) => (
          <LibraryCard key={item.id} item={item} index={index} />
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
