import { useRouter } from "@tanstack/react-router";
import { MoreHorizontal, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import {
  NextStepButton,
  QueueMarker,
  StatusControl,
  StatusPicker,
} from "@/entities/library-item";
import { getStatusEntry } from "@/entities/library-item/model";
import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
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

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client";
import type { GameLibraryControlsProps } from "./game-library-controls.type";

export function GameLibraryControls({
  igdbId,
  gameTitle,
  entry,
  libraryStatus,
}: GameLibraryControlsProps) {
  const router = useRouter();
  const [addPickerOpen, setAddPickerOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const [removing, setRemoving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const membership = useUpNextMembership({
    id: entry?.id ?? 0,
    gameTitle,
    upNextPosition: entry?.upNextPosition ?? null,
  });

  const handleAdd = async (status: LibraryItemStatus) => {
    if (adding) return;
    setAdding(true);
    try {
      await addGameToLibraryFn({ data: { igdbId, status } });
      toast.success(`Added to library as ${getStatusEntry(status).label}`);
      await router.invalidate();
    } catch (err: unknown) {
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setAdding(false);
    }
  };

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
      className="gap-sm flex flex-wrap items-center"
      data-testid="game-library-controls"
    >
      {entry !== null && libraryStatus !== null ? (
        <>
          <StatusControl
            status={libraryStatus.status}
            onChange={(to) => void libraryStatus.setStatus(to)}
            disabled={libraryStatus.isPending}
          />
          <QueueMarker
            status={libraryStatus.status}
            upNextPosition={membership.upNextPosition}
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
            <DropdownMenuTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                aria-label="More library actions"
                className="h-8 w-8"
              >
                <MoreHorizontal className="h-4 w-4" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setEditOpen(true)}>
                Edit details…
              </DropdownMenuItem>
              <DropdownMenuItem
                onSelect={() => setConfirmingRemove(true)}
                className="text-destructive"
              >
                Remove from library
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </>
      ) : (
        <StatusPicker
          value={null}
          onSelect={(to) => void handleAdd(to)}
          open={addPickerOpen}
          onOpenChange={setAddPickerOpen}
          trigger={
            <Button type="button" size="sm" disabled={adding}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Add to library
            </Button>
          }
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
            },
          }}
        />
      ) : null}
    </div>
  );
}
