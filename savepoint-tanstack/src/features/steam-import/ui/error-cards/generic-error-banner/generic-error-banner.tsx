import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

import type { SteamErrorCardProps } from "../steam-error-card.type";

/**
 * Generic error banner (Slice 21 Phase D).
 *
 * Catch-all for any non-Steam-typed error that bubbles to the `/steam/games`
 * route. Renders the raw error message + a single "Try Again" affordance.
 */
export function GenericErrorBanner({ message, onRetry }: SteamErrorCardProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Something went wrong</AlertTitle>
        <AlertDescription>
          <p>{message}</p>
        </AlertDescription>
        {onRetry && (
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            className="mt-2"
          >
            Try Again
          </Button>
        )}
      </div>
    </Alert>
  );
}
