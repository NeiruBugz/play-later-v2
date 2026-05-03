import { Skeleton } from "@/shared/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <div className="py-2xl container mx-auto">
      <div className="mb-xl">
        <Skeleton className="h-10 w-48" variant="title" />
      </div>
      <div className="flex gap-6">
        <Skeleton
          className="hidden h-96 w-48 shrink-0 lg:block"
          variant="card"
        />
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-10 w-full" variant="card" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} variant="gameCard" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
