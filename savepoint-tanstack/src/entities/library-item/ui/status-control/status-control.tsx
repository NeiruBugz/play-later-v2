import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { cn } from "@/shared/lib/utils";

import { getStatusEntry } from "../../model";
import { StatusPicker } from "../status-picker";
import type { StatusControlProps } from "./status-control.type";

/**
 * Status pill that opens the picker directly. Presentational: the caller
 * decides what `onChange` does (see `useSetStatus` in manage-library-entry).
 */
export function StatusControl({
  status,
  onChange,
  disabled = false,
  className,
}: StatusControlProps) {
  const [open, setOpen] = useState(false);
  const entry = getStatusEntry(status);
  const Icon = entry.icon;

  return (
    <StatusPicker
      value={status}
      onSelect={onChange}
      open={open}
      onOpenChange={setOpen}
      trigger={
        <button
          type="button"
          disabled={disabled}
          aria-label={`Status: ${entry.label}. Change`}
          data-status={status}
          className={cn(
            "py-2xs inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 text-sm font-semibold whitespace-nowrap transition-colors",
            "focus-visible:ring-ring focus-visible:ring-2 focus-visible:outline-none disabled:opacity-50",
            className
          )}
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
          <span>{entry.label}</span>
          <ChevronDown className="h-3.5 w-3.5 opacity-70" aria-hidden="true" />
        </button>
      }
    />
  );
}
