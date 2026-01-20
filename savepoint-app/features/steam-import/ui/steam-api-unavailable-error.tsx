import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

type SteamApiUnavailableErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function SteamApiUnavailableError({
  message,
  onRetry,
}: SteamApiUnavailableErrorProps) {
  return (
    <Alert variant="warning">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Steam Service Unavailable</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{message}</p>
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
