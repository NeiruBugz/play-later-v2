"use client";

import { useState } from "react";
import { Drawer } from "vaul";

import { Button } from "@/shared/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import { useMediaQuery } from "@/shared/hooks/use-media-query";

interface DeleteEntryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: () => void | Promise<void>;
  entryTitle?: string | null;
}

function DeleteEntryContent({
  isDeleting,
  onConfirm,
  onCancel,
}: {
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <>
      <div className="py-xl">
        <p className="text-muted-foreground text-sm">
          This action cannot be undone. This will permanently delete this
          journal entry.
        </p>
      </div>
      <div className="gap-md flex flex-col-reverse sm:flex-row sm:justify-end">
        <Button
          variant="outline"
          onClick={onCancel}
          disabled={isDeleting}
          aria-label="Cancel deletion"
        >
          Cancel
        </Button>
        <Button
          variant="destructive"
          onClick={onConfirm}
          disabled={isDeleting}
          aria-label="Confirm deletion"
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </Button>
      </div>
    </>
  );
}

export function DeleteEntryDialog({
  open,
  onOpenChange,
  onConfirm,
  entryTitle,
}: DeleteEntryDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const isMobile = useMediaQuery("(max-width: 767px)");

  const displayTitle = entryTitle || "this entry";

  const handleConfirm = async () => {
    setIsDeleting(true);
    try {
      await onConfirm();
      onOpenChange(false);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCancel = () => {
    onOpenChange(false);
  };

  if (isMobile) {
    return (
      <Drawer.Root open={open} onOpenChange={onOpenChange}>
        <Drawer.Portal>
          <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
          <Drawer.Content className="bg-background fixed inset-x-0 bottom-0 z-50 flex flex-col rounded-t-xl">
            <div className="mt-lg bg-muted mx-auto h-1.5 w-12 shrink-0 rounded-full" />
            <div className="p-lg space-y-lg pb-[calc(var(--space-lg)+env(safe-area-inset-bottom))]">
              <div>
                <Drawer.Title className="text-lg font-semibold">
                  Delete Journal Entry
                </Drawer.Title>
                <Drawer.Description className="text-muted-foreground mt-sm text-sm">
                  Are you sure you want to delete{" "}
                  <strong>{displayTitle}</strong>?
                </Drawer.Description>
              </div>
              <DeleteEntryContent
                isDeleting={isDeleting}
                onConfirm={handleConfirm}
                onCancel={handleCancel}
              />
            </div>
          </Drawer.Content>
        </Drawer.Portal>
      </Drawer.Root>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete Journal Entry</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete <strong>{displayTitle}</strong>?
          </DialogDescription>
        </DialogHeader>
        <DeleteEntryContent
          isDeleting={isDeleting}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      </DialogContent>
    </Dialog>
  );
}
