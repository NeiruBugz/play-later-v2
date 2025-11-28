"use client";

import { ChevronRight, Gamepad2 } from "lucide-react";

import { Badge } from "@/shared/components/ui/badge";
import { getStatusLabel, getStatusVariant } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import type { LibraryItemDomain } from "@/shared/types";

interface EntryRowProps {
  entry: LibraryItemDomain;
  isSelected: boolean;
  onClick: () => void;
  className?: string;
}

export function EntryRow({
  entry,
  isSelected,
  onClick,
  className,
}: EntryRowProps) {
  const statusVariant = getStatusVariant(entry.status);
  const statusLabel = getStatusLabel(entry.status);

  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "gap-md px-lg py-md flex w-full items-center rounded-md",
        "duration-fast text-left transition-all",
        "hover:bg-muted/50 focus:ring-ring focus:ring-2 focus:outline-none",
        isSelected && "bg-accent/30 border-accent border",
        !isSelected && "border border-transparent",
        className
      )}
      aria-selected={isSelected}
      role="option"
    >
      <Gamepad2
        className="text-muted-foreground h-4 w-4 shrink-0"
        aria-hidden
      />

      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">
          {entry.platform ?? "Unknown Platform"}
        </p>
      </div>

      <Badge variant={statusVariant} className="shrink-0">
        {statusLabel}
      </Badge>

      <ChevronRight
        className={cn(
          "text-muted-foreground h-4 w-4 shrink-0 transition-transform",
          isSelected && "text-foreground"
        )}
        aria-hidden
      />
    </button>
  );
}
