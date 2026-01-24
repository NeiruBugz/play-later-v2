import { ProfileService } from "@/data-access-layer/services";

import { LibraryPageView } from "@/features/library/ui";
import { requireServerUserId } from "@/shared/lib/app/auth";

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
