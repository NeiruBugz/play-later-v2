import { Card } from "@/shared/components/ui/card";

export const GameDetailSkeleton = () => {
  return (
    <div
      className="flex flex-col gap-6 lg:grid lg:grid-cols-[300px_1fr] lg:gap-8"
      data-testid="skeleton-layout"
    >
      {}
      <aside className="space-y-4 lg:sticky lg:top-8 lg:self-start">
        {}
        <div
          className="bg-muted relative aspect-[3/4] w-full max-w-sm animate-pulse rounded-lg"
          data-testid="skeleton-animated-placeholder"
        />
        {}
        <div className="space-y-2">
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        </div>
        {}
        <div className="flex gap-2">
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-md" />
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-md" />
        </div>
      </aside>
      {}
      <main className="space-y-6">
        {}
        <div className="space-y-2">
          {}
          <div className="bg-muted h-10 w-3/4 animate-pulse rounded-lg" />
          {}
          <div className="bg-muted h-5 w-48 animate-pulse rounded" />
          {}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
          </div>
          {}
          <div className="flex flex-wrap gap-1.5 pt-1">
            <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            <div className="bg-muted h-6 w-16 animate-pulse rounded" />
          </div>
        </div>
        {}
        <div className="space-y-2">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
          <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
        </div>
        {}
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
        {}
        <div className="space-y-4">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="space-y-2">
            <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
          </div>
        </div>
        {}
        <div className="space-y-4">
          <div className="bg-muted h-8 w-56 animate-pulse rounded" />
          {}
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
