import { Skeleton } from "@/shared/components/ui/skeleton";

export default function SteamGamesLoading() {
  return (
    <div className="py-3xl container mx-auto">
      <div className="mb-2xl gap-lg flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div className="gap-md flex items-center">
          <Skeleton className="h-10 w-10 rounded-md" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
      </div>
      <div className="space-y-lg">
        <Skeleton className="h-10 w-full" />
        <div className="space-y-xs">
          {Array.from({ length: 10 }).map((_, index) => (
            <Skeleton key={index} className="h-20 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
