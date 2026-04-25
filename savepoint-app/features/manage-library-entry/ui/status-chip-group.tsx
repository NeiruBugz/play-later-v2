"use client";

import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import {
  LIBRARY_STATUS_CONFIG,
  type StatusBadgeVariant,
} from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";
import { LibraryItemStatus } from "@/shared/types/library";

const STATUS_CHIP_SELECTED_CLASSES: Record<StatusBadgeVariant, string> = {
  playing: "bg-[var(--status-playing)] text-[var(--status-playing-foreground)]",
  played: "bg-[var(--status-played)] text-[var(--status-played-foreground)]",
  shelf: "bg-[var(--status-shelf)] text-[var(--status-shelf-foreground)]",
  upNext: "bg-[var(--status-upNext)] text-[var(--status-upNext-foreground)]",
  wishlist:
    "bg-[var(--status-wishlist)] text-[var(--status-wishlist-foreground)]",
};

const STATUS_HELPER_TEXT: Record<string, string> = {
  [LibraryItemStatus.UP_NEXT]: "Queued to play soon",
  [LibraryItemStatus.PLAYING]: "Currently in progress",
  [LibraryItemStatus.SHELF]: "Owned, not actively playing",
  [LibraryItemStatus.PLAYED]: "Finished or done with",
  [LibraryItemStatus.WISHLIST]: "Want to get someday",
};

interface StatusChipGroupProps<T extends FieldValues> {
  field: ControllerRenderProps<T, Path<T>>;
  className?: string;
}

export function StatusChipGroup<T extends FieldValues>({
  field,
  className,
}: StatusChipGroupProps<T>) {
  return (
    <FormItem className={className}>
      <FormLabel>Status</FormLabel>
      <FormControl>
        <div
          className="gap-sm flex flex-wrap"
          role="radiogroup"
          aria-label="Journey status"
        >
          {LIBRARY_STATUS_CONFIG.map((option) => {
            const isSelected = field.value === option.value;
            const variant = option.badgeVariant;

            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={isSelected}
                onClick={() => field.onChange(option.value)}
                className={cn(
                  "px-lg py-sm sm:px-lg sm:py-sm rounded-md border text-sm font-medium",
                  "duration-fast ease-out-expo transition-all",
                  "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
                  isSelected && [
                    STATUS_CHIP_SELECTED_CLASSES[variant],
                    "shadow-paper-sm border-transparent",
                  ],
                  !isSelected && [
                    "border-border bg-transparent",
                    "text-muted-foreground",
                    "hover:border-primary/40 hover:bg-muted/30 hover:text-foreground",
                  ]
                )}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      </FormControl>
      <FormMessage />
      {field.value && STATUS_HELPER_TEXT[field.value as string] && (
        <p className="text-muted-foreground text-xs">
          {STATUS_HELPER_TEXT[field.value as string]}
        </p>
      )}
    </FormItem>
  );
}
