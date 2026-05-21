import { useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { deleteJournalEntryFn } from "@/features/delete-journal-entry/api/delete-journal-entry-fn";
import { Button } from "@/shared/ui/button";

import type { DeleteJournalEntryButtonProps } from "./delete-journal-entry-button.type";

// FSD: feature/ui component invoking its own feature/api server fn directly
// (no useServerFn) — mirrors the DeleteJournalEntryDialog precedent. This is
// the page variant used by the `/journal/$id` detail route (Slice 23 page
// restore): a single inline confirm → delete → navigate to `/journal`.

export function DeleteJournalEntryButton({
  entryId,
}: DeleteJournalEntryButtonProps) {
  const navigate = useNavigate();
  const [confirming, setConfirming] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await deleteJournalEntryFn({ data: { entryId } });
      toast.success("Entry deleted");
      // Canonical parity: back to the timeline after delete.
      await navigate({ to: "/journal" });
    } catch (err: unknown) {
      const message =
        err instanceof Error ? err.message : "Something went wrong";
      toast.error(message);
      setIsDeleting(false);
      setConfirming(false);
    }
  };

  if (confirming) {
    return (
      <div className="gap-sm flex items-center">
        <Button
          type="button"
          variant="outline"
          onClick={() => setConfirming(false)}
          disabled={isDeleting}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          onClick={handleConfirm}
          disabled={isDeleting}
        >
          Confirm delete
        </Button>
      </div>
    );
  }

  return (
    <Button
      type="button"
      variant="destructive"
      onClick={() => setConfirming(true)}
    >
      Delete
    </Button>
  );
}
