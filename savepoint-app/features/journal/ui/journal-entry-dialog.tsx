"use client";

import { useMediaQuery } from "@/shared/hooks/use-media-query";
import type { JournalEntryDomain } from "@/shared/types";

import { JournalEntryDialogDesktop } from "./journal-entry-dialog-desktop";
import { JournalEntryDialogMobile } from "./journal-entry-dialog-mobile";

interface JournalEntryDialogProps {
  isOpen: boolean;
  onClose: () => void;
  gameId: string;
  gameTitle: string;
  onSuccess: (entry: JournalEntryDomain) => void;
}

export function JournalEntryDialog({
  isOpen,
  onClose,
  gameId,
  gameTitle,
  onSuccess,
}: JournalEntryDialogProps) {
  const isMobile = useMediaQuery("(max-width: 767px)");

  if (isMobile) {
    return (
      <JournalEntryDialogMobile
        isOpen={isOpen}
        onClose={onClose}
        gameId={gameId}
        gameTitle={gameTitle}
        onSuccess={onSuccess}
      />
    );
  }

  return (
    <JournalEntryDialogDesktop
      isOpen={isOpen}
      onClose={onClose}
      gameId={gameId}
      gameTitle={gameTitle}
      onSuccess={onSuccess}
    />
  );
}
