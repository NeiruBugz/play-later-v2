import { ProfileService } from "@/data-access-layer/services";
import type { SteamConnectionStatus } from "@/data-access-layer/services/profile/types";
import type { Metadata } from "next";

import { SteamConnectCard } from "@/features/steam-import";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import { requireServerUserId } from "@/shared/lib/app/auth";

export const metadata: Metadata = {
  title: "Connected Systems",
  description: "Manage your SavePoint connections",
};

export default async function ConnectedSystemsPage() {
  const userId = await requireServerUserId();
  const profileService = new ProfileService();

  let steamConnectionStatus: SteamConnectionStatus = { connected: false };
  try {
    steamConnectionStatus = await profileService.getSteamConnectionStatus({
      userId,
    });
  } catch {
    // non-critical — page renders with disconnected state
  }

  return (
    <div>
      <h2 className="text-h2 mb-2xl">Connected Systems</h2>

      <Card className="hover:none w-full">
        <CardHeader>
          <CardTitle>Connected Accounts</CardTitle>
          <CardDescription>
            Connect your gaming platform accounts to import your library
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2xl">
          <SteamConnectCard initialStatus={steamConnectionStatus} />
        </CardContent>
      </Card>
    </div>
  );
}
