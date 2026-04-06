import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import {
  ContinuePlaying,
  DashboardStats,
  RecentlyAdded,
  UpNext,
} from "@/features/dashboard/index.server";
import { GettingStartedChecklist } from "@/features/onboarding";
import { ActivityFeedSkeleton } from "@/features/social";
import { ActivityFeed } from "@/features/social/index.server";
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
  return (
    <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
      <Skeleton className="h-48 sm:col-span-2 lg:row-span-2" variant="card" />
      <Skeleton className="h-24" variant="card" />
      <Skeleton className="h-24" variant="card" />
      <Skeleton className="h-24" variant="card" />
      <Skeleton className="h-24" variant="card" />
    </div>
  );
}

function ActivitySkeleton() {
  return <Skeleton className="h-48" variant="card" />;
}

export default async function DashboardPage() {
  const userId = await requireServerUserId();

  const service = new ProfileService();
  const statusResult = await service.checkSetupStatus({ userId });
  if (statusResult.success && statusResult.data.needsSetup) {
    redirect("/profile/setup");
  }

  const profileResult = await service.getProfileWithStats({ userId });
  const username = isSuccessResult(profileResult)
    ? profileResult.data.profile.username
    : "there";

  return (
    <div className="py-3xl">
      <header className="mb-2xl">
        <h1 className="heading-xl tracking-tight">Welcome back, {username}!</h1>
      </header>

      <Suspense fallback={<OnboardingSkeleton />}>
        <GettingStartedChecklist userId={userId} />
      </Suspense>

      <div className="grid gap-2 lg:grid-cols-[1fr_1fr]">
        <div className="space-y-2">
          <Suspense fallback={<StatsSkeleton />}>
            <DashboardStats userId={userId} />
          </Suspense>
        </div>

        <div className="space-y-2">
          <Suspense fallback={<SectionSkeleton />}>
            <ContinuePlaying userId={userId} />
          </Suspense>

          <Suspense fallback={<SectionSkeleton />}>
            <UpNext userId={userId} />
          </Suspense>
        </div>
      </div>

      <div className="mt-2">
        <Suspense fallback={<SectionSkeleton />}>
          <RecentlyAdded userId={userId} />
        </Suspense>
      </div>

      <div className="mt-2">
        <Suspense fallback={<ActivitySkeleton />}>
          <ActivityFeed userId={userId} />
        </Suspense>
      </div>
    </div>
  );
}
