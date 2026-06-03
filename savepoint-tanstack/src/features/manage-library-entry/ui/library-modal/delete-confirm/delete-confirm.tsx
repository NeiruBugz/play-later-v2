import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { getErrorMessage } from "@/shared/lib/errors";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import { deleteLibraryItemFn } from "../../../api/delete-library-item-fn";
import { inputClasses } from "../library-modal.utility";
import type { DeleteConfirmProps } from "./delete-confirm.type";

/**
 * Typed-name delete confirmation (F09). Removing a library entry is
 * irreversible, so the destructive button stays disabled until the user types
 * the exact game title — friction proportional to the consequence. Reached
 * from the modal's ⋯ menu, not an always-visible button.
 */
export function DeleteConfirm({
  itemId,
  gameTitle,
  onCancel,
  onDeleted,
}: DeleteConfirmProps) {
  const router = useRouter();
  const [typedTitle, setTypedTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const confirmed = typedTitle.trim() === gameTitle;

  const handleDelete = async () => {
    if (!confirmed) return;
    setIsDeleting(true);
    try {
      await deleteLibraryItemFn({ data: { itemId } });
      setError(null);
      toast.success("Removed from library");
      await router.invalidate();
      onDeleted();
    } catch (err: unknown) {
      const message = getErrorMessage(err, "Failed to remove from library");
      setError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="border-border gap-sm pt-md flex flex-col border-t">
      <p className="text-sm">
        This permanently removes <strong>{gameTitle}</strong> from your library.
        Type the title to confirm.
      </p>
      <input
        type="text"
        autoComplete="off"
        aria-label="Type the game title to confirm deletion"
        placeholder={gameTitle}
        className={cn(inputClasses)}
        value={typedTitle}
        onChange={(event) => setTypedTitle(event.target.value)}
      />
      {error !== null ? (
        <p role="alert" className="text-destructive text-sm">
          {error}
        </p>
      ) : null}
      <div className="gap-sm flex">
        <Button
          type="button"
          variant="destructive"
          onClick={handleDelete}
          disabled={!confirmed || isDeleting}
        >
          Delete
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isDeleting}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
