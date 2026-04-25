"use client";

import { useQueryClient } from "@tanstack/react-query";
import { BookOpen, MoreVertical, Pencil, Trash2 } from "lucide-react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { deleteLibraryItemAction } from "@/features/manage-library-entry/server-actions";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
} from "@/shared/components/ui/dropdown-menu";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types";

import { updateLibraryStatusAction } from "../server-actions/update-library-status";
import type { LibraryItemWithGameDomain } from "../types";

const LibraryModal = dynamic(
  () =>
    import("@/features/manage-library-entry").then((mod) => mod.LibraryModal),
  { ssr: false }
);

type LibraryCardMenuVariant = "cover-overlay" | "row";

interface LibraryCardMenuProps {
  libraryItem: LibraryItemWithGameDomain;
  /**
   * "cover-overlay" (default) — small backdrop trigger absolutely positioned
   * over the cover thumbnail (grid-card layout).
   * "row" — 44×44 transparent tap target intended for the mobile list row,
   * where the menu is anchored to the row top-right outside the cover.
   */
  variant?: LibraryCardMenuVariant;
}

const stop = (e: React.SyntheticEvent) => {
  e.preventDefault();
  e.stopPropagation();
};

const stopProp = (e: React.SyntheticEvent) => {
  e.stopPropagation();
};

export function LibraryCardMenu({
  libraryItem,
  variant = "cover-overlay",
}: LibraryCardMenuProps) {
  const [isPending, startTransition] = useTransition();
  const [isEditOpen, setIsEditOpen] = useState(false);
  const queryClient = useQueryClient();

  const { id, status, game } = libraryItem;

  const handleStatusChange = (next: LibraryItemStatus) => {
    if (next === status) return;
    startTransition(async () => {
      await updateLibraryStatusAction({
        libraryItemId: id,
        status: next,
      });
      await queryClient.invalidateQueries({ queryKey: ["library"] });
    });
  };

  const handleRemove = () => {
    startTransition(async () => {
      const result = await deleteLibraryItemAction({ libraryItemId: id });
      if (result?.success) {
        toast.success("Removed from library");
        await queryClient.invalidateQueries({ queryKey: ["library"] });
      } else {
        toast.error(result?.error ?? "Failed to remove from library");
      }
    });
  };

  const isRow = variant === "row";

  return (
    <>
      <div
        className={cn(
          isRow
            ? "z-20 flex items-center justify-center"
            : "absolute top-2 right-2 z-20"
        )}
        data-library-interactive
        onClick={stop}
        onMouseDown={stop}
      >
        <DropdownMenu>
          <DropdownMenuTrigger
            aria-label={`Actions for ${game.title}`}
            className={cn(
              "inline-flex items-center justify-center rounded-md",
              "focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:outline-none",
              "disabled:opacity-50",
              isRow
                ? "text-foreground/80 hover:bg-muted h-11 w-11 transition-colors"
                : cn(
                    "h-7 w-7 bg-black/60 text-white backdrop-blur-sm",
                    "transition-colors hover:bg-black/75"
                  )
            )}
            disabled={isPending}
            onClick={stop}
            onMouseDown={stop}
          >
            <MoreVertical className="h-4 w-4" aria-hidden />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            align="end"
            sideOffset={4}
            onClick={stopProp}
            onMouseDown={stopProp}
          >
            <DropdownMenuItem asChild>
              <Link
                href={`/games/${game.slug}#journal-heading`}
                onClick={stopProp}
              >
                <BookOpen aria-hidden />
                View Journal Entries
              </Link>
            </DropdownMenuItem>

            <DropdownMenuItem
              onSelect={() => setIsEditOpen(true)}
              onClick={stopProp}
            >
              <Pencil aria-hidden />
              Edit Library Details
            </DropdownMenuItem>

            <DropdownMenuSub>
              <DropdownMenuSubTrigger onClick={stopProp}>
                Change Status
              </DropdownMenuSubTrigger>
              <DropdownMenuSubContent onClick={stopProp} onMouseDown={stopProp}>
                {LIBRARY_STATUS_CONFIG.map((cfg) => {
                  const Icon = cfg.icon;
                  const isCurrent = cfg.value === status;
                  return (
                    <DropdownMenuItem
                      key={cfg.value}
                      disabled={isCurrent || isPending}
                      onSelect={() => handleStatusChange(cfg.value)}
                      onClick={stopProp}
                      aria-label={`Change status to ${cfg.label}`}
                    >
                      <Icon aria-hidden />
                      {cfg.label}
                    </DropdownMenuItem>
                  );
                })}
              </DropdownMenuSubContent>
            </DropdownMenuSub>

            <DropdownMenuSeparator />

            <DropdownMenuItem
              onSelect={handleRemove}
              onClick={stopProp}
              className="text-destructive focus:text-destructive"
              disabled={isPending}
            >
              <Trash2 aria-hidden />
              Remove from Library
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {isEditOpen && (
        <LibraryModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          igdbId={game.igdbId}
          gameTitle={game.title}
          gameId={game.id}
          mode="edit"
          existingItems={[libraryItem]}
        />
      )}
    </>
  );
}
