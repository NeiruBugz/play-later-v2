import { Skeleton } from "@/shared/components/ui/skeleton";

function JournalEntrySkeleton() {
  return (
    <div className="flex gap-4">
      <Skeleton className="h-16 w-12 shrink-0" variant="gameCard" />
      <div className="flex-1 space-y-2">
        <Skeleton className="h-5 w-48" variant="title" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  );
}

export default function JournalLoading() {
  return (
    <div className="py-3xl container mx-auto">
      <div className="space-y-3xl">
        <header className="space-y-2">
          <Skeleton className="h-10 w-36" variant="title" />
          <Skeleton className="h-5 w-80" />
        </header>

        <div className="space-y-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <JournalEntrySkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  );
}
