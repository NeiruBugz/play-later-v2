import { Suspense } from "react";

import {
  BacklogCount,
  BacklogCountSkeleton,
  CollectionStats,
  CollectionStatsSkeleton,
  CurrentlyPlaying,
  CurrentlyPlayingSkeleton,
  PlatformBreakdown,
  PlatformBreakdownSkeleton,
  RecentActivity,
  RecentActivitySkeleton,
  SteamIntegration,
  SteamIntegrationSkeleton,
  UpcomingReleases,
  UpcomingReleasesSkeleton,
} from "@/features/dashboard/components";

export function Dashboard() {
  return (
    <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
      {/* Primary widgets - always visible */}
      <div className="sm:col-span-2 lg:col-span-1">
        <Suspense fallback={<CurrentlyPlayingSkeleton />}>
          <CurrentlyPlaying />
        </Suspense>
      </div>

      <div className="sm:col-span-2 lg:col-span-1">
        <Suspense fallback={<UpcomingReleasesSkeleton />}>
          <UpcomingReleases />
        </Suspense>
      </div>

      {/* Stats widgets */}
      <Suspense fallback={<BacklogCountSkeleton />}>
        <BacklogCount />
      </Suspense>

      <Suspense fallback={<CollectionStatsSkeleton />}>
        <CollectionStats />
      </Suspense>

      {/* Additional adaptive widgets */}
      <div className="xl:col-span-1">
        <Suspense fallback={<RecentActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>

      <div className="sm:col-span-2 lg:col-span-1 xl:col-span-1">
        <Suspense fallback={<PlatformBreakdownSkeleton />}>
          <PlatformBreakdown />
        </Suspense>
      </div>

      <Suspense fallback={<SteamIntegrationSkeleton />}>
        <SteamIntegration />
      </Suspense>
    </section>
  );
}
