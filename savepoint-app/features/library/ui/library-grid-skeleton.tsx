import { Skeleton } from "@/shared/components/ui/skeleton";

export function LibraryGridSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: 12 }).map((_, index) => (
        <LibraryCardSkeleton key={index} />
      ))}
    </div>
  );
}

function LibraryCardSkeleton() {
  return (
    <div className="group relative">
      {}
      <Skeleton className="aspect-[3/4] w-full rounded-md" />
      {}
      <div className="absolute top-2 left-2">
        <Skeleton className="h-5 w-20 rounded-md" />
      </div>
    </div>
  );
}
