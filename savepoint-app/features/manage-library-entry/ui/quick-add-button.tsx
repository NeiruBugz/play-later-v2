"use client";

import { CheckIcon, PlusIcon } from "lucide-react";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/shared/components/ui/button";
import { showUndoToast } from "@/shared/components/ui/undo-toast";
import { cn } from "@/shared/lib/ui/utils";

import {
  deleteLibraryItemAction,
  quickAddToLibraryAction,
} from "../server-actions";

export interface QuickAddButtonProps {
  igdbId: number;
  gameName: string;
  alreadyInLibrary?: boolean;
  className?: string;
}

export function QuickAddButton({
  igdbId,
  gameName,
  alreadyInLibrary = false,
  className,
}: QuickAddButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [added, setAdded] = useState(false);

  const showSuccess = added || alreadyInLibrary;

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    event.stopPropagation();

    if (isPending || showSuccess) return;

    startTransition(async () => {
      try {
        const result = await quickAddToLibraryAction({ igdbId });

        if (result.success) {
          setAdded(true);
          const libraryItemId = result.data.id;
          showUndoToast({
            message: `Added "${gameName}" to Up Next`,
            onUndo: () => {
              void (async () => {
                const undoResult = await deleteLibraryItemAction({
                  libraryItemId,
                });
                if (undoResult.success) {
                  setAdded(false);
                  toast.success("Removed", { duration: 1000 });
                } else {
                  toast.error(undoResult.error);
                }
              })();
            },
          });
        } else {
          toast.error("Failed to add game", {
            description: result.error,
          });
        }
      } catch (error) {
        toast.error("Failed to add game", {
          description:
            error instanceof Error ? error.message : "Please try again",
        });
      }
    });
  };

  return (
    <Button
      type="button"
      variant="secondary"
      size="icon"
      className={cn(
        "h-8 w-8",
        "bg-background/80 hover:bg-background/90 backdrop-blur-sm",
        "shadow-sm transition-all duration-200",
        className
      )}
      onClick={handleClick}
      disabled={isPending || showSuccess}
      aria-label={`Quick-add ${gameName} to library`}
      aria-busy={isPending}
    >
      {showSuccess ? (
        <CheckIcon className="h-4 w-4" data-testid="quick-add-check" />
      ) : (
        <PlusIcon className="h-4 w-4" data-testid="quick-add-plus" />
      )}
    </Button>
  );
}
