import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { updateJournalEntryFn } from "@/features/edit-journal-entry/api/update-journal-entry-fn";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

import type { EditJournalEntryFormProps } from "./edit-journal-entry-form.type";

// FSD: feature/ui component invoking its own feature/api server fn directly
// (no useServerFn) — mirrors the EditJournalEntryDialog precedent. This is the
// full-page variant used by the `/journal/$id/edit` route (Slice 23 page
// restore).

export function EditJournalEntryForm({ entry }: EditJournalEntryFormProps) {
  const navigate = useNavigate();
  const [content, setContent] = useState(entry.content);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
      // Canonical parity: back to the entry's detail page on success.
      await navigate({ to: "/journal/$id", params: { id: entry.id } });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    void navigate({ to: "/journal/$id", params: { id: entry.id } });
  };

  return (
    <form onSubmit={handleSubmit} className="gap-md flex flex-col">
      <label className="gap-xs flex flex-col text-sm">
        <span className="sr-only">Content</span>
        <Textarea
          aria-label="Content"
          className="min-h-[200px]"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
      </label>

      {error !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}

      <div className="gap-sm flex justify-end">
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
