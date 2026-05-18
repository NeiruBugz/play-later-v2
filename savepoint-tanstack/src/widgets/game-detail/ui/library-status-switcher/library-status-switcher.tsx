import { useRouter } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import { STATUS_ENTRIES } from "@/entities/library-item/model";
import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { LibraryModal } from "@/features/manage-library-entry";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { RatingInput } from "@/shared/ui/rating-input";

import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";
import type { LibraryStatusSwitcherProps } from "./library-status-switcher.type";

/**
 * Phase 2 of Slice 18A visual parity: inline 5-pill status row + rating + overflow
 * menu. Fully replaces the previous `Manage in library` button. When `entry` is
 * null, clicking a pill calls `addGameToLibraryFn` with that status; otherwise
 * calls `updateLibraryItemFn`. The overflow menu surfaces "Edit details…" (opens
 * the existing LibraryModal) and "Remove from library".
 *
 * Optimistic update: tracks `optimisticStatus` / `optimisticRating` locally so
 * the active pill flips immediately on click. Server fn is awaited; on failure
 * the optimistic state is reverted and a toast is shown.
 */
export function LibraryStatusSwitcher({
  igdbId,
  gameTitle,
  entry,
}: LibraryStatusSwitcherProps) {
  const router = useRouter();
  const [optimisticEntry, setOptimisticEntry] = useState<LibraryItem | null>(
    entry
  );
  const [pending, setPending] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const currentStatus = optimisticEntry?.status ?? null;
  const currentRating = optimisticEntry?.rating ?? null;
  const itemId = optimisticEntry?.id ?? null;

  const handleStatusClick = async (status: LibraryItemStatus) => {
    if (pending) return;
    const previous = optimisticEntry;
    setPending(true);
    try {
      if (previous === null) {
        const created = await addGameToLibraryFn({
          data: { igdbId, status },
        });
        setOptimisticEntry(created);
        toast.success(`Added to library as ${labelFor(status)}`);
      } else {
        // optimistic flip
        setOptimisticEntry({ ...previous, status });
        const updated = await updateLibraryItemFn({
          data: { itemId: previous.id, status },
        });
        setOptimisticEntry(updated);
        toast.success("Library entry updated");
      }
      await router.invalidate();
    } catch (err: unknown) {
      setOptimisticEntry(previous);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const handleRatingChange = async (next: number | null) => {
    if (itemId === null || pending) return;
    const previous = optimisticEntry;
    if (previous === null) return;
    setOptimisticEntry({ ...previous, rating: next });
    setPending(true);
    try {
      const updated = await updateLibraryItemFn({
        data: { itemId, rating: next },
      });
      setOptimisticEntry(updated);
      await router.invalidate();
    } catch (err: unknown) {
      setOptimisticEntry(previous);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  const handleRemove = async () => {
    if (itemId === null || pending) return;
    const previous = optimisticEntry;
    setPending(true);
    try {
      await deleteLibraryItemFn({ data: { itemId } });
      setOptimisticEntry(null);
      toast.success("Removed from library");
      await router.invalidate();
    } catch (err: unknown) {
      setOptimisticEntry(previous);
      const message = err instanceof Error ? err.message : String(err);
      toast.error(message);
    } finally {
      setPending(false);
    }
  };

  return (
    <div
      className="gap-sm flex flex-wrap items-center"
      data-testid="library-status-switcher"
    >
      <div
        role="radiogroup"
        aria-label={`Library status for ${gameTitle}`}
        className="flex flex-wrap items-center gap-1.5"
      >
        {STATUS_ENTRIES.map((entry) => {
          const isActive = currentStatus === entry.value;
          return (
            <button
              key={entry.value}
              type="button"
              role="radio"
              aria-checked={isActive}
              disabled={pending}
              onClick={() => handleStatusClick(entry.value)}
              className={cn(
                "rounded-full px-3 py-1 text-sm font-medium transition-colors",
                "focus-visible:ring-ring border focus-visible:ring-2 focus-visible:outline-none",
                "disabled:cursor-not-allowed disabled:opacity-60",
                isActive
                  ? "bg-primary text-primary-foreground border-primary"
                  : "border-border text-muted-foreground hover:border-primary/40 hover:text-foreground bg-transparent"
              )}
            >
              {entry.label}
            </button>
          );
        })}
      </div>

      {itemId !== null ? (
        <RatingInput
          value={currentRating}
          readOnly={false}
          size="md"
          onChange={handleRatingChange}
          aria-label={`Rate ${gameTitle}`}
        />
      ) : null}

      {itemId !== null ? (
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
              onSelect={handleRemove}
              className="text-destructive"
            >
              Remove from library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}

      {editOpen && optimisticEntry !== null ? (
        <LibraryModal
          open
          onOpenChange={(next) => {
            if (!next) setEditOpen(false);
          }}
          entry={{
            ...optimisticEntry,
            game: {
              id: optimisticEntry.gameId,
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

function labelFor(status: LibraryItemStatus): string {
  return STATUS_ENTRIES.find((e) => e.value === status)?.label ?? status;
}
