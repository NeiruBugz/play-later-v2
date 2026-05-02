import { Skeleton } from "@/shared/components/ui/skeleton";

function StatsSkeleton() {
  return <Skeleton className="h-48" variant="card" />;
}

function OnboardingSkeleton() {
  return <Skeleton className="h-64" variant="card" />;
}

function ActivitySkeleton() {
  return <Skeleton className="h-48" variant="card" />;
}

function SectionSkeleton() {
  return (
    <div className="space-y-lg">
      <Skeleton className="h-8 w-48" variant="title" />
      <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 lg:grid-cols-7">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="gameCard" />
        ))}
      </div>
    </div>
  );
}

export default function DashboardLoading() {
  return (
    <div className="py-3xl">
      <StatsSkeleton />

      <OnboardingSkeleton />

      <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
        <div className="flex flex-col gap-2">
          <StatsSkeleton />
          <ActivitySkeleton />
        </div>

        <div className="space-y-2">
          <SectionSkeleton />
          <SectionSkeleton />
        </div>
      </div>

      <div className="mt-2">
        <SectionSkeleton />
      </div>
    </div>
  );
}
