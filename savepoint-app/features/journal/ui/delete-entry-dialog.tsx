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

interface DeleteEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void;
  entryTitle?: string | null;
}

export function DeleteEntryDialog({
  open,
  onOpenChange,
  onConfirm,
  entryTitle,
}: DeleteEntryDialogProps) {
  const handleConfirm = () => {
    onConfirm();
    onOpenChange(false);
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  const displayTitle = entryTitle || "this entry";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Journal Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{displayTitle}</strong>?
          </DialogDescription>
        </DialogHeader>
        <div className="py-xl">
          <p className="text-muted-foreground text-sm">
            This action cannot be undone. This will permanently delete this
            journal entry.
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
}
