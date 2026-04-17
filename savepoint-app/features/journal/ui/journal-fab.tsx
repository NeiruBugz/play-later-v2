"use client";

import { Pencil } from "lucide-react";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { Button } from "@/shared/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/shared/components/ui/tooltip";
import { cn } from "@/shared/lib/ui/utils";

import { JournalQuickEntrySheet } from "./journal-quick-entry-sheet";

// Pages that already expose their own primary journal CTA — hide the FAB
// to avoid duplicate entry points.
const HIDDEN_PATHNAMES = [/^\/journal(?:\/|$)/, /^\/games\/[^/]+$/];

export function JournalFab() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname && HIDDEN_PATHNAMES.some((re) => re.test(pathname))) {
    return null;
  }

  return (
    <>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              onClick={() => setIsOpen(true)}
              size="lg"
              className={cn(
                // Mobile users reach the journal via the bottom nav; avoid the
                // floating + bottom-bar double paradigm by hiding the FAB
                // below the md breakpoint.
                "fixed z-40 hidden md:flex",
                "md:right-8 md:bottom-8",
                "h-14 w-14 rounded-full shadow-lg",
                "touch-action-manipulation",
                "transition-all duration-200",
                "hover:scale-110 hover:shadow-xl",
                "focus-visible:ring-2 focus-visible:ring-offset-2"
              )}
              aria-label="New journal entry"
            >
              <Pencil className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="left">
            <p>New journal entry</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      <JournalQuickEntrySheet
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
      />
    </>
  );
}
