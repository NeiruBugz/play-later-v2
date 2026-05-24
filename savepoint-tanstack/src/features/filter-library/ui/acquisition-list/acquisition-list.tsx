import {
  ACQUISITION_FILTER_ENTRIES,
  FILTER_TOGGLE_STYLE,
} from "@/features/filter-library/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { AcquisitionListProps } from "./acquisition-list.type";

/**
 * Single-select acquisition filter — mirrors `StatusList`'s toggle shape.
 * Clicking the active option clears it. The three options key on the real
 * `AcquisitionType` enum; "Subscription" covers Game Pass and PS+ alike (the
 * DB can't tell them apart — the per-card chip does the brand resolution).
 */
export function AcquisitionList({
  current,
  onPick,
  variant,
}: AcquisitionListProps) {
  return (
    <ul className="space-y-1" role="list">
      {ACQUISITION_FILTER_ENTRIES.map((entry) => {
        const isActive = current === entry.value;

        if (variant === "sidebar") {
          return (
            <li key={entry.value}>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => onPick(entry.value)}
                aria-label={`Filter by ${entry.label}`}
                aria-pressed={isActive}
                className={cn(
                  "w-full justify-start border transition-all",
                  isActive
                    ? FILTER_TOGGLE_STYLE.active
                    : FILTER_TOGGLE_STYLE.inactive
                )}
              >
                {entry.label}
              </Button>
            </li>
          );
        }

        return (
          <li key={entry.value}>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => onPick(entry.value)}
              aria-label={
                isActive
                  ? `Clear ${entry.label} filter`
                  : `Filter by ${entry.label}`
              }
              aria-pressed={isActive}
              className={cn(
                "w-full justify-start border",
                isActive && "bg-secondary"
              )}
            >
              {entry.label}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
