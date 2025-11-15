"use client";

import { useLibraryData } from "@/features/library/hooks/use-library-data";
import { useLibraryFilters } from "@/features/library/hooks/use-library-filters";

import { LibraryCard } from "./library-card";
import { LibraryEmptyState } from "./library-empty-state";
import { LibraryGridSkeleton } from "./library-grid-skeleton";

/**
 * Error state component for library grid
 *
 * Displays when the library data fetch fails with error details
 */
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

/**
 * Library grid component - displays user's game library as a responsive grid
 *
 * Features:
 * - Responsive grid layout (2 cols mobile, 4 cols tablet, 6 cols desktop)
 * - Reads filter state from URL parameters via useLibraryFilters hook
 * - Fetches library data with TanStack Query via useLibraryData hook
 * - Handles loading state with skeleton placeholders
 * - Handles error state with retry option
 * - Handles empty state with CTA to browse games
 * - Displays game cards with cover images, status badges, and metadata
 *
 * The grid shows only the most recently modified library item per game by default.
 * Users can see all library items for a game via the game detail page modal.
 *
 * @example
 * ```tsx
 * // In library page
 * <LibraryFilters />
 * <LibraryGrid />
 * ```
 */
export function LibraryGrid() {
  // Read filter values from URL search parameters
  const filters = useLibraryFilters();

  // Fetch library data with current filters
  const { data, isLoading, error } = useLibraryData(filters);

  // Loading state - show skeleton placeholders
  if (isLoading) {
    return <LibraryGridSkeleton />;
  }

  // Error state - show error message with retry
  if (error) {
    return <LibraryErrorState error={error} />;
  }

  // Empty state - show CTA to browse games
  if (!data || data.length === 0) {
    return <LibraryEmptyState />;
  }

  // Render grid of library cards
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {data.map((item) => (
        <LibraryCard key={item.id} item={item} />
      ))}
    </div>
  );
}
