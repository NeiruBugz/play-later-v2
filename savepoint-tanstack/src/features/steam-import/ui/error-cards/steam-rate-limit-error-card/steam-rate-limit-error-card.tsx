import { AlertCircle } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/shared/ui/alert";

/**
 * Steam-rate-limit error card (Slice 21 Phase D).
 *
 * Rendered when `SteamRateLimitError` is thrown (HTTP 429). Intentionally
 * has NO retry button — rate-limit-aware UX (immediate retries would just
 * compound the limit). Mirrors canonical's `steam-rate-limit-error.tsx`
 * minus the retry button.
 */
export function SteamRateLimitErrorCard({ message }: { message: string }) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Too Many Requests</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{message}</p>
            <p className="text-sm">
              Please wait a moment before trying again. This limit helps protect
              Steam&apos;s servers from being overwhelmed.
            </p>
          </div>
        </AlertDescription>
      </div>
    </Alert>
  );
}
