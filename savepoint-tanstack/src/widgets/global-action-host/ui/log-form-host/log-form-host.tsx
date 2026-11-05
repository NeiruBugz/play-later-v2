import { useRouter } from "@tanstack/react-router";
import { useMemo } from "react";

import {
  LogFollowUpsProvider,
  LogForm,
  type LogFollowUps,
} from "@/features/compose-journal-entry";
import { changeStatusWithUndo } from "@/features/manage-library-entry/model/change-status-with-undo";

import type { LogFormHostProps } from "./log-form-host.type";

/**
 * Wires the Log form's "Mark as Playing" offer to manage-library-entry (status
 * change with its own 5 s Undo, spec 2.3). compose-journal-entry cannot import
 * that sibling feature, so the wiring lives here.
 */
export function LogFormHost({ gameSlug, onClose }: LogFormHostProps) {
  const router = useRouter();

  const followUps = useMemo<LogFollowUps>(
    () => ({
      markPlaying: async (game) => {
        const refreshAfter = async (task: () => Promise<boolean>) => {
          if (await task()) void router.invalidate();
        };
        const changed = await changeStatusWithUndo({
          id: game.libraryItemId,
          gameTitle: game.title,
          to: "PLAYING",
          previous: {
            status: game.status,
            upNextPosition: game.upNextPosition,
          },
          onDisplay: () => undefined,
          runUndo: refreshAfter,
        });
        if (changed) void router.invalidate();
        return changed;
      },
    }),
    [router]
  );

  return (
    <LogFollowUpsProvider value={followUps}>
      <LogForm gameSlug={gameSlug} onClose={onClose} />
    </LogFollowUpsProvider>
  );
}
