"use client";

import { Pencil } from "lucide-react";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

import { JournalQuickEntrySheet } from "./journal-quick-entry-sheet";

export function JournalFab() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        onClick={() => setIsOpen(true)}
        size="lg"
        className={cn(
          "fixed z-40",
          "right-6 bottom-24 md:right-8 md:bottom-8",
          "h-14 w-14 rounded-full shadow-lg",
          "transition-all duration-200",
          "hover:scale-110 hover:shadow-xl",
          "focus-visible:ring-2 focus-visible:ring-offset-2"
        )}
        aria-label="Quick journal entry"
      >
        <Pencil className="h-5 w-5" />
      </Button>

      <JournalQuickEntrySheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
