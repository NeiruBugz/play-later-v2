import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  MoreVertical,
  Package,
  PackageX,
  Pencil,
  Trash2,
} from "lucide-react";
import { useState, type SyntheticEvent } from "react";

import { useMutationAction } from "@/shared/lib/use-mutation-action";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { deleteLibraryItemFn } from "../../api/delete-library-item-fn";
import { RemoveFromLibraryDialog } from "../remove-from-library-dialog";
import type { LibraryCardMenuProps } from "./library-card-menu.type";

const stop = (event: SyntheticEvent) => {
  event.preventDefault();
  event.stopPropagation();
};

const stopProp = (event: SyntheticEvent) => {
  event.stopPropagation();
};

/**
 * Per-card action menu. Sits inside the cover overlay slot of `LibraryItemCard`
 * (entity primitive); event propagation stopped so menu clicks don't trigger
 * the card's onClick. View-journal item points to `/games/$slug` only — the
 * `#journal-heading` anchor will land in S15.
 */
export function LibraryCardMenu({
  item,
  onEdit,
  ownership,
  extraItems,
}: LibraryCardMenuProps) {
  const { pending: isPending, run } = useMutationAction();
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const handleRemove = async () => {
    await run(() => deleteLibraryItemFn({ data: { itemId: item.id } }), {
      successMessage: "Removed from library",
      errorFallback: "Failed to remove from library",
    });
  };

  return (
    <div onClick={stop} onMouseDown={stop}>
      <DropdownMenu>
        <DropdownMenuTrigger
          aria-label={`Actions for ${item.game.title}`}
          disabled={isPending}
          onClick={stop}
          onMouseDown={stop}
          className="group/menu-trigger -m-2 inline-flex min-h-11 min-w-11 items-center justify-center outline-none disabled:opacity-50 md:m-0 md:min-h-0 md:min-w-0"
        >
          <span className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-scrim/60 text-scrim-foreground backdrop-blur-sm transition-colors group-hover/menu-trigger:bg-scrim/75 group-focus-visible/menu-trigger:shadow-[0_0_0_2px_var(--scrim-foreground),0_0_0_4px_var(--scrim)]">
            <MoreVertical className="h-4 w-4" aria-hidden="true" />
          </span>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          onClick={stopProp}
          onMouseDown={stopProp}
        >
          <DropdownMenuItem
            render={
              <Link
                to="/games/$slug"
                params={{ slug: item.game.slug }}
                onClick={stopProp}
              />
            }
          >
            <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
            View notes
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(event) => {
              stopProp(event);
              onEdit();
            }}
          >
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit Library Details
          </DropdownMenuItem>

          <DropdownMenuItem
            onClick={(event) => {
              stopProp(event);
              void ownership.setOwned(!ownership.isOwned);
            }}
            disabled={ownership.isPending}
          >
            {ownership.isOwned ? (
              <PackageX className="mr-2 h-4 w-4" aria-hidden="true" />
            ) : (
              <Package className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {ownership.isOwned ? "I don't own it yet" : "I own it"}
          </DropdownMenuItem>
          {extraItems}

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onClick={(event) => {
              stopProp(event);
              setConfirmingRemove(true);
            }}
            className="text-destructive focus:text-destructive"
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Remove from Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <RemoveFromLibraryDialog
        open={confirmingRemove}
        onOpenChange={setConfirmingRemove}
        gameTitle={item.game.title}
        onConfirm={() => {
          void handleRemove();
        }}
      />
    </div>
  );
}
