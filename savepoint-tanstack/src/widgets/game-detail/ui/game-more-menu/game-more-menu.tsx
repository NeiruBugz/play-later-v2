import { useRouter } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

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

import type { GameMoreMenuProps } from "./game-more-menu.type";

export function GameMoreMenu({
  igdbId,
  gameTitle,
  entry,
  libraryStatus,
  libraryOwnership,
}: GameMoreMenuProps) {
  const router = useRouter();
  const [removing, setRemoving] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [confirmingRemove, setConfirmingRemove] = useState(false);
  const membership = useUpNextMembership({
    id: entry?.id ?? 0,
    gameTitle,
    upNextPosition: entry?.upNextPosition ?? null,
  });

  if (entry === null || libraryStatus === null || libraryOwnership === null) {
    return null;
  }

  const handleRemove = async () => {
    if (removing) return;
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
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="size-11"
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
          <UpNextMenuActions
            status={libraryStatus.status}
            membership={membership}
          />
          <DropdownMenuItem
            onClick={() => setConfirmingRemove(true)}
            className="text-destructive"
          >
            Remove from library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <RemoveFromLibraryDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        gameTitle={gameTitle}
        onConfirm={() => {
          void handleRemove();
        }}
      />

      {editOpen ? (
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
    </>
  );
}
