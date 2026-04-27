import { Card } from "@/shared/components/ui/card";

export const GameDetailSkeleton = () => {
  return (
    <div
      className="gap-2xl lg:gap-3xl flex flex-col lg:grid lg:grid-cols-[300px_1fr]"
      data-testid="skeleton-layout"
    >
      {}
      <aside className="space-y-xl lg:top-3xl lg:sticky lg:self-start">
        {}
        <div
          className="bg-muted relative aspect-[3/4] w-full max-w-sm animate-pulse rounded-lg"
          data-testid="skeleton-animated-placeholder"
        />
        {}
        <div className="space-y-md">
          <div className="bg-muted h-6 w-32 animate-pulse rounded" />
          <div className="bg-muted h-4 w-24 animate-pulse rounded" />
        </div>
        {}
        <div className="gap-md flex">
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-md" />
          <div className="bg-muted h-10 flex-1 animate-pulse rounded-md" />
        </div>
      </aside>
      {}
      <main className="space-y-2xl">
        {}
        <div className="space-y-md">
          {}
          <div className="bg-muted h-10 w-3/4 animate-pulse rounded-lg" />
          {}
          <div className="bg-muted h-5 w-48 animate-pulse rounded" />
          {}
          <div className="gap-sm pt-xs flex flex-wrap">
            <div className="bg-muted h-6 w-16 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-20 animate-pulse rounded-full" />
            <div className="bg-muted h-6 w-24 animate-pulse rounded-full" />
          </div>
          {}
          <div className="gap-sm pt-xs flex flex-wrap">
            <div className="bg-muted h-6 w-20 animate-pulse rounded" />
            <div className="bg-muted h-6 w-24 animate-pulse rounded" />
            <div className="bg-muted h-6 w-16 animate-pulse rounded" />
          </div>
        </div>
        {}
        <div className="space-y-md">
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-full animate-pulse rounded" />
          <div className="bg-muted h-4 w-5/6 animate-pulse rounded" />
          <div className="bg-muted h-4 w-4/5 animate-pulse rounded" />
        </div>
        {}
        <div className="space-y-md">
          <div className="bg-muted h-6 w-40 animate-pulse rounded" />
          <div className="space-y-xs">
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
        <div className="space-y-xl">
          <div className="bg-muted h-8 w-48 animate-pulse rounded" />
          <div className="space-y-md">
            <div className="bg-muted h-32 w-full animate-pulse rounded-lg" />
          </div>
        </div>
        {}
        <div className="space-y-xl">
          <div className="bg-muted h-8 w-56 animate-pulse rounded" />
          {}
          <div className="gap-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {Array.from({ length: 5 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <div className="bg-muted relative aspect-[3/4] w-full animate-pulse" />
                <div className="space-y-xs p-md">
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
