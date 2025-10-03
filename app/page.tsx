import { auth } from "@/auth";
import { Suspense } from "react";

import {
  CollectionStats,
  CollectionStatsSkeleton,
  CurrentlyPlaying,
  CurrentlyPlayingSkeleton,
  LibraryCount,
  LibraryCountSkeleton,
  PlatformBreakdown,
  PlatformBreakdownSkeleton,
  RecentActivity,
  RecentActivitySkeleton,
  SteamIntegration,
  SteamIntegrationSkeleton,
  UpcomingReleases,
  UpcomingReleasesSkeleton,
} from "@/features/dashboard/components";
import { Landing } from "@/features/landing";
import { Header } from "@/shared/components/header";
import { ResponsiveHeading } from "@/shared/components/typography";

export default async function Page() {
  const session = await auth();

  if (session?.user == null) {
    return <Landing />;
  }

  return (
    <>
      <Header authorized />
      <section className="container mt-2 pt-16">
        <ResponsiveHeading
          level={1}
          className="md:text-heading-lg xl:text-heading-xl"
        >
          Hi, {session.user.name}
        </ResponsiveHeading>

        {/* Main dashboard grid - adaptive layout */}
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
          <Suspense fallback={<LibraryCountSkeleton />}>
            <LibraryCount />
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
      </section>
    </>
  );
}
