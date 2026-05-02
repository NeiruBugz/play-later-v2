import { LibraryService, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";
import { Suspense } from "react";

import { LibraryPageView } from "@/features/library";
import { EmptyLibraryHero } from "@/features/onboarding";
import { Skeleton } from "@/shared/components/ui/skeleton";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse and manage your game library. Filter by status, platform, and sort your collection.",
};

function LibraryViewSkeleton() {
  return (
    <div className="py-2xl container mx-auto">
      <div className="mb-xl">
        <Skeleton className="h-10 w-48" variant="title" />
      </div>
      <div className="flex gap-6">
        <Skeleton
          className="hidden h-96 w-48 shrink-0 lg:block"
          variant="card"
        />
        <div className="min-w-0 flex-1 space-y-4">
          <Skeleton className="h-10 w-full" variant="card" />
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 2xl:grid-cols-12">
            {[...Array(12)].map((_, i) => (
              <Skeleton key={i} variant="gameCard" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default async function LibraryPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const libraryService = new LibraryService();

  const [steamStatusResult, statusCountsResult] = await Promise.allSettled([
    profileService.getSteamConnectionStatus({ userId }),
    libraryService.getStatusCounts({ userId }),
  ]);

  let isSteamConnected = false;
  if (steamStatusResult.status === "fulfilled") {
    isSteamConnected = steamStatusResult.value.connected;
  }
  // non-critical — library renders without Steam import button if rejected

  if (statusCountsResult.status === "rejected") {
    throw statusCountsResult.reason;
  }
  const statusCounts = statusCountsResult.value;

  const totalLibraryItems = Object.values(statusCounts).reduce(
    (sum, count) => sum + count,
    0
  );

  if (totalLibraryItems === 0) {
    return (
      <div className="py-2xl container mx-auto">
        <div className="mb-xl">
          <h1 className="heading-lg y2k-chrome-text">Library</h1>
        </div>
        <EmptyLibraryHero variant="library" />
      </div>
    );
  }

  return (
    <Suspense fallback={<LibraryViewSkeleton />}>
      <LibraryPageView isSteamConnected={isSteamConnected} />
    </Suspense>
  );
}
