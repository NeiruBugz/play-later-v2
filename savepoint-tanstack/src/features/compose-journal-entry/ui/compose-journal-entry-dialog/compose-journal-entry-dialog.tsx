import { useRouter } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";
import { Textarea } from "@/shared/ui/textarea";

import type { ComposeJournalEntryDialogProps } from "./compose-journal-entry-dialog.type";

// FSD: feature/ui component invoking its own feature/api server fn directly
// (no useServerFn) — mirrors the LibraryModal precedent.

export function ComposeJournalEntryDialog({
  open,
  onOpenChange,
  defaultGameId,
}: ComposeJournalEntryDialogProps) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmed = content.trim();
  const isEmpty = trimmed.length === 0;

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
        },
      });
      setError(null);
      setContent("");
      toast.success("Entry posted");
      await router.invalidate();
      onOpenChange(false);
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New journal entry</DialogTitle>
          <DialogDescription>
            Log a quick note about what you played.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="gap-md flex flex-col">
          <label className="gap-xs flex flex-col text-sm">
            <span className="sr-only">Content</span>
            <Textarea
              aria-label="Content"
              className="min-h-[140px]"
              value={content}
              onChange={(event) => setContent(event.target.value)}
              placeholder="What happened in your session?"
            />
          </label>

          {error !== null ? (
            <p role="alert" className="text-destructive text-sm">
              {error}
            </p>
          ) : null}

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
        </form>
      </DialogContent>
    </Dialog>
  );
}
