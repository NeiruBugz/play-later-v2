import { Skeleton } from "@/shared/components/ui/skeleton";

/**
 * Loading skeleton for library grid
 *
 * Displays placeholder cards matching the grid layout while library data is being fetched.
 * The skeleton grid matches the responsive layout of the actual library grid.
 *
 * @example
 * ```tsx
 * if (isLoading) {
 *   return <LibraryGridSkeleton />;
 * }
 * ```
 */
export function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <LibraryCardSkeleton key={index} />
      ))}
    </div>
  );
}

/**
 * Skeleton for individual library card
 *
 * Displays a placeholder matching the aspect ratio and layout of game cover cards.
 * Uses a 3:4 aspect ratio typical of game cover art.
 */
function LibraryCardSkeleton() {
  return (
    <div className="group relative">
      {/* Cover Image Skeleton - 3:4 aspect ratio */}
      <Skeleton className="aspect-[3/4] w-full rounded-md" />

      {/* Status Badge Skeleton */}
      <div className="absolute top-2 left-2">
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}
