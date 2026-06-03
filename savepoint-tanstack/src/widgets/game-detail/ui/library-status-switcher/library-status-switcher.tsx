import { useRouter } from "@tanstack/react-router";
import { MoreHorizontal } from "lucide-react";
import { useMemo, useState } from "react";
import { toast } from "sonner";

import { STATUS_ENTRIES } from "@/entities/library-item/model";
import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { LibraryModal } from "@/features/manage-library-entry";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { RatingInput } from "@/shared/ui/rating-input";
import { SegmentedControl } from "@/shared/ui/segmented-control";

import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client.ts";
import type { LibraryStatusSwitcherProps } from "./library-status-switcher.type";

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
      toast.error(getErrorMessage(err, "Something went wrong"));
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
      toast.error(getErrorMessage(err, "Something went wrong"));
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
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setPending(false);
    }
  };

  const segmentedOptions = useMemo(
    () =>
      STATUS_ENTRIES.map((entry) => {
        const Icon = entry.icon;
        return {
          value: entry.value,
          label: entry.label,
          icon: <Icon className="h-3.5 w-3.5" />,
          disabled: pending,
        };
      }),
    [pending]
  );

  return (
    <div
      className="gap-sm flex flex-wrap items-center"
      data-testid="library-status-switcher"
    >
      <SegmentedControl<LibraryItemStatus>
        value={currentStatus ?? ""}
        onValueChange={handleStatusClick}
        options={segmentedOptions}
        ariaLabel={`Library status for ${gameTitle}`}
        scrollable
      />

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
