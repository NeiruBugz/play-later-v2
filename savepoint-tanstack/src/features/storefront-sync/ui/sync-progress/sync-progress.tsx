import { Loader2 } from "lucide-react";

import { cn } from "@/shared/lib/utils";

import { isSyncActive, useSteamSyncStatus } from "../steam-sync-status";
import type { SyncProgressProps } from "./sync-progress.type";
import { getSyncStageText } from "./sync-progress.utility";

export function SyncProgress({ variant }: SyncProgressProps) {
  const { data: syncStatus } = useSteamSyncStatus();

  if (!syncStatus || !isSyncActive(syncStatus)) return null;

  const stageText = getSyncStageText(syncStatus);

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label={stageText}
      className={cn(
        "flex items-center gap-2 text-muted-foreground",
        variant === "page"
          ? "rounded-xl border bg-card px-4 py-3 text-sm"
          : "text-xs"
      )}
    >
      <Loader2 className="size-4 shrink-0 animate-spin" aria-hidden />
      <span>{stageText}</span>
    </div>
  );
}
