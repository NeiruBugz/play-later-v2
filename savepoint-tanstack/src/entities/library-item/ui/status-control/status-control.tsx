import { ChevronDown } from "lucide-react";
import { useState } from "react";

import { StatusChip } from "@/shared/ui/status-chip";

import { getStatusLabel, toStatusChipStatus } from "../../model";
import { StatusPicker } from "../status-picker";
import type { StatusControlProps } from "./status-control.type";

/**
 * The status chip as a button that opens the picker directly. Presentational:
 * the caller decides what `onChange` does (see `useSetStatus` in
 * manage-library-entry). The button keeps the >=44px phone hit area around the
 * chip, which is the same size everywhere.
 */
export function StatusControl({
  status,
  outcome = null,
  onChange,
  disabled = false,
}: StatusControlProps) {
  const [open, setOpen] = useState(false);

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
          aria-label={`Status: ${getStatusLabel(status)}. Change`}
          data-status={status}
          className="inline-flex min-h-11 min-w-11 shrink-0 items-center rounded-full transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:opacity-50 md:min-h-0 md:min-w-0"
        >
          <StatusChip status={toStatusChipStatus(status, outcome)}>
            <ChevronDown aria-hidden="true" />
          </StatusChip>
        </button>
      }
    />
  );
}
