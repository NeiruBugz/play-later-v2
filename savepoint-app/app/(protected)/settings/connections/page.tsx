import { isSuccessResult, ProfileService } from "@/data-access-layer/services";
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
  const steamResult = await profileService.getSteamConnectionStatus({ userId });

  const steamConnectionStatus = isSuccessResult(steamResult)
    ? steamResult.data
    : { connected: false as const };

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
