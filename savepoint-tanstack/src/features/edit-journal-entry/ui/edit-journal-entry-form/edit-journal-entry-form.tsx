import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { updateJournalEntryFn } from "@/features/edit-journal-entry/api/update-journal-entry-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Textarea } from "@/shared/ui/textarea";

import type { EditJournalEntryFormProps } from "./edit-journal-entry-form.type";

const MINUTES_PER_HOUR = 60;
const HOUR_STEP = 0.5;

function minutesToHoursInput(minutes: number | null): string {
  return minutes === null ? "" : String(minutes / MINUTES_PER_HOUR);
}

function hoursInputToMinutes(hours: string): number | null {
  const parsed = Number(hours);
  return parsed > 0 ? Math.round(parsed * MINUTES_PER_HOUR) : null;
}

export function EditJournalEntryForm({ entry }: EditJournalEntryFormProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState(entry.content);
  const [hours, setHours] = useState(minutesToHoursInput(entry.playedMinutes));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = content.trim();
  const playedMinutes = hoursInputToMinutes(hours);
  const isEmpty = trimmed.length === 0 && playedMinutes === null;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmpty) return;
    setIsSubmitting(true);
    try {
      await updateJournalEntryFn({
        data: {
          id: entry.id,
          content: trimmed,
          playedMinutes,
        },
      });
      setError(null);
      toast.success("Note updated");
      // Canonical parity: back to the entry's detail page on success.
      await navigate({ to: "/journal/$id", params: { id: entry.id } });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Something went wrong");
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    void navigate({ to: "/journal/$id", params: { id: entry.id } });
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-2">
      <label className="flex flex-col gap-1 text-sm">
        <span className="sr-only">Content</span>
        <Textarea
          aria-label="Content"
          className="min-h-[200px]"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>

      {entry.gameId !== null ? (
        <label className="flex flex-col gap-1 text-sm">
          <span>Time played (hours)</span>
          <Input
            type="number"
            inputMode="decimal"
            min={0}
            step={HOUR_STEP}
            value={hours}
            onChange={(event) => setHours(event.target.value)}
            className="w-40"
          />
        </label>
      ) : null}

      {error !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-1.5">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting || isEmpty}>
          Save
        </Button>
      </div>
    </form>
  );
}
