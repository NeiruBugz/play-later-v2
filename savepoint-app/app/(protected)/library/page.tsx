import { LibraryService, ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { LibraryPageView } from "@/features/library";
import { EmptyLibraryHero } from "@/features/onboarding";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Library",
  description:
    "Browse and manage your game library. Filter by status, platform, and sort your collection.",
};

export default async function LibraryPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const libraryService = new LibraryService();

  let isSteamConnected = false;
  try {
    const steamStatus = await profileService.getSteamConnectionStatus({
      userId,
    });
    isSteamConnected = steamStatus.connected;
  } catch {
    // non-critical — library renders without Steam import button
  }

  const statusCounts = await libraryService.getStatusCounts({ userId });

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

  return <LibraryPageView isSteamConnected={isSteamConnected} />;
}
