import { useRouter } from "@tanstack/react-router";
import { useState } from "react";

import { DoneFollowUp } from "@/features/done-follow-up";
import {
  DoneHandlerProvider,
  type DoneRequest,
} from "@/features/manage-library-entry/model/done-handler-context";

import type { DoneFlowProviderProps } from "./done-flow-provider.type";

/**
 * Receives "this game just became Done" from manage-library-entry and opens
 * the Done follow-up in place of the undo toast. The two features cannot
 * import each other, so the seam is wired here and mounted once at the root.
 */
export function DoneFlowProvider({ children }: DoneFlowProviderProps) {
  const router = useRouter();
  const [request, setRequest] = useState<DoneRequest | null>(null);

  return (
    <DoneHandlerProvider value={setRequest}>
      {children}
      {request !== null ? (
        <DoneFollowUp
          key={request.id}
          itemId={request.id}
          gameTitle={request.gameTitle}
          currentRating={request.rating}
          initialOutcome={request.initialOutcome}
          onUndo={request.undo}
          onSaved={() => void router.invalidate()}
          onClose={() => setRequest(null)}
        />
      ) : null}
    </DoneHandlerProvider>
  );
}
