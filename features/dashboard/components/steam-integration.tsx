import { ExternalLink } from "lucide-react";
import Link from "next/link";
import { FaSteam } from "react-icons/fa";

import { getSteamIntegrationConnectionState } from "@/features/dashboard/server-actions/get-steam-integration-connection-state";
import { Body } from "@/shared/components/typography";
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
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FaSteam />
          Steam Integration
        </CardTitle>
        <CardDescription>
          {isConnected
            ? "Sync your library from Steam"
            : "Connect your Steam account"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isConnected ? (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-green-500">
              <div className="size-2 rounded-full bg-current" />
              <Body size="sm" className="font-medium text-current">
                Connected
              </Body>
            </div>
            {steamProfileURL && (
              <Link
                href={steamProfileURL}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="w-full">
                  <ExternalLink />
                  View Profile
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-muted-foreground">
              <div className="size-2 rounded-full bg-current" />
              <Body size="sm" className="text-current">
                Not connected
              </Body>
            </div>
            <Link href="/user/settings?tab=integrations" className="w-full">
              <Button variant="outline" size="sm" className="w-full">
                <FaSteam />
                Connect Steam
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
