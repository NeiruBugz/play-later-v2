import { Skeleton } from "@/shared/components/ui/skeleton";

export default function ProfileTabLoading() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-20" variant="card" />
        ))}
      </div>
      <div className="space-y-4">
        <Skeleton className="h-6 w-40" variant="title" />
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="gameCard" />
          ))}
        </div>
      </div>
    </div>
  );
}
