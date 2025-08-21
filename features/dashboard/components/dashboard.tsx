import { Suspense } from "react";

import {
  AverageRatingCard,
  CompletionRateCard,
  CurrentlyPlaying,
  CurrentlyPlayingSkeleton,
  PlatformBreakdown,
  PlatformBreakdownSkeleton,
  RecentActivity,
  RecentActivitySkeleton,
  SteamIntegration,
  SteamIntegrationSkeleton,
  TotalGamesCard,
  UpcomingReleases,
  UpcomingReleasesSkeleton,
} from "@/features/dashboard/components";
import { Body } from "@/shared/components/typography";

export function Dashboard() {
  return (
    <div className="space-y-8">
      {/* Welcome Message */}
      <div className="mt-4">
        <Body variant="muted">Welcome back to your gaming journey</Body>
      </div>

      {/* Hero Stats Section */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Suspense fallback={<TotalGamesCardSkeleton />}>
          <TotalGamesCard />
        </Suspense>
        <Suspense fallback={<CompletionRateCardSkeleton />}>
          <CompletionRateCard />
        </Suspense>
        <Suspense fallback={<AverageRatingCardSkeleton />}>
          <AverageRatingCard />
        </Suspense>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Left Column - Currently Playing */}
        <div className="space-y-6">
          <Suspense fallback={<CurrentlyPlayingSkeleton />}>
            <CurrentlyPlaying />
          </Suspense>

          <Suspense fallback={<UpcomingReleasesSkeleton />}>
            <UpcomingReleases />
          </Suspense>
        </div>

        {/* Right Column - Recent Activity & Platform Breakdown */}
        <div className="space-y-6">
          <Suspense fallback={<RecentActivitySkeleton />}>
            <RecentActivity />
          </Suspense>

          <Suspense fallback={<PlatformBreakdownSkeleton />}>
            <PlatformBreakdown />
          </Suspense>

          <Suspense fallback={<SteamIntegrationSkeleton />}>
            <SteamIntegration />
          </Suspense>
        </div>
      </div>
    </div>
  );
}

// Skeleton components for the stat cards
function TotalGamesCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-16 animate-pulse rounded bg-muted" />
          <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function CompletionRateCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <div className="h-4 w-24 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-16 animate-pulse rounded bg-muted" />
          <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}

function AverageRatingCardSkeleton() {
  return (
    <div className="rounded-lg border bg-card p-6">
      <div className="space-y-2">
        <div className="h-4 w-20 animate-pulse rounded bg-muted" />
        <div className="flex items-center gap-2">
          <div className="h-10 w-20 animate-pulse rounded bg-muted" />
          <div className="h-6 w-6 animate-pulse rounded bg-muted" />
        </div>
      </div>
    </div>
  );
}
