import { LibraryService, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  ContinuePlaying,
  DashboardStats,
  QuickLogHero,
  RecentlyAdded,
  UpNext,
} from "@/features/dashboard/index.server";
import {
  EmptyLibraryHero,
  GettingStartedChecklist,
} from "@/features/onboarding";
import { ActivityFeed } from "@/features/social/index.server";
import { SectionBoundary } from "@/shared/components/section-boundary";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  description:
    "Your gaming dashboard — track what you're playing, discover what to play next, and journal your gaming experiences.",
};

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

function OnboardingSkeleton() {
  return <Skeleton className="h-64" variant="card" />;
}

function StatsSkeleton() {
  return <Skeleton className="h-48" variant="card" />;
}

function ActivitySkeleton() {
  return <Skeleton className="h-48" variant="card" />;
}

export default async function DashboardPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const libraryService = new LibraryService();

  const [setupStatusResult, statusCountsResult] = await Promise.allSettled([
    profileService.checkSetupStatus({ userId }),
    libraryService.getStatusCounts({ userId }),
  ]);

  let setupStatus: { needsSetup: boolean } = { needsSetup: false };
  if (setupStatusResult.status === "fulfilled") {
    setupStatus = setupStatusResult.value;
  }
  // if setup status fails, do not redirect — stay on dashboard
  if (setupStatus.needsSetup) {
    redirect("/profile/setup");
  }

  if (statusCountsResult.status === "rejected") {
    throw statusCountsResult.reason;
  }
  const statusCounts = statusCountsResult.value;
  const hasEmptyLibrary =
    Object.values(statusCounts).reduce((sum, count) => sum + count, 0) === 0;

  return (
    <div className="py-3xl">
      <SectionBoundary>
        <Suspense fallback={<StatsSkeleton />}>
          <QuickLogHero userId={userId} />
        </Suspense>
      </SectionBoundary>

      <SectionBoundary>
        <Suspense fallback={<OnboardingSkeleton />}>
          <GettingStartedChecklist userId={userId} />
        </Suspense>
      </SectionBoundary>

      {hasEmptyLibrary ? (
        <div className="mt-2">
          <EmptyLibraryHero variant="dashboard" />
        </div>
      ) : (
        <>
          <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
            <div className="flex flex-col gap-2">
              <SectionBoundary>
                <Suspense fallback={<StatsSkeleton />}>
                  <DashboardStats userId={userId} />
                </Suspense>
              </SectionBoundary>

              <SectionBoundary>
                <Suspense fallback={<ActivitySkeleton />}>
                  <ActivityFeed userId={userId} />
                </Suspense>
              </SectionBoundary>
            </div>

            <div className="space-y-2">
              <SectionBoundary>
                <Suspense fallback={<SectionSkeleton />}>
                  <ContinuePlaying userId={userId} />
                </Suspense>
              </SectionBoundary>

              <SectionBoundary>
                <Suspense fallback={<SectionSkeleton />}>
                  <UpNext userId={userId} />
                </Suspense>
              </SectionBoundary>
            </div>
          </div>

          <div className="mt-2">
            <SectionBoundary>
              <Suspense fallback={<SectionSkeleton />}>
                <RecentlyAdded userId={userId} />
              </Suspense>
            </SectionBoundary>
          </div>
        </>
      )}
    </div>
  );
}
