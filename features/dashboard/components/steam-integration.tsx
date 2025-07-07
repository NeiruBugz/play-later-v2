import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { FaSteam } from "react-icons/fa";

import { getSteamIntegrationConnectionState } from "@/features/dashboard/server-actions/get-steam-integration-connection-state";
import { Button } from "@/shared/components/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/components/card";

export async function SteamIntegration() {
  const { data } = await getSteamIntegrationConnectionState();

  const isConnected = data?.isConnected;
  const steamProfileURL = data?.steamProfileURL;

  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          <FaSteam className="h-5 w-5" />
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
              <div className="h-2 w-2 rounded-full bg-green-600 dark:bg-green-400"></div>
              <span className="text-sm font-medium">Connected</span>
            </div>
            {steamProfileURL && (
              <Button variant="outline" size="sm" asChild>
                <Link
                  href={steamProfileURL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2"
                >
                  <ExternalLink className="h-4 w-4" />
                  View Profile
                </Link>
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-muted-foreground"></div>
              <span className="text-sm">Not connected</span>
            </div>
            <Button variant="outline" size="sm" asChild>
              <Link
                href="/user/settings?tab=integrations"
                className="flex items-center gap-2"
              >
                <FaSteam className="h-4 w-4" />
                Connect Steam
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
