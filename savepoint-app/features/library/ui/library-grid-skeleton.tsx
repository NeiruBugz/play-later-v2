import { Skeleton } from "@/shared/components/ui/skeleton";
import { cn } from "@/shared/lib/ui";

export function LibraryGridSkeleton() {
  return (
    <div className="gap-xl grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <LibraryCardSkeleton key={index} index={index} />
      ))}
    </div>
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
