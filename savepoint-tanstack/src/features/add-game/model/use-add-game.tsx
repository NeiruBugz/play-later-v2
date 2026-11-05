import { useRouter } from "@tanstack/react-router";
import { useRef, useState } from "react";
import { toast } from "sonner";

import { getUserFacingErrorMessage } from "@/shared/lib/user-facing-error";

import { addGameFn } from "../api/add-game-fn";
import { undoAddGameFn } from "../api/undo-add-game-fn";
import { AddConfirmation } from "../ui/add-confirmation";
import { useAddFollowUps } from "./add-follow-ups-context";
import type {
  AddableGame,
  AddedItem,
  AddedLibraryState,
  ApplyLibraryChange,
  UseAddGameResult,
} from "./add-game.type";
import { useInlineAddConfirmation } from "./inline-add-confirmation-context";

type LocalChange = { state: AddedLibraryState | null };

/**
 * One tap adds the game as Want and opens the add confirmation. The same hook
 * serves the search page, the add dialog, the palette and the game page.
 * "Start playing" and "Put in Up Next" come from the injected follow-ups.
 */
export function useAddGame({
  igdbId,
  name,
  library,
}: AddableGame): UseAddGameResult {
  const router = useRouter();
  const followUps = useAddFollowUps();
  const presentInline = useInlineAddConfirmation();
  const [local, setLocal] = useState<LocalChange | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const inFlight = useRef(false);

  const initial: AddedLibraryState | null = library
    ? { status: library.status, upNextPosition: library.upNextPosition }
    : null;
  const current = local === null ? initial : local.state;

  const applyChange: ApplyLibraryChange = (patch) =>
    setLocal((previous) => {
      const base = previous === null ? initial : previous.state;
      return { state: base === null ? null : { ...base, ...patch } };
    });

  const undo = async (libraryItemId: number): Promise<boolean> => {
    try {
      await undoAddGameFn({ data: { libraryItemId } });
      setLocal({ state: null });
      void router.invalidate();
      return true;
    } catch (error) {
      toast.error(getUserFacingErrorMessage(error));
      return false;
    }
  };

  const showConfirmation = (item: AddedItem, created: boolean) => {
    const renderConfirmation = (dismiss: () => void) => (
      <AddConfirmation
        gameTitle={item.gameTitle}
        status={item.status}
        upNextPosition={item.upNextPosition}
        onStartPlaying={
          followUps
            ? () => followUps.startPlaying(item, applyChange)
            : undefined
        }
        onPutInUpNext={
          followUps ? () => followUps.putInUpNext(item, applyChange) : undefined
        }
        onSaveWhy={
          followUps ? (text) => followUps.saveWhy(item, text) : undefined
        }
        onUndo={created ? () => undo(item.libraryItemId) : undefined}
        onDismiss={dismiss}
      />
    );

    if (presentInline) {
      presentInline(renderConfirmation);
      return;
    }
    toast.custom(
      (toastId) => renderConfirmation(() => toast.dismiss(toastId)),
      { duration: Number.POSITIVE_INFINITY }
    );
  };

  const add = async () => {
    if (inFlight.current || current !== null) return;
    inFlight.current = true;
    setIsAdding(true);
    try {
      const result = await addGameFn({ data: { igdbId } });
      setLocal({
        state: {
          status: result.status,
          upNextPosition: result.upNextPosition,
        },
      });
      showConfirmation(
        {
          libraryItemId: result.libraryItemId,
          gameTitle: name,
          status: result.status,
          upNextPosition: result.upNextPosition,
        },
        result.created
      );
      void router.invalidate();
    } catch {
      toast.error(`Couldn't add ${name}. Try again.`);
    } finally {
      inFlight.current = false;
      setIsAdding(false);
    }
  };

  return { library: current, isAdding, add };
}
