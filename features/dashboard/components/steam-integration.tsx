import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { FaSteam } from "react-icons/fa";

import { getSteamIntegrationConnectionState } from "@/features/dashboard/server-actions/get-steam-integration-connection-state";
import { Button } from "@/shared/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";

export async function SteamIntegration() {
  const { data } = await getSteamIntegrationConnectionState();

  const isConnected = data?.isConnected;
  const steamProfileURL = data?.steamProfileURL;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <FaSteam className="size-5" />
          Steam Integration
        </CardTitle>
        <CardDescription>
          {isConnected ? "Connected to Steam" : "Connect your Steam account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-600 dark:text-green-400">
              <div className="size-2 rounded-full bg-green-600 dark:bg-green-400" />
              <span className="text-sm font-medium">Connected</span>
            </div>
            {steamProfileURL && (
              <Link
                href={steamProfileURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="size-4" />
                  View Profile
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="size-2 rounded-full bg-muted-foreground" />
              <span className="text-sm">Not connected</span>
            </div>
            <Link href="/user/settings?tab=integrations">
              <Button
                variant="outline"
                size="sm"
                className="flex items-center gap-2"
              >
                <FaSteam className="size-4" />
                Connect Steam
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
