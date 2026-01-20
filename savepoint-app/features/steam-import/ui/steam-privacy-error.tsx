import { AlertCircle, ExternalLink } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/shared/components/ui/alert";
import { Button } from "@/shared/components/ui/button";

const STEAM_PRIVACY_SETTINGS_URL =
  "https://steamcommunity.com/my/edit/settings";

type SteamPrivacyErrorProps = {
  message: string;
  onRetry?: () => void;
};

export function SteamPrivacyError({
  message,
  onRetry,
}: SteamPrivacyErrorProps) {
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
              <li>Set "Game details" to "Public"</li>
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
