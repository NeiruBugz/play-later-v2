import { AlertCircle, ExternalLink } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

import type { SteamErrorCardProps } from "../steam-error-card.type";

const STEAM_PRIVACY_SETTINGS_URL =
  "https://steamcommunity.com/my/edit/settings";

/**
 * Steam-profile-privacy error card (Slice 21 Phase D).
 *
 * Rendered by the `/steam/games` route's `errorComponent` when the import
 * worker propagates a `SteamProfilePrivateError` (private game-details on
 * the user's Steam profile). Mirrors `savepoint-app/features/steam-import/
 * ui/steam-privacy-error.tsx`, swapped onto Slice 18's `Alert` primitive.
 */
export function SteamPrivacyErrorCard({
  message,
  onRetry,
}: SteamErrorCardProps) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Steam Profile Privacy Settings</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{message}</p>
            <ol className="ml-4 list-decimal space-y-1 text-sm">
              <li>Visit your Steam Privacy Settings</li>
              <li>Set &quot;Game details&quot; to &quot;Public&quot;</li>
              <li>Return here and try again</li>
            </ol>
          </div>
        </AlertDescription>
        <div className="mt-2 flex gap-2">
          <Button variant="outline" size="sm" asChild>
            <a
              href={STEAM_PRIVACY_SETTINGS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="h-4 w-4" />
              Open Privacy Settings
            </a>
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
