import { useEffect, useState, type FormEvent } from "react";

import { PROMPT_QUESTION } from "@/entities/journal-entry";
import { getStatusLabel, InLibraryIndicator } from "@/entities/library-item";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";

import type { AddConfirmationProps } from "./add-confirmation.type";
import { ADD_CONFIRMATION_DURATION_MS } from "./add-confirmation.utility";

export function AddConfirmation({
  gameTitle,
  status,
  upNextPosition,
  onStartPlaying,
  onPutInUpNext,
  onSaveWhy,
  onUndo,
  onDismiss,
  durationMs = ADD_CONFIRMATION_DURATION_MS,
}: AddConfirmationProps) {
  const [isBusy, setIsBusy] = useState(false);
  const [why, setWhy] = useState("");
  const [isWhyFocused, setIsWhyFocused] = useState(false);
  const alreadyInLibrary = onUndo === undefined;
  const canChangeStatus = status !== "PLAYING";

  const showWhy = onSaveWhy !== undefined && !alreadyInLibrary;
  const isTypingWhy = isWhyFocused || why !== "";

  useEffect(() => {
    if (isTypingWhy) return;
    const timerId = window.setTimeout(onDismiss, durationMs);
    return () => window.clearTimeout(timerId);
  }, [durationMs, onDismiss, isTypingWhy]);

  const run = async (followUp: () => Promise<boolean>) => {
    setIsBusy(true);
    const saved = await followUp();
    if (saved) onDismiss();
    else setIsBusy(false);
  };

  const saveWhy = (event: FormEvent) => {
    event.preventDefault();
    if (!onSaveWhy || isBusy || why.trim() === "") return;
    void run(() => onSaveWhy(why.trim()));
  };

  return (
    <div
      role="status"
      aria-live="polite"
      style={{ pointerEvents: "auto" }}
      className="bg-background text-foreground border-border flex w-full flex-col gap-1.5 rounded-md border p-2 shadow-lg"
    >
      <p className="text-sm">
        {alreadyInLibrary
          ? `${gameTitle} is already in your library`
          : `Added ${gameTitle} to ${getStatusLabel(status)}`}
      </p>
      {alreadyInLibrary ? (
        <InLibraryIndicator status={status} upNextPosition={upNextPosition} />
      ) : null}
      {showWhy ? (
        <form onSubmit={saveWhy} className="flex flex-col gap-1">
          <label htmlFor="add-confirmation-why" className="text-sm">
            {PROMPT_QUESTION.WHY}
          </label>
          <div className="flex gap-1">
            <Input
              id="add-confirmation-why"
              value={why}
              disabled={isBusy}
              onChange={(event) => setWhy(event.target.value)}
              onFocus={() => setIsWhyFocused(true)}
              onBlur={() => setIsWhyFocused(false)}
              className="h-8 min-w-0 flex-1"
            />
            <Button
              type="submit"
              size="sm"
              variant="outline"
              disabled={isBusy || why.trim() === ""}
            >
              Save
            </Button>
          </div>
        </form>
      ) : null}
      <div className="flex flex-wrap gap-1">
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
