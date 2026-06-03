import { useNavigate } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { toast } from "sonner";

import { createJournalEntryFn } from "@/features/compose-journal-entry/api/create-journal-entry-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import { Textarea } from "@/shared/ui/textarea";

import type { ComposeJournalEntryFormProps } from "./compose-journal-entry-form.type";

// Full-page variant used by the `/journal/new` route; the dialog variant
// lives alongside it for the game-detail quick-compose surface.

export function ComposeJournalEntryForm({
  defaultGameId,
}: ComposeJournalEntryFormProps) {
  const navigate = useNavigate();
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
      const entry = await createJournalEntryFn({
        data: {
          content: trimmed,
          kind: "QUICK",
          gameId: defaultGameId ?? null,
        },
      });
      setError(null);
      toast.success("Entry posted");
      // Canonical parity: navigate to the new entry's detail page.
      await navigate({ to: "/journal/$id", params: { id: entry.id } });
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Something went wrong");
      setError(message);
      toast.error(message);
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    void navigate({ to: "/journal" });
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
          placeholder="What happened in your session?"
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
