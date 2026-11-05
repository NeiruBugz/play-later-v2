import { Check } from "lucide-react";
import { useRef, type KeyboardEvent } from "react";

import { useIsDesktop } from "@/shared/lib/use-media-query";
import { cn } from "@/shared/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/shared/ui/popover";
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from "@/shared/ui/sheet";

import type { LibraryItemStatus } from "../../../../../shared/lib/prisma/client.ts";
import { STATUS_ENTRIES } from "../../model";
import type { StatusPickerProps } from "./status-picker.type";

const PICKER_LABEL = "Set status";

type RadioListProps = {
  value: LibraryItemStatus | null;
  onSelect: (to: LibraryItemStatus) => void;
};

function StatusRadioList({ value, onSelect }: RadioListProps) {
  const itemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const tabStopIndex = Math.max(
    STATUS_ENTRIES.findIndex((entry) => entry.value === value),
    0
  );

  const moveFocus = (from: number, step: 1 | -1) => {
    const next = (from + step + STATUS_ENTRIES.length) % STATUS_ENTRIES.length;
    itemRefs.current[next]?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    if (event.key === "ArrowDown" || event.key === "ArrowRight") {
      event.preventDefault();
      moveFocus(index, 1);
    } else if (event.key === "ArrowUp" || event.key === "ArrowLeft") {
      event.preventDefault();
      moveFocus(index, -1);
    }
  };

  return (
    <div
      role="radiogroup"
      aria-label={PICKER_LABEL}
      className="gap-2xs flex flex-col"
    >
      {STATUS_ENTRIES.map((entry, index) => {
        const Icon = entry.icon;
        const checked = entry.value === value;
        return (
          <button
            key={entry.value}
            ref={(node) => {
              itemRefs.current[index] = node;
            }}
            type="button"
            role="radio"
            aria-checked={checked}
            tabIndex={index === tabStopIndex ? 0 : -1}
            onClick={() => onSelect(entry.value)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex w-full items-center gap-1.5 rounded-md px-1.5 py-1 text-left text-sm transition-colors",
              "hover:bg-muted focus-visible:bg-muted focus-visible:outline-none",
              checked && "font-semibold"
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
            <span className="flex-1">{entry.label}</span>
            {checked ? (
              <Check className="text-primary h-4 w-4" aria-hidden="true" />
            ) : null}
          </button>
        );
      })}
    </div>
  );
}

/**
 * Three-option status radio group. Popover on >=768px, bottom Sheet on phones.
 * Picking an option closes the picker and reports it immediately (no confirm
 * step); Escape / outside press close without selecting and Radix returns
 * focus to the trigger.
 */
export function StatusPicker({
  value,
  onSelect,
  open,
  onOpenChange,
  trigger,
}: StatusPickerProps) {
  const isDesktop = useIsDesktop();

  const handleSelect = (to: LibraryItemStatus) => {
    onOpenChange(false);
    onSelect(to);
  };

  if (isDesktop) {
    return (
      <Popover open={open} onOpenChange={onOpenChange}>
        <PopoverTrigger render={trigger} />
        <PopoverContent align="start" className="w-56 p-1">
          <StatusRadioList value={value} onSelect={handleSelect} />
        </PopoverContent>
      </Popover>
    );
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetTrigger render={trigger} />
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className="p-2 pb-4"
      >
        <SheetTitle className="mb-1.5 text-base">{PICKER_LABEL}</SheetTitle>
        <StatusRadioList value={value} onSelect={handleSelect} />
      </SheetContent>
    </Sheet>
  );
}
