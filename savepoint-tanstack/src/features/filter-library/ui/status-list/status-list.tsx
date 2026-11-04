import {
  FILTER_TOGGLE_STYLE,
  STATUS_FILTER_ENTRIES,
} from "@/features/filter-library/lib";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";

import type { StatusListProps } from "./status-list.type";

export function StatusList({
  currentStatus,
  counts,
  onPick,
  variant,
  onAll,
  totalCount,
}: StatusListProps) {
  return (
    <ul className="space-y-1" role="list">
      {variant === "sidebar" && onAll !== undefined ? (
        <li>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onAll}
            aria-label="Show all statuses"
            aria-pressed={currentStatus === "__all__"}
            className={cn(
              "w-full justify-between border transition-all",
              currentStatus === "__all__"
                ? "bg-primary text-primary-foreground hover:bg-primary/90 border-transparent"
                : "text-muted-foreground hover:bg-muted/50 border-transparent"
            )}
          >
            <span className="flex items-center gap-2">All</span>
            {totalCount !== undefined ? (
              <span className="text-xs tabular-nums">{totalCount}</span>
            ) : null}
          </Button>
        </li>
      ) : null}
      {STATUS_FILTER_ENTRIES.map((entry) => {
        const isActive = currentStatus === entry.value;
        const count = counts?.[entry.value];
        const Icon = entry.icon;

        if (variant === "sidebar") {
          const styles = FILTER_TOGGLE_STYLE;
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
                  "w-full justify-between border transition-all",
                  count === 0 && "opacity-50",
                  isActive ? styles.active : styles.inactive
                )}
              >
                <span className="flex items-center gap-2">
                  <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  {entry.label}
                </span>
                {count !== undefined ? (
                  <span className="text-xs tabular-nums">{count}</span>
                ) : null}
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
                "w-full justify-between border",
                count === 0 && "opacity-50",
                isActive && "bg-secondary"
              )}
            >
              <span className="flex items-center gap-2">
                <Icon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                {entry.label}
              </span>
              {count !== undefined ? (
                <span className="text-xs tabular-nums">{count}</span>
              ) : null}
            </Button>
          </li>
        );
      })}
    </ul>
  );
}
