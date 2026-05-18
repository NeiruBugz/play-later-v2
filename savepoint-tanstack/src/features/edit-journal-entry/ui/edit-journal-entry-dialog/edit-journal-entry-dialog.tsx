import { useRouter } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { toast } from "sonner";

import { updateJournalEntryFn } from "@/features/edit-journal-entry/api/update-journal-entry-fn";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/dialog";

import type { EditJournalEntryDialogProps } from "./edit-journal-entry-dialog.type";

// FSD: feature/ui component invoking its own feature/api server fn directly.

const textareaClasses =
  "min-h-[140px] rounded-lg border border-border bg-card px-md py-sm text-sm text-foreground shadow-paper-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

export function EditJournalEntryDialog({
  open,
  onOpenChange,
  entry,
}: EditJournalEntryDialogProps) {
  const router = useRouter();
  const [content, setContent] = useState(entry.content);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Re-sync local state if a different entry is passed in while open.
  useEffect(() => {
    setContent(entry.content);
  }, [entry.id, entry.content]);

  const trimmed = content.trim();
  const isEmpty = trimmed.length === 0;

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isEmpty) return;
    setIsSubmitting(true);
    try {
      await updateJournalEntryFn({
        data: {
          entryId: entry.id,
          content: trimmed,
          kind: entry.kind,
          gameId: entry.gameId,
        },
      });
      setError(null);
      toast.success("Entry updated");
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
          <DialogTitle>Edit journal entry</DialogTitle>
          <DialogDescription>Update your journal entry.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="gap-md flex flex-col">
          <label className="gap-xs flex flex-col text-sm">
            <span className="sr-only">Content</span>
            <textarea
              aria-label="Content"
              className={cn(textareaClasses)}
              value={content}
              onChange={(event) => setContent(event.target.value)}
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
