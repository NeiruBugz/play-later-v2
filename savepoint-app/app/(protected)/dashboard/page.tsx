import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import {
  isSuccessResult,
  ProfileService,
} from "@/data-access-layer/services";
import { ContinuePlayingServer } from "@/features/dashboard/ui/continue-playing-server";
import { DashboardStatsServer } from "@/features/dashboard/ui/dashboard-stats-server";
import { RecentlyAddedServer } from "@/features/dashboard/ui/recently-added-server";
import { requireServerUserId } from "@/shared/lib/app/auth";
import { Skeleton } from "@/shared/components/ui/skeleton";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your gaming dashboard",
};

function StatsSkeleton() {
  return (
    <div className="grid gap-lg md:grid-cols-3">
      <Skeleton className="h-32" variant="card" />
      <Skeleton className="h-32" variant="card" />
      <Skeleton className="h-32" variant="card" />
    </div>
  );
}

function SectionSkeleton() {
  return (
    <div className="space-y-lg">
      <Skeleton className="h-8 w-48" variant="title" />
      <div className="grid gap-lg sm:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <Skeleton key={i} variant="gameCard" />
        ))}
      </div>
    </div>
  );
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
    <main className="container mx-auto py-3xl">
      <div className="space-y-3xl">
        <header>
          <h1 className="heading-xl font-serif">Welcome back, {username}!</h1>
          <p className="body-md text-muted-foreground">
            Track your gaming journey and discover what to play next
          </p>
        </header>

        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStatsServer userId={userId} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ContinuePlayingServer userId={userId} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <RecentlyAddedServer userId={userId} />
        </Suspense>
      </div>
    </main>
  );
}
