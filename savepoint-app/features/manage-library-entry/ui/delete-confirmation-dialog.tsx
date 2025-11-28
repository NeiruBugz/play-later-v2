"use client";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";

import type { DeleteConfirmationDialogProps } from "./delete-confirmation-dialog.types";

export const DeleteConfirmationDialog = ({
  open,
  onOpenChange,
  onConfirm,
  itemDescription,
}: DeleteConfirmationDialogProps) => {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };
  const handleCancel = () => {
    onOpenChange(false);
  };
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Library Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete your{" "}
            <strong>{itemDescription}</strong> entry?
          </DialogDescription>
        </DialogHeader>
        <div className="py-xl">
          <p className="text-muted-foreground text-sm">
            This action cannot be undone. This will permanently delete this
            library entry.
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={handleCancel}
            aria-label="Cancel deletion"
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            aria-label="Confirm deletion"
          >
            Delete
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
