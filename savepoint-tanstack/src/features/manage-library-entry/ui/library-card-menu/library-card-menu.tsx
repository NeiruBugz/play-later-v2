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
          className="inline-flex h-7 w-7 items-center justify-center rounded-md bg-black/60 text-white backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none disabled:opacity-50"
        >
          <MoreVertical className="h-4 w-4" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="end"
          sideOffset={4}
          onClick={stopProp}
          onMouseDown={stopProp}
        >
          <DropdownMenuItem asChild>
            <Link
              to="/games/$slug"
              params={{ slug: item.game.slug }}
              onClick={stopProp}
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              View notes
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={onEdit} onClick={stopProp}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit Library Details
          </DropdownMenuItem>

          <DropdownMenuItem
            onSelect={() => void ownership.setOwned(!ownership.isOwned)}
            onClick={stopProp}
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
            onSelect={() => setConfirmingRemove(true)}
            onClick={stopProp}
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
