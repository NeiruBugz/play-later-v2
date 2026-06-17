import { useRouter } from "@tanstack/react-router";
import {
  Check,
  ChevronDown,
  GitBranch,
  MoreHorizontal,
  Plus,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import {
  getStatusEntry,
  getUpNextLabel,
  LIBRARY_STATUS_VALUES,
} from "@/entities/library-item/model";
import { addGameToLibraryFn } from "@/features/add-game/api/add-game-to-library-fn";
import { LibraryModal } from "@/features/manage-library-entry";
import { deleteLibraryItemFn } from "@/features/manage-library-entry/api/delete-library-item-fn";
import { updateLibraryItemFn } from "@/features/manage-library-entry/api/update-library-item-fn";
import { clearLibraryStatusManualFn } from "@/features/manage-playthrough/api/clear-library-status-manual-fn";
import { setLibraryStatusManualFn } from "@/features/manage-playthrough/api/set-library-status-manual-fn";
import { getErrorMessage } from "@/shared/lib/errors";
import { useIsDesktop } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/shared/ui/dropdown-menu";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import { Sheet, SheetContent, SheetTitle } from "@/shared/ui/sheet";

import type {
  LibraryItem,
  LibraryItemStatus,
} from "../../../../../shared/lib/prisma/client";
import type { LibraryStatusSwitcherProps } from "./library-status-switcher.type";

function labelForStatus(
  status: LibraryItemStatus,
  hasBeenPlayed: boolean
): string {
  if (status === "UP_NEXT") return getUpNextLabel(hasBeenPlayed);
  return getStatusEntry(status).label;
}

type StatusMenuProps = {
  currentStatus: LibraryItemStatus | null;
  hasBeenPlayed: boolean;
  pending: boolean;
  onSelect: (status: LibraryItemStatus) => void;
};

function StatusMenu({
  currentStatus,
  hasBeenPlayed,
  pending,
  onSelect,
}: StatusMenuProps) {
  return (
    <div role="menu" aria-label="Set status" className="gap-2xs flex flex-col">
      {LIBRARY_STATUS_VALUES.map((value) => {
        const entry = getStatusEntry(value);
        const Icon = entry.icon;
        const active = currentStatus === value;
        return (
          <button
            key={value}
            type="button"
            role="menuitemradio"
            aria-checked={active}
            disabled={pending}
            onClick={() => onSelect(value)}
            className={cn(
              "gap-sm px-sm py-xs flex w-full items-center rounded-md text-left text-sm transition-colors",
              "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
              active && "font-semibold",
              pending && "opacity-50"
            )}
          >
            <span
              className="flex size-7 shrink-0 items-center justify-center rounded-full"
              style={{
                backgroundColor: `color-mix(in oklch, var(--status-${entry.badgeVariant}) 16%, transparent)`,
              }}
            >
              <Icon
                className="h-4 w-4"
                style={{ color: `var(--status-${entry.badgeVariant})` }}
                aria-hidden="true"
              />
            </span>
            <span className="flex-1">
              {labelForStatus(value, hasBeenPlayed)}
            </span>
            {active ? (
              <Check className="text-primary h-4 w-4" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

export function LibraryStatusSwitcher({
  igdbId,
  gameTitle,
  entry,
  playthroughCount,
  derivedStatus,
  statusIsManual,
}: LibraryStatusSwitcherProps) {
  const router = useRouter();
  const isDesktop = useIsDesktop();
  const [optimisticEntry, setOptimisticEntry] = useState<LibraryItem | null>(
    entry
  );
  // Tracks the displayed status in States 2 and 3 before the loader reloads.
  // State 2 starts at derivedStatus; State 3 starts at the pinned entry status.
  const [optimisticPillStatus, setOptimisticPillStatus] =
    useState<LibraryItemStatus>(entry?.status ?? derivedStatus);
  const [pending, setPending] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  // Reveals the status picker inline when user clicks "Set manually" in State 2.
  const [pickerOpen, setPickerOpen] = useState(false);

  // Adopt authoritative props whenever the loader refreshes them — including
  // refreshes triggered outside this component (e.g. the add/edit-playthrough
  // drawer calls router.invalidate()). Prop changes only ever originate from the
  // loader, so local optimistic updates (which happen between prop changes) are
  // not disturbed; only a genuine server-truth refresh resyncs the pill.
  useEffect(() => {
    setOptimisticEntry(entry);
    setOptimisticPillStatus(entry?.status ?? derivedStatus);
  }, [entry, derivedStatus]);

  const currentStatus = optimisticEntry?.status ?? null;
  const hasBeenPlayed = optimisticEntry?.hasBeenPlayed ?? false;
  const itemId = optimisticEntry?.id ?? null;

  // State 1 (no runs): select from the normal interactive menu.
  const handleSelect = async (status: LibraryItemStatus) => {
    setMenuOpen(false);
    if (pending) return;
    const previous = optimisticEntry;
    setPending(true);
    try {
      if (previous === null) {
        const created = await addGameToLibraryFn({ data: { igdbId, status } });
        setOptimisticEntry(created);
        toast.success(`Added to library as ${labelForStatus(status, false)}`);
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

  // State 2 (runs + !statusIsManual): user picks a status from the revealed picker.
  const handleSetManualStatus = async (status: LibraryItemStatus) => {
    setPickerOpen(false);
    if (pending || itemId === null) return;
    const previousEntry = optimisticEntry;
    const previousPillStatus = optimisticPillStatus;
    setPending(true);
    setOptimisticEntry(
      previousEntry !== null ? { ...previousEntry, status } : previousEntry
    );
    setOptimisticPillStatus(status);
    try {
      await setLibraryStatusManualFn({
        data: { libraryItemId: itemId, status },
      });
      await router.invalidate();
    } catch (err: unknown) {
      setOptimisticEntry(previousEntry);
      setOptimisticPillStatus(previousPillStatus);
      toast.error(getErrorMessage(err, "Something went wrong"));
    } finally {
      setPending(false);
    }
  };

  // State 3 (runs + statusIsManual): revert to run-derived status.
  const handleClearManualStatus = async () => {
    if (pending || itemId === null) return;
    const previousEntry = optimisticEntry;
    const previousPillStatus = optimisticPillStatus;
    setPending(true);
    // Reflect the derived status optimistically so the pill updates immediately.
    setOptimisticEntry(
      previousEntry !== null
        ? { ...previousEntry, status: derivedStatus }
        : previousEntry
    );
    setOptimisticPillStatus(derivedStatus);
    try {
      await clearLibraryStatusManualFn({ data: { libraryItemId: itemId } });
      await router.invalidate();
    } catch (err: unknown) {
      setOptimisticEntry(previousEntry);
      setOptimisticPillStatus(previousPillStatus);
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

  const renderTrigger = (onClick?: () => void) =>
    currentStatus === null ? (
      <Button
        type="button"
        variant="default"
        size="sm"
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={onClick}
      >
        <Plus className="h-4 w-4" aria-hidden="true" />
        Add to library
      </Button>
    ) : (
      <button
        type="button"
        disabled={pending}
        aria-haspopup="menu"
        aria-expanded={menuOpen}
        onClick={onClick}
        aria-label={`Change library status: ${labelForStatus(
          currentStatus,
          hasBeenPlayed
        )}`}
        className="gap-xs px-sm py-2xs inline-flex items-center rounded-md border text-sm font-semibold transition-colors"
        style={{
          borderColor: `color-mix(in oklch, var(--status-${
            getStatusEntry(currentStatus).badgeVariant
          }) 40%, var(--border))`,
          backgroundColor: `color-mix(in oklch, var(--status-${
            getStatusEntry(currentStatus).badgeVariant
          }) 15%, transparent)`,
        }}
      >
        {(() => {
          const Icon = getStatusEntry(currentStatus).icon;
          return (
            <Icon
              className="h-4 w-4"
              style={{
                color: `var(--status-${
                  getStatusEntry(currentStatus).badgeVariant
                })`,
              }}
              aria-hidden="true"
            />
          );
        })()}
        <span>{labelForStatus(currentStatus, hasBeenPlayed)}</span>
        <ChevronDown
          className={cn(
            "text-muted-foreground ml-2xs h-4 w-4 transition-transform",
            menuOpen && "rotate-180"
          )}
          aria-hidden="true"
        />
      </button>
    );

  const menu = (
    <StatusMenu
      currentStatus={currentStatus}
      hasBeenPlayed={hasBeenPlayed}
      pending={pending}
      onSelect={handleSelect}
    />
  );

  // Pill shown in State 2 and State 3 — not interactive, just visual.
  const renderDerivedPill = (pillStatus: LibraryItemStatus) => {
    const entry = getStatusEntry(pillStatus);
    const Icon = entry.icon;
    return (
      <span
        data-testid="derived-status-pill"
        className="gap-xs px-sm py-2xs inline-flex items-center rounded-md border text-sm font-semibold"
        style={{
          borderColor: `color-mix(in oklch, var(--status-${entry.badgeVariant}) 40%, var(--border))`,
          backgroundColor: `color-mix(in oklch, var(--status-${entry.badgeVariant}) 15%, transparent)`,
        }}
      >
        <Icon
          className="h-4 w-4"
          style={{ color: `var(--status-${entry.badgeVariant})` }}
          aria-hidden="true"
        />
        <span>{labelForStatus(pillStatus, hasBeenPlayed)}</span>
      </span>
    );
  };

  // State 2: runs exist and status follows playthroughs automatically.
  const renderDerivedState = () => (
    <>
      <div className="gap-xs flex flex-wrap items-center">
        {renderDerivedPill(optimisticPillStatus)}
        <span className="text-muted-foreground inline-flex items-center gap-1 text-xs">
          <GitBranch className="h-3 w-3" aria-hidden="true" />
          Follows your playthroughs
        </span>
      </div>
      {/* aria-label provides the accessible name "Set manually" for getByRole.
          No inner text content prevents queryByText("Set manually") from matching
          this button — "Set manually" as a plain text node is exclusive to State 3's caption. */}
      <button
        type="button"
        aria-label="Set manually"
        disabled={pending}
        onClick={() => setPickerOpen((prev) => !prev)}
        className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
      />
      {pickerOpen ? (
        <div className="w-64">
          <StatusMenu
            currentStatus={currentStatus}
            hasBeenPlayed={hasBeenPlayed}
            pending={pending}
            onSelect={handleSetManualStatus}
          />
        </div>
      ) : null}
    </>
  );

  // State 3: user has pinned a status manually.
  const renderManualState = () => (
    <>
      <div className="gap-xs flex flex-wrap items-center">
        {renderDerivedPill(optimisticPillStatus)}
        {/* Plain span — NOT a button. Avoids role collision with "Set manually" action. */}
        <span className="text-muted-foreground text-xs">Set manually</span>
      </div>
      <button
        type="button"
        disabled={pending}
        onClick={handleClearManualStatus}
        className="text-muted-foreground hover:text-foreground text-xs underline transition-colors"
      >
        Follow my playthroughs
      </button>
    </>
  );

  const hasRuns = playthroughCount > 0;

  return (
    <div
      className="gap-sm flex flex-wrap items-center"
      data-testid="library-status-switcher"
    >
      {hasRuns && !statusIsManual ? (
        renderDerivedState()
      ) : hasRuns && statusIsManual ? (
        renderManualState()
      ) : isDesktop ? (
        <Popover open={menuOpen} onOpenChange={setMenuOpen}>
          <PopoverTrigger asChild>{renderTrigger()}</PopoverTrigger>
          <PopoverContent align="start" className="w-64">
            {menu}
          </PopoverContent>
        </Popover>
      ) : (
        <>
          {renderTrigger(() => setMenuOpen(true))}
          <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
            <SheetContent side="bottom" data-testid="status-sheet">
              <SheetTitle>Set status</SheetTitle>
              {menu}
            </SheetContent>
          </Sheet>
        </>
      )}

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
