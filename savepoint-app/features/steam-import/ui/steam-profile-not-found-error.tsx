import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

type SteamProfileNotFoundErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function SteamProfileNotFoundError({
  message,
  onRetry,
}: SteamProfileNotFoundErrorProps) {
  return (
    <Alert variant="destructive">
      <AlertCircle className="h-5 w-5" />
      <div className="flex-1 space-y-3">
        <AlertTitle>Steam Profile Not Found</AlertTitle>
        <AlertDescription>
          <div className="space-y-2">
            <p>{message}</p>
            <div className="text-sm">
              <p className="font-semibold">Valid formats:</p>
              <ul className="ml-4 list-disc space-y-1">
                <li>
                  <strong>Steam ID64:</strong> A 17-digit number (e.g.,
                  76561198012345678)
                </li>
                <li>
                  <strong>Custom URL:</strong> Your profile name from
                  steamcommunity.com/id/yourname
                </li>
              </ul>
            </div>
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
