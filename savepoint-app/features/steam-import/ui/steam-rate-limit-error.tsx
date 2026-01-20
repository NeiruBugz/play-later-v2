import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

type SteamRateLimitErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function SteamRateLimitError({
  message,
  onRetry,
}: SteamRateLimitErrorProps) {
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
              Steam's servers from being overwhelmed.
            </p>
          </div>
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
