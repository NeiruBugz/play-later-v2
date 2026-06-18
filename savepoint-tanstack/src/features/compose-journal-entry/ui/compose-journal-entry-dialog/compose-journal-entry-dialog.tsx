import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { useIsDesktop } from "@/shared/lib/use-media-query";
import { Button } from "@/shared/ui/button";
import { DialogFooter } from "@/shared/ui/dialog";
import { Input } from "@/shared/ui/input";
import { ResponsiveModal } from "@/shared/ui/responsive-modal";
import { SheetFooter } from "@/shared/ui/sheet";
import { Textarea } from "@/shared/ui/textarea";

import type { ComposeJournalEntryDialogProps } from "./compose-journal-entry-dialog.type";

const OPTIONAL_THOUGHTS_HINT =
  "Playtime alone is a complete entry — thoughts are optional.";

export function ComposeJournalEntryDialog({
  open,
  onOpenChange,
  defaultGameId,
}: ComposeJournalEntryDialogProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [content, setContent] = useState("");
  const [minutes, setMinutes] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = content.trim();
  const isEmpty = trimmed.length === 0;

  const parsedMinutes = Number.parseInt(minutes, 10);
  const playedMinutes =
    Number.isInteger(parsedMinutes) && parsedMinutes > 0
      ? parsedMinutes
      : undefined;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmpty) return;
    setIsSubmitting(true);
    try {
      await createJournalEntryFn({
        data: {
          content: trimmed,
          kind: "QUICK",
          gameId: defaultGameId ?? null,
          ...(playedMinutes !== undefined ? { playedMinutes } : {}),
        },
      });
      setError(null);
      setContent("");
      setMinutes("");
      toast.success("Entry posted");
      await router.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Something went wrong");
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const formBody = (
    <form onSubmit={handleSubmit} className="gap-md flex flex-col">
      <label className="gap-xs flex flex-col text-sm">
        <span className="sr-only">Content</span>
        <Textarea
          aria-label="Content"
          className="min-h-[160px] flex-1"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder="What happened in your session?"
        />
      </label>

      <p className="text-muted-foreground text-xs">{OPTIONAL_THOUGHTS_HINT}</p>

      <label className="gap-xs flex flex-col text-sm">
        <span className="text-muted-foreground">Time played (minutes)</span>
        <Input
          type="number"
          inputMode="numeric"
          min={1}
          step={1}
          aria-label="Time played (minutes)"
          value={minutes}
          onChange={(event) => setMinutes(event.target.value)}
          placeholder="Optional"
        />
      </label>

      {error !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      {isDesktop ? (
        <DialogFooter>
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
        </DialogFooter>
      ) : (
        <SheetFooter>
          <Button type="submit" disabled={isSubmitting || isEmpty}>
            Save
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={handleCancel}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
        </SheetFooter>
      )}
    </form>
  );

  return (
    <ResponsiveModal
      open={open}
      onOpenChange={onOpenChange}
      title="New journal entry"
      description="Log a quick note about what you played."
      contentClassName="flex max-h-[90vh] flex-col"
    >
      {formBody}
    </ResponsiveModal>
  );
}
