"use client";

import { X } from "lucide-react";
import { Drawer } from "vaul";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";
import type { JournalEntryDomain } from "@/shared/types";

import { JournalEntryQuickForm } from "./journal-entry-quick-form";

interface JournalEntryDialogMobileProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  onSuccess: (entry: JournalEntryDomain) => void;
}

export function JournalEntryDialogMobile({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onSuccess,
}: JournalEntryDialogMobileProps) {
  const handleSuccess = (entry: JournalEntryDomain) => {
    onSuccess(entry);
    onClose();
  };

  return (
    <Drawer.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 z-50 bg-black/40" />
        <Drawer.Content
          className={cn(
            "bg-background fixed inset-x-0 bottom-0 z-50 mt-24 flex max-h-[85vh] flex-col rounded-t-xl"
          )}
        >
          <div className="mt-lg bg-muted mx-auto h-1.5 w-12 shrink-0 rounded-full" />

          <div className="border-border/50 px-lg pb-md pt-sm flex items-center justify-between border-b">
            <div className="min-w-0 flex-1">
              <Drawer.Title className="font-serif text-lg font-semibold">
                Capture a thought
              </Drawer.Title>
              <Drawer.Description className="text-muted-foreground/80 truncate text-sm">
                {gameTitle}
              </Drawer.Description>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 shrink-0"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="p-lg flex-1 overflow-y-auto">
            <JournalEntryQuickForm
              gameId={gameId}
              onSuccess={handleSuccess}
              onCancel={onClose}
            />
          </div>
        </Drawer.Content>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
