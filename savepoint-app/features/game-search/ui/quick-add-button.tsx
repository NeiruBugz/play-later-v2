"use client";

import { PlusIcon } from "lucide-react";

import { QuickAddPopover } from "@/features/manage-library-entry/ui";
import { Button } from "@/shared/components/ui/button";
import { cn } from "@/shared/lib/ui/utils";

export interface QuickAddButtonProps {
  igdbId: number;
  gameTitle: string;
  className?: string;
}

export function QuickAddButton({
  igdbId,
  gameTitle,
  className,
}: QuickAddButtonProps) {
  return (
    <QuickAddPopover
      igdbId={igdbId}
      gameTitle={gameTitle}
      trigger={
        <Button
          type="button"
          variant="secondary"
          size="icon"
          className={cn(
            "bg-background/80 hover:bg-background/90 backdrop-blur-sm",
            "shadow-sm transition-all duration-200",
            "group-hover:opacity-100 md:opacity-0",
            className
          )}
          aria-label={`Quick add ${gameTitle} to library`}
          onClick={(e) => {
            e.stopPropagation();
          }}
        >
          <PlusIcon className="h-4 w-4" />
        </Button>
      }
    />
  );
}
