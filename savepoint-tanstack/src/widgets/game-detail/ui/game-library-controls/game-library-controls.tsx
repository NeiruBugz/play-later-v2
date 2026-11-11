import { useRouter } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  NextStepButton,
  NotOwnedTag,
  QueueMarker,
  StatusControl,
} from "@/entities/library-item";
import { AddGameAction } from "@/features/add-game";
import { GamePrompts } from "@/features/library-prompts/ui/game-prompts";
import {
  LibraryModal,
  RemoveFromLibraryDialog,
} from "@/features/manage-library-entry";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { useUpNextMembership } from "@/features/up-next/model/use-up-next-membership";
import { UpNextMenuActions } from "@/features/up-next/ui/up-next-menu-actions";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { DoneOutcomeLabel } from "../done-outcome-label";
import type { GameLibraryControlsProps } from "./game-library-controls.type";

export function GameLibraryControls({
  igdbId,
  gameTitle,
  entry,
  libraryStatus,
  libraryOwnership,
  doneOutcome = null,
  prompts,
}: GameLibraryControlsProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const membership = useUpNextMembership({
    id: entry?.id ?? 0,
    gameTitle,
    upNextPosition: entry?.upNextPosition ?? null,
  });

  const handleRemove = async () => {
    if (entry === null || removing) return;
    setRemoving(true);
    try {
      await deleteLibraryItemFn({ data: { itemId: entry.id } });
      toast.success("Removed from library");
      await router.invalidate();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setRemoving(false);
    }
  };

  return (
    <div
      className="flex flex-wrap items-center gap-1.5"
      data-testid="game-library-controls"
    >
      {entry !== null && libraryStatus !== null && libraryOwnership !== null ? (
        <>
          <StatusControl
            status={libraryStatus.status}
            outcome={doneOutcome}
            onChange={(to) => void libraryStatus.setStatus(to)}
            disabled={libraryStatus.isPending}
          />
          {libraryStatus.status === "DONE" ? (
            <DoneOutcomeLabel
              libraryItemId={entry.id}
              doneOutcome={doneOutcome}
            />
          ) : null}
          <QueueMarker
            status={libraryStatus.status}
            upNextPosition={membership.upNextPosition}
          />
          <NotOwnedTag
            status={libraryStatus.status}
            isOwned={libraryOwnership.isOwned}
          />
          <NextStepButton
            status={libraryStatus.status}
            onStep={(target) => void libraryStatus.setStatus(target)}
            disabled={libraryStatus.isPending}
          />
          <UpNextMenuActions
            status={libraryStatus.status}
            membership={membership}
            variant="button"
          />
          <DropdownMenu>
            <DropdownMenuTrigger
              render={
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  aria-label="More library actions"
                />
              }
            >
              <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditOpen(true)}>
                Edit details…
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() =>
                  void libraryOwnership.setOwned(!libraryOwnership.isOwned)
                }
                disabled={libraryOwnership.isPending}
              >
                {libraryOwnership.isOwned ? "I don't own it yet" : "I own it"}
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => setConfirmingRemove(true)}
                className="text-destructive"
              >
                Remove from library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          {prompts !== undefined ? (
            <GamePrompts
              libraryItemId={entry.id}
              gameTitle={gameTitle}
              prompts={prompts}
              status={libraryStatus.status}
            />
          ) : null}
        </>
      ) : (
        <AddGameAction
          game={{ igdbId, name: gameTitle, library: null }}
          variant="labelled"
        />
      )}

      <RemoveFromLibraryDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        gameTitle={gameTitle}
        onConfirm={() => {
          void handleRemove();
        }}
      />

      {editOpen && entry !== null ? (
        <LibraryModal
          open
          onOpenChange={(next) => {
            if (!next) setEditOpen(false);
          }}
          entry={{
            ...entry,
            game: {
              id: entry.gameId,
              igdbId,
              title: gameTitle,
              slug: "",
              coverImage: null,
              releaseDate: null,
              timeToCreditsSeconds: null,
              coverHue: null,
              coverChroma: null,
            },
          }}
        />
      ) : null}
    </div>
  );
}
