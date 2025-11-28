"use client";

import type { ControllerRenderProps, FieldValues, Path } from "react-hook-form";

import {
  FormControl,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/components/ui/form";
import { LIBRARY_STATUS_CONFIG } from "@/shared/lib/library-status";
import { cn } from "@/shared/lib/ui/utils";

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
                  "px-md py-xs sm:px-lg sm:py-sm rounded-md border text-xs font-medium sm:text-sm",
                  "duration-fast ease-out-expo transition-all",
                  "focus:ring-ring focus:ring-2 focus:ring-offset-2 focus:outline-none",
                  isSelected && [
                    `bg-[var(--status-${variant})]`,
                    `text-[var(--status-${variant}-foreground)]`,
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
    </FormItem>
  );
}
