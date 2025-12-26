"use client";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/shared/components/ui/dialog";
import type { JournalEntryDomain } from "@/shared/types";

import { JournalEntryQuickForm } from "./journal-entry-quick-form";

interface JournalEntryDialogDesktopProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  onSuccess: (entry: JournalEntryDomain) => void;
}

export function JournalEntryDialogDesktop({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onSuccess,
}: JournalEntryDialogDesktopProps) {
  const handleSuccess = (entry: JournalEntryDomain) => {
    onSuccess(entry);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-[500px]">
        <DialogHeader className="border-border/50 px-2xl pb-lg pt-2xl border-b">
          <DialogTitle className="font-serif text-xl">
            Capture a thought
          </DialogTitle>
          <DialogDescription className="text-muted-foreground/80">
            {gameTitle}
          </DialogDescription>
        </DialogHeader>

        <div className="p-2xl">
          <JournalEntryQuickForm
            gameId={gameId}
            onSuccess={handleSuccess}
            onCancel={onClose}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
}
