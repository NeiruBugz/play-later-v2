import { useEffect, useState } from "react";

import { getStatusLabel, InLibraryIndicator } from "@/entities/library-item";
import { Button } from "@/shared/ui/button";

import type { AddConfirmationProps } from "./add-confirmation.type";
import { ADD_CONFIRMATION_DURATION_MS } from "./add-confirmation.utility";

export function AddConfirmation({
  gameTitle,
  status,
  upNextPosition,
  onStartPlaying,
  onPutInUpNext,
  onUndo,
  onDismiss,
  durationMs = ADD_CONFIRMATION_DURATION_MS,
}: AddConfirmationProps) {
  const [isBusy, setIsBusy] = useState(false);
  const alreadyInLibrary = onUndo === undefined;
  const canChangeStatus = status !== "PLAYING";

  useEffect(() => {
    const timerId = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timerId);
  }, [durationMs, onDismiss]);

  const run = async (followUp: () => Promise<boolean>) => {
    setIsBusy(true);
    const saved = await followUp();
    if (saved) onDismiss();
    else setIsBusy(false);
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ pointerEvents: "auto" }}
      className="bg-background text-foreground border-border gap-sm p-md flex w-full flex-col rounded-md border shadow-lg"
    >
      <p className="body-sm font-medium">
        {alreadyInLibrary
          ? `${gameTitle} is already in your library`
          : `Added ${gameTitle} to ${getStatusLabel(status)}`}
      </p>
      {alreadyInLibrary ? (
        <InLibraryIndicator status={status} upNextPosition={upNextPosition} />
      ) : null}
      <div className="gap-xs flex flex-wrap">
        {onStartPlaying && canChangeStatus ? (
          <Button
            type="button"
            size="sm"
            disabled={isBusy}
            onClick={() => void run(onStartPlaying)}
          >
            Start playing
          </Button>
        ) : null}
        {onPutInUpNext && canChangeStatus && upNextPosition === null ? (
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={isBusy}
            onClick={() => void run(onPutInUpNext)}
          >
            Put in Up Next
          </Button>
        ) : null}
        {onUndo ? (
          <Button
            type="button"
            size="sm"
            variant="ghost"
            disabled={isBusy}
            onClick={() => void run(onUndo)}
          >
            Undo
          </Button>
        ) : null}
      </div>
    </div>
  );
}
