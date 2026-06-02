import { Link } from "@tanstack/react-router";
import { Download } from "lucide-react";
import { useState } from "react";
import { IconContext } from "react-icons";
import { FaSteam } from "react-icons/fa";

import { useMutationAction } from "@/shared/lib/use-mutation-action";
import { Alert, AlertDescription } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import { disconnectSteamFn } from "../../api/disconnect-steam";
import type { SteamConnectCardProps } from "./steam-connect-card.type";

/**
 * SteamConnectCard — settings-page card for linking / unlinking a Steam
 * account via the Steam OpenID flow.
 *
 * Aligned to canonical `savepoint-app/features/steam-import/ui/steam-connect-card.tsx`:
 *   - Steam glyph (`FaSteam`) beside both titles.
 *   - Copy parity: "Connect Steam Account" / "Steam Account Connected", the
 *     longer connect description, and the "Manage Imported Games" link.
 *   - Disconnect is gated behind a confirmation Dialog with canonical's
 *     "imported games will be preserved" explanatory copy.
 *
 * Documented divergences (kept):
 *   - Connect uses Steam OpenID redirect (`connectUrl`) rather than the
 *     manual Steam-ID form + Steam Web API the canonical card also offers.
 *   - The connected state shows the linked Steam ID only — tanstack does not
 *     plumb the Steam avatar/display name (no Steam-profile fetch on this
 *     path). A privacy `Alert` hint is shown instead.
 *   - No connect-success toast (the redirect leaves the page); success is the
 *     visual flip after the loader re-reads `user.steamId64`.
 */
function SteamIcon({ className }: { className?: string }) {
  return (
    <IconContext.Provider value={{ className }}>
      <FaSteam />
    </IconContext.Provider>
  );
}

export function SteamConnectCard({
  steamId,
  connectUrl,
}: SteamConnectCardProps) {
  const { pending, run } = useMutationAction();
  const [showDisconnectDialog, setShowDisconnectDialog] = useState(false);

  if (steamId === null) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SteamIcon className="h-5 w-5" />
            Connect Steam Account
          </CardTitle>
          <CardDescription>
            Link your Steam account to import your game library and sync your
            collection.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild>
            <a href={connectUrl} rel="noreferrer">
              <SteamIcon className="h-4 w-4" />
              Sign in with Steam
            </a>
          </Button>
        </CardContent>
      </Card>
    );
  }

  const handleDisconnect = async () => {
    await run(() => disconnectSteamFn({ data: {} }), {
      successMessage: "Steam disconnected",
      errorFallback: "Could not disconnect Steam",
      onSuccess: () => setShowDisconnectDialog(false),
    });
  };

  return (
    <>
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <SteamIcon className="h-5 w-5" />
            Steam Account Connected
          </CardTitle>
          <CardDescription>Steam ID: {steamId}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert variant="info">
            <AlertDescription>
              If you don&apos;t see games shortly, check your Steam profile
              privacy settings.
            </AlertDescription>
          </Alert>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="destructive"
              onClick={() => setShowDisconnectDialog(true)}
              disabled={pending}
            >
              Disconnect
            </Button>
            <Button variant="outline" asChild>
              <Link to="/steam/games">
                <Download className="h-4 w-4" aria-hidden="true" />
                Manage Imported Games
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog
        open={showDisconnectDialog}
        onOpenChange={setShowDisconnectDialog}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Disconnect Steam Account</DialogTitle>
            <DialogDescription>
              Are you sure you want to disconnect your Steam account? Your
              imported games will be preserved in your library, but you will
              need to reconnect to import new games or update your Steam data.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowDisconnectDialog(false)}
              disabled={pending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="destructive"
              onClick={handleDisconnect}
              disabled={pending}
            >
              Disconnect
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
