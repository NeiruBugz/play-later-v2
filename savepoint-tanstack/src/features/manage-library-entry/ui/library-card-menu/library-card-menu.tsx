import { Link, useRouter } from "@tanstack/react-router";
import { BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { useState, type SyntheticEvent } from "react";
import { toast } from "sonner";

import { STATUS_ENTRIES } from "@/entities/library-item/model";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";

import { deleteLibraryItemFn } from "../../api/delete-library-item-fn";
import { updateLibraryItemFn } from "../../api/update-library-item-fn";
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
export function LibraryCardMenu({ item, onEdit }: LibraryCardMenuProps) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);

  const handleStatusChange = async (
    next: (typeof STATUS_ENTRIES)[number]["value"]
  ) => {
    if (next === item.status) return;
    setIsPending(true);
    try {
      await updateLibraryItemFn({
        data: { itemId: item.id, status: next },
      });
      toast.success("Status updated");
      await router.invalidate();
    } catch (cause) {
      const message =
        cause instanceof Error ? cause.message : "Failed to update status";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
  };

  const handleRemove = async () => {
    setIsPending(true);
    try {
      await deleteLibraryItemFn({ data: { itemId: item.id } });
      toast.success("Removed from library");
      await router.invalidate();
    } catch (cause) {
      const message =
        cause instanceof Error
          ? cause.message
          : "Failed to remove from library";
      toast.error(message);
    } finally {
      setIsPending(false);
    }
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
              search={{ page: 1 }}
              onClick={stopProp}
            >
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              View Journal Entries
            </Link>
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={onEdit} onClick={stopProp}>
            <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
            Edit Library Details
          </DropdownMenuItem>

          <DropdownMenuSub>
            <DropdownMenuSubTrigger onClick={stopProp}>
              Change Status
            </DropdownMenuSubTrigger>
            <DropdownMenuSubContent onClick={stopProp} onMouseDown={stopProp}>
              {STATUS_ENTRIES.map((entry) => {
                const Icon = entry.icon;
                const isCurrent = entry.value === item.status;
                return (
                  <DropdownMenuItem
                    key={entry.value}
                    disabled={isCurrent || isPending}
                    onSelect={() => {
                      void handleStatusChange(entry.value);
                    }}
                    onClick={stopProp}
                    aria-label={`Change status to ${entry.label}`}
                  >
                    <Icon className="mr-2 h-4 w-4" aria-hidden="true" />
                    {entry.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuSubContent>
          </DropdownMenuSub>

          <DropdownMenuSeparator />

          <DropdownMenuItem
            onSelect={() => {
              void handleRemove();
            }}
            onClick={stopProp}
            className="text-destructive focus:text-destructive"
            disabled={isPending}
          >
            <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            Remove from Library
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
