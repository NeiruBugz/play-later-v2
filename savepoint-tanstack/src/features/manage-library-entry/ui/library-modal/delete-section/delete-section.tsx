import { useRouter } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/ui/button";

import { deleteLibraryItemFn } from "../../../api/delete-library-item-fn";
import type { DeleteSectionProps } from "./delete-section.type";

export function DeleteSection({ itemId, onClose }: DeleteSectionProps) {
  const router = useRouter();

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDeleteTrigger = () => {
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteLibraryItemFn({ data: { itemId } });
      setDeleteError(null);
      setShowDeleteConfirm(false);
      toast.success("Removed from library");
      await router.invalidate();
      onClose();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      setDeleteError(message);
      toast.error(message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteConfirm(false);
    setDeleteError(null);
  };

  return (
    <div className="border-border gap-md pt-md flex flex-col border-t">
      {!showDeleteConfirm ? (
        <Button type="button" variant="outline" onClick={handleDeleteTrigger}>
          Remove from library
        </Button>
      ) : (
        <div className="gap-sm flex flex-col">
          <p className="text-sm">
            Remove this game from your library? This cannot be undone.
          </p>
          {deleteError !== null ? (
            <p role="alert" className="text-destructive text-sm">
              {deleteError}
            </p>
          ) : null}
          <div className="gap-sm flex">
            <Button
              type="button"
              variant="destructive"
              onClick={handleConfirmDelete}
              disabled={isDeleting}
            >
              Confirm
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancelDelete}
              disabled={isDeleting}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
