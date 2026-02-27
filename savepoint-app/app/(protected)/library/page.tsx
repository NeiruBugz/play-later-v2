import { ProfileService } from "@/data-access-layer/services";
import type { Metadata } from "next";

import { LibraryPageView } from "@/features/library/ui";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "My Library",
  description:
    "Browse and manage your game library. Filter by status, platform, and sort your collection.",
};

export const dynamic = "force-dynamic";
export default async function LibraryPage() {
  const userId = await requireServerUserId();

  const profileService = new ProfileService();
  const steamStatusResult = await profileService.getSteamConnectionStatus({
    userId,
  });

  const isSteamConnected =
    steamStatusResult.success && steamStatusResult.data.connected;

  return <LibraryPageView isSteamConnected={isSteamConnected} />;
}
