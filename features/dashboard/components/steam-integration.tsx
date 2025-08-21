import Link from "next/link";
import { FaSteam } from "react-icons/fa";

import { getSteamIntegrationConnectionState } from "@/features/dashboard/server-actions/get-steam-integration-connection-state";
import { Body, Heading } from "@/shared/components/typography";
import { Button } from "@/shared/components/ui/button";

export async function SteamIntegration() {
  const { data } = await getSteamIntegrationConnectionState();

  const isConnected = data?.isConnected;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <FaSteam className="size-5" />
        <Heading level={3} size="lg">
          Steam Integration
        </Heading>
      </div>

      <div className="space-y-3">
        <div
          className={`flex items-center gap-2 ${isConnected ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}`}
        >
          <div className="size-2 rounded-full bg-current" />
          <Body size="sm" className="font-medium text-current">
            {isConnected ? "Connected" : "Not connected"}
          </Body>
        </div>

        {!isConnected && (
          <Link href="/user/settings?tab=integrations" className="w-full">
            <Button
              variant="outline"
              size="sm"
              className="w-full justify-start"
            >
              <FaSteam className="size-4" />
              Connect Steam
            </Button>
          </Link>
        )}
      </div>
    </div>
  );
}
