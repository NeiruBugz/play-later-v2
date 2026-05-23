import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";
import { Button } from "@/shared/ui/button";

import type { SteamErrorCardProps } from "../steam-error-card.type";

/**
 * Steam-API-unavailable error card (Slice 21 Phase D).
 *
 * Rendered when the import worker propagates `SteamApiUnavailableError`
 * (5xx or network failure). Mirrors canonical's `steam-api-unavailable-error
 * .tsx`.
 */
export function SteamApiUnavailableErrorCard({
  message,
  onRetry,
}: SteamErrorCardProps) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Steam Service Unavailable</AlertTitle>
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
