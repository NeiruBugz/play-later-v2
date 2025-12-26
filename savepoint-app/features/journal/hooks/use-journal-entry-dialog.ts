"use client";

import { useRouter } from "next/navigation";
import { useCallback, useState } from "react";

import type { JournalEntryDomain } from "@/shared/types";

interface UseJournalEntryDialogOptions {
  onEntryCreated?: (entry: JournalEntryDomain) => void;
}

interface UseJournalEntryDialogReturn {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  onSuccess: (entry: JournalEntryDomain) => void;
}

export function useJournalEntryDialog(
  options: UseJournalEntryDialogOptions = {}
): UseJournalEntryDialogReturn {
  const [isOpen, setIsOpen] = useState(false);
  const router = useRouter();

  const open = useCallback(() => {
    setIsOpen(true);
  }, []);

  const close = useCallback(() => {
    setIsOpen(false);
  }, []);

  const onSuccess = useCallback(
    (entry: JournalEntryDomain) => {
      setIsOpen(false);
      options.onEntryCreated?.(entry);
      router.refresh();
    },
    [options, router]
  );

  return {
    isOpen,
    open,
    close,
    onSuccess,
  };
}
