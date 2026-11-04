import { useRouter } from "@tanstack/react-router";
import { useMemo } from "react";
import { toast } from "sonner";

import { AddFollowUpsProvider } from "@/features/add-game/model/add-follow-ups-context";
import type { AddFollowUps } from "@/features/add-game/model/add-game.type";
import { changeStatusWithUndo } from "@/features/manage-library-entry/model/change-status-with-undo";
import { addToUpNextFn } from "@/features/up-next/api/add-to-up-next-fn";
import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import type { AddFlowProviderProps } from "./add-flow-provider.type";

/**
 * Wires the add confirmation's follow-ups to manage-library-entry (status
 * change with its own 5 s Undo, spec 2.3) and up-next (queue rules, spec 2.4).
 * The add-game feature cannot import either sibling feature, so the wiring
 * lives here and is mounted once at the root.
 */
export function AddFlowProvider({ children }: AddFlowProviderProps) {
  const router = useRouter();

  const followUps = useMemo<AddFollowUps>(
    () => ({
      startPlaying: async (item, applyChange) => {
        const refreshAfter = async (task: () => Promise<boolean>) => {
          if (await task()) void router.invalidate();
        };
        const changed = await changeStatusWithUndo({
          id: item.libraryItemId,
          gameTitle: item.gameTitle,
          to: "PLAYING",
          previous: {
            status: item.status,
            upNextPosition: item.upNextPosition,
          },
          onDisplay: applyChange,
          runUndo: refreshAfter,
        });
        if (changed) void router.invalidate();
        return changed;
      },
      putInUpNext: async (item, applyChange) => {
        try {
          const result = await addToUpNextFn({
            data: { id: item.libraryItemId },
          });
          applyChange({ upNextPosition: result.position });
          toast(`${item.gameTitle} is in Up Next`);
          void router.invalidate();
          return true;
        } catch (error) {
          toast.error(getUserFacingErrorMessage(error));
          return false;
        }
      },
    }),
    [router]
  );

  return (
    <AddFollowUpsProvider value={followUps}>{children}</AddFollowUpsProvider>
  );
}
