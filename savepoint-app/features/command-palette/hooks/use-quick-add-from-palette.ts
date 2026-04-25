"use client";

import { useTransition } from "react";
import { toast } from "sonner";

import {
  deleteLibraryItemAction,
  quickAddToLibraryAction,
} from "@/features/manage-library-entry/server-actions";
import { showUndoToast } from "@/shared/components/ui/undo-toast";

interface QuickAddArgs {
  igdbId: number;
  gameName: string;
}

interface UseQuickAddFromPaletteOptions {
  onSuccess?: () => void;
}

export function useQuickAddFromPalette(
  options: UseQuickAddFromPaletteOptions = {}
) {
  const [isPending, startTransition] = useTransition();
  const { onSuccess } = options;

  const quickAdd = ({ igdbId, gameName }: QuickAddArgs) => {
    startTransition(async () => {
      try {
        const result = await quickAddToLibraryAction({ igdbId });

        if (result.success) {
          const libraryItemId = result.data.id;
          showUndoToast({
            message: `Added "${gameName}" to Up Next`,
            onUndo: () => {
              void (async () => {
                const undoResult = await deleteLibraryItemAction({
                  libraryItemId,
                });
                if (undoResult.success) {
                  toast.success("Removed", { duration: 1000 });
                } else {
                  toast.error(undoResult.error);
                }
              })();
            },
          });
          onSuccess?.();
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

  return { quickAdd, isPending };
}
