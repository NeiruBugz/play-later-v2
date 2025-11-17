"use client";
import { useLibraryData } from "@/features/library/hooks/use-library-data";
import { useLibraryFilters } from "@/features/library/hooks/use-library-filters";
import { LibraryCard } from "./library-card";
import { LibraryEmptyState } from "./library-empty-state";
import { LibraryGridSkeleton } from "./library-grid-skeleton";

function LibraryErrorState({ error }: { error: Error }) {
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <div className="text-destructive mb-4 text-5xl">⚠</div>
      <h2 className="mb-2 text-2xl font-semibold">Failed to Load Library</h2>
      <p className="text-muted-foreground mb-4 max-w-md">
        {error.message ||
          "An error occurred while loading your library. Please try again."}
      </p>
      <button
        onClick={() => window.location.reload()}
        className="text-primary hover:underline"
      >
        Reload Page
      </button>
    </div>
  );
}

export function LibraryGrid() {
  const filters = useLibraryFilters();
  const { data, isLoading, error } = useLibraryData(filters);
  if (isLoading) {
    return <LibraryGridSkeleton />;
  }
  if (error) {
    return <LibraryErrorState error={error} />;
  }
  if (!data || data.length === 0) {
    return <LibraryEmptyState />;
  }
  return (
    <div
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6"
      role="feed"
      aria-label="Your game library"
    >
      {data.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
