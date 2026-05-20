import { Link, useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";

import { disconnectSteamFn } from "../../api/disconnect-steam";
import type { SteamConnectCardProps } from "./steam-connect-card.type";

/**
 * SteamConnectCard — settings-page card for linking / unlinking a Steam
 * account via the Steam OpenID flow.
 *
 * Two render states:
 *   - Not connected: shows a "Connect Steam Account" anchor that sends the
 *     browser to Steam's OpenID `checkid_setup` endpoint. The callback
 *     route at `/steam/callback` consumes the response and calls
 *     `connectSteamFn`.
 *   - Connected: shows the linked Steam ID, a "Disconnect" button wired to
 *     `disconnectSteamFn`, and an `Alert` hint reminding the user to set
 *     their Steam profile to public (full privacy round-trip is deferred to
 *     a later slice — see DIVERGENCES.md).
 *
 * Connect-success feedback is intentionally the visual flip from
 * "Connect Steam" → "Steam connected" after the loader re-reads
 * `user.steamId64`. No success toast on connect (the redirect leaves the
 * page; firing a toast across navigations adds query-param plumbing for
 * minimal UX gain).
 */
export function SteamConnectCard({
  steamId,
  connectUrl,
}: SteamConnectCardProps) {
  const router = useRouter();
  const [pending, setPending] = useState(false);

  if (steamId === null) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Connect Steam</CardTitle>
          <CardDescription>
            Link your Steam account to import your game library.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href={connectUrl} rel="noreferrer">
              Connect Steam Account
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDisconnect = async () => {
    setPending(true);
    try {
      await disconnectSteamFn({ data: {} });
      toast.success("Steam disconnected");
      router.invalidate();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Could not disconnect Steam";
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle>Steam connected</CardTitle>
        <CardDescription>Steam ID: {steamId}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert variant="info">
          <AlertDescription>
            If you don&apos;t see games shortly, check your Steam profile
            privacy settings.
          </AlertDescription>
        </Alert>
        <Button
          type="button"
          variant="destructive"
          onClick={handleDisconnect}
          disabled={pending}
        >
          Disconnect
        </Button>
        {/* Slice 21 Phase D — discoverability link to /steam/games */}
        <Button variant="outline" asChild>
          <Link to="/steam/games">View imported games</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
