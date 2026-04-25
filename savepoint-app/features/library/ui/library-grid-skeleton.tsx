import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui/utils";

export function LibraryGridSkeleton() {
  return (
    <>
      <div
        role="status"
        aria-label="Loading your game library (mobile list)"
        aria-busy="true"
        className="flex flex-col gap-2 sm:hidden"
      >
        {Array.from({ length: 6 }).map((_, index) => (
          <LibraryListRowSkeleton key={index} />
        ))}
      </div>
      <div
        role="status"
        aria-label="Loading your game library"
        aria-busy="true"
        className="hidden sm:grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-4 sm:grid-cols-[repeat(auto-fill,minmax(150px,1fr))] md:grid-cols-[repeat(auto-fill,minmax(160px,200px))] md:gap-[14px] lg:grid-cols-[repeat(auto-fill,minmax(180px,220px))] lg:gap-4"
      >
        {Array.from({ length: 12 }).map((_, index) => (
          <LibraryCardSkeleton key={index} index={index} />
        ))}
      </div>
    </>
  );
}

function LibraryCardSkeleton({ index }: { index: number }) {
  const staggerIndex = Math.min(index + 1, 12);

  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-lg",
        "animate-stagger-in",
        `stagger-${staggerIndex}`
      )}
      style={{ animationDelay: `${staggerIndex * 50}ms` }}
    >
      <Skeleton variant="gameCard" className="aspect-[3/4] w-full" />
      <div className="absolute top-3 left-3">
        <Skeleton className="h-5 w-20 rounded-sm" />
      </div>
    </div>
  );
}

function LibraryListRowSkeleton() {
  return (
    <div className="flex w-full flex-row items-start gap-3 rounded-lg border border-border/40 p-3">
      <Skeleton className="h-20 w-[60px] shrink-0 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
        <Skeleton className="h-3 w-2/5" />
        <Skeleton className="mt-1 h-8 w-full rounded-md" />
      </div>
    </div>
  );
}
