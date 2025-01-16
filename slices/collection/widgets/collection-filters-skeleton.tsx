import { Skeleton } from "@/src/shared/ui/skeleton";

export function CollectionFiltersSkeleton() {
  return (
    <div className="mb-3 hidden h-[68px] flex-wrap items-center justify-center md:flex md:flex-nowrap md:justify-between">
      <div className="flex items-center gap-3">
        <Skeleton className="h-8 w-[400px]" />
        <Skeleton className="h-8 w-[70px]" />
      </div>
      <div className="my-4 flex flex-wrap justify-center gap-2 md:flex-nowrap">
        <Skeleton className="h-8 w-[102px]" />
        <Skeleton className="h-8 w-[102px]" />
      </div>
    </div>
  );
}
