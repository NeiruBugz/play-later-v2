import { cn } from "@/shared/lib/utils";

import { getStatusEntry } from "../../model";
import type { LibraryStatusBadgeProps } from "./library-status-badge.type";

/**
 * Status pill for the three-status model. Glassy black pill with a colored
 * leading dot (token-driven via `--status-<variant>`) and title-case label
 * straight from `status.ts`. The label never truncates or wraps so it stays
 * readable on a 390px card.
 *
 * Lives in the entity layer so any caller (card, status strip, modal
 * preview) renders a consistent status pill without reaching into a
 * feature.
 */
export function LibraryStatusBadge({
  status,
  hidden = false,
  className,
}: LibraryStatusBadgeProps) {
  if (hidden) return null;

  const entry = getStatusEntry(status);
  const { label } = entry;

  return (
    <span
      aria-label={`Status: ${label}`}
      data-status={status}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-xs leading-none font-medium whitespace-nowrap text-scrim-foreground",
        "bg-scrim/55 ring-1 ring-scrim-foreground/10 backdrop-blur-sm",
        className
      )}
    >
      <span
        aria-hidden
        data-testid="library-status-badge-dot"
        data-status-variant={entry.badgeVariant}
        className={cn(
          "h-1.5 w-1.5 flex-shrink-0 rounded-full",
          entry.badgeVariant === "want" && "bg-[var(--status-want)]",
          entry.badgeVariant === "playing" && "bg-[var(--status-playing)]",
          entry.badgeVariant === "done" && "bg-[var(--status-done)]"
        )}
      />
      <span>{label}</span>
    </span>
  );
}
