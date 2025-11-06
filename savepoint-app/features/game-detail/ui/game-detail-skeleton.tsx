import { Card } from "@/shared/components/ui/card";

/**
 * Skeleton loading state for the game detail page.
 * Mimics the structure of the actual page layout with pulsing placeholders.
 */
export const GameDetailSkeleton = () => {
  return (
    <div className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8">
      {/* Sidebar skeleton - sticky on desktop */}
      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        {/* Cover image placeholder */}
        <div className="bg-muted relative aspect-[3/4] w-full max-w-sm animate-pulse rounded-lg" />

        {/* Library status placeholder - only shown when authenticated */}
        <div className="space-y-2">
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        </div>

        {/* Quick action buttons placeholder */}
        <div className="flex gap-2">
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-md" />
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-md" />
        </div>
      </aside>

      {/* Main content skeleton */}
      <main className="space-y-6">
        {/* Title and metadata section */}
        <div className="space-y-2">
          {/* Game title */}
          <div className="bg-muted h-10 w-3/4 animate-pulse rounded-lg" />

          {/* Release date */}
          <div className="bg-muted h-5 w-48 animate-pulse rounded" />

          {/* Platform badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
          </div>

          {/* Genre badges */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            <div className="bg-muted h-6 w-16 animate-pulse rounded" />
          </div>
        </div>

        {/* Description placeholder */}
        <div className="space-y-2">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
          <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
        </div>

        {/* Times to beat section */}
        <div className="space-y-2">
          <div className="bg-muted h-6 w-40 animate-pulse rounded" />
          <div className="space-y-1">
            <div className="flex justify-between">
              <div className="bg-muted h-4 w-24 animate-pulse rounded" />
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </div>
            <div className="flex justify-between">
              <div className="bg-muted h-4 w-32 animate-pulse rounded" />
              <div className="bg-muted h-4 w-16 animate-pulse rounded" />
            </div>
          </div>
        </div>

        {/* Journal entries section placeholder (shown when authenticated) */}
        <div className="space-y-4">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="space-y-2">
            <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
          </div>
        </div>

        {/* Related games section */}
        <div className="space-y-4">
          <div className="bg-muted h-8 w-56 animate-pulse rounded" />

          {/* Related games grid placeholder */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="bg-muted relative aspect-[3/4] w-full animate-pulse" />
                <div className="space-y-1 p-2">
                  <div className="bg-muted h-3 w-full animate-pulse rounded" />
                  <div className="bg-muted h-3 w-4/5 animate-pulse rounded" />
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};
