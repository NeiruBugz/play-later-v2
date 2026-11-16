import { Alert, AlertDescription } from "@/shared/ui/alert";

import { syncFailureMessage } from "../../lib";
import { useSteamSyncStatus } from "../steam-sync-status";

export function SyncFailureAlert() {
  const { data: syncStatus } = useSteamSyncStatus();

  if (syncStatus?.status !== "FAILED") return null;

  return (
    <Alert variant="error">
      <AlertDescription>
        {syncFailureMessage(syncStatus.failureCode)}
      </AlertDescription>
    </Alert>
  );
}
