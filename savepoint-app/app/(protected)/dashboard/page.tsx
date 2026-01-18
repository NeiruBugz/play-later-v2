import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { ContinuePlaying } from "@/features/dashboard/ui/continue-playing";
import { DashboardQuickActions } from "@/features/dashboard/ui/dashboard-quick-actions";
import { DashboardStats } from "@/features/dashboard/ui/dashboard-stats";
import { RecentlyAdded } from "@/features/dashboard/ui/recently-added";
import { GettingStartedChecklist } from "@/features/onboarding";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Dashboard",
  description: "Your gaming dashboard",
};

function StatsSkeleton() {
  return (
    <div className="gap-lg grid md:grid-cols-3">
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
      <div className="gap-lg grid sm:grid-cols-2 lg:grid-cols-4">
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
    <main className="py-3xl container mx-auto">
      <div className="space-y-3xl">
        <header>
          <h1 className="heading-xl tracking-tight">
            Welcome back, {username}!
          </h1>
          <p className="body-md text-muted-foreground">
            Track your gaming journey and discover what to play next
          </p>
        </header>

        <Suspense fallback={<OnboardingSkeleton />}>
          <GettingStartedChecklist userId={userId} />
        </Suspense>

        <DashboardQuickActions />

        <Suspense fallback={<StatsSkeleton />}>
          <DashboardStats userId={userId} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <ContinuePlaying userId={userId} />
        </Suspense>

        <Suspense fallback={<SectionSkeleton />}>
          <RecentlyAdded userId={userId} />
        </Suspense>
      </div>
    </main>
  );
}
