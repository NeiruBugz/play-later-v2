import { Link } from "@tanstack/react-router";
import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

import type { SteamErrorCardProps } from "../steam-error-card.type";

/**
 * Steam-profile-not-found error card (Slice 21 Phase D).
 *
 * Rendered when `SteamProfileNotFoundError` is thrown (the stored
 * `steamId64` no longer resolves on Steam). Mirrors canonical but swaps the
 * "Valid formats" hint for a "Reconnect" link to `/settings/account`,
 * since tanstack's Phase B OpenID flow does not expose a manual SteamID
 * input (see `<ImportPathSelector/>` divergence in DIVERGENCES.md).
 */
export function SteamProfileNotFoundErrorCard({
  message,
  onRetry,
}: SteamErrorCardProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Steam Profile Not Found</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
        </AlertDescription>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <Link to="/settings/account">Reconnect Steam</Link>
          </Button>
          {onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              Try Again
            </Button>
          )}
        </div>
      </div>
    </Alert>
  );
}
