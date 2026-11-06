import { useState } from "react";

import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";
import { Button } from "@/shared/ui/button";
import { RatingInput } from "@/shared/ui/rating-input";
import { ResponsiveModal } from "@/shared/ui/responsive-modal";
import { Textarea } from "@/shared/ui/textarea";

import { saveDoneFollowUpFn } from "../../api/save-done-follow-up-fn";
import type { DoneFollowUpProps } from "./done-follow-up.type";

type Outcome = "FINISHED" | "LET_GO";

const OUTCOME_OPTIONS: ReadonlyArray<{ value: Outcome; label: string }> = [
  { value: "FINISHED", label: "Finished" },
  { value: "LET_GO", label: "Let go" },
];

export function DoneFollowUp({
  itemId,
  gameTitle,
  currentRating,
  onClose,
  onUndo,
  onSaved,
}: DoneFollowUpProps) {
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [rating, setRating] = useState<number | null>(currentRating);
  const [stayed, setStayed] = useState("");
  const [busy, setBusy] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleOpenChange = (open: boolean) => {
    if (!open && !busy) onClose();
  };

  const handleSave = async () => {
    const trimmedStayed = stayed.trim();
    const data = {
      id: itemId,
      ...(outcome !== null && { outcome }),
      ...(rating !== currentRating && { rating }),
      ...(trimmedStayed !== "" && { stayed: trimmedStayed }),
    };
    if (Object.keys(data).length === 1) {
      onClose();
      return;
    }
    setBusy(true);
    setErrorMessage(null);
    try {
      await saveDoneFollowUpFn({ data });
      onSaved();
      onClose();
    } catch (error) {
      setErrorMessage(getUserFacingErrorMessage(error));
      setBusy(false);
    }
  };

  const handleUndo = async () => {
    setBusy(true);
    try {
      await onUndo();
    } finally {
      onClose();
    }
  };

  return (
    <ResponsiveModal
      open
      onOpenChange={handleOpenChange}
      title={`${gameTitle} is done`}
      description="All optional."
    >
      <div className="flex flex-col gap-3">
        <fieldset className="flex flex-col gap-1.5">
          <legend className="text-sm font-medium">How did it end?</legend>
          <div className="flex gap-3">
            {OUTCOME_OPTIONS.map((option) => (
              <label
                key={option.value}
                className="flex items-center gap-1.5 text-sm"
              >
                <input
                  type="radio"
                  name="done-outcome"
                  value={option.value}
                  checked={outcome === option.value}
                  onChange={() => setOutcome(option.value)}
                />
                {option.label}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-medium">Rating</span>
          <RatingInput
            value={rating}
            readOnly={false}
            size="lg"
            onChange={setRating}
            aria-label="Rating"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label htmlFor="done-stayed" className="text-sm font-medium">
            What stayed with you?
          </label>
          <Textarea
            id="done-stayed"
            value={stayed}
            onChange={(event) => setStayed(event.target.value)}
          />
        </div>

        {errorMessage !== null ? (
          <p role="alert" className="text-sm text-destructive">
            {errorMessage}
          </p>
        ) : null}

        <div className="flex justify-end gap-1.5">
          <Button
            type="button"
            variant="ghost"
            disabled={busy}
            onClick={() => void handleUndo()}
          >
            Undo
          </Button>
          <Button
            type="button"
            variant="outline"
            disabled={busy}
            onClick={onClose}
          >
            Skip
          </Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => void handleSave()}
          >
            Save
          </Button>
        </div>
      </div>
    </ResponsiveModal>
  );
}
