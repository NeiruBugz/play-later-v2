import { Badge } from "@/shared/ui/badge";

import { getStatusEntry, getUpNextLabel } from "../../model";
import type { LibraryStatusBadgeProps } from "./library-status-badge.type";

/**
 * Status pill for the shelf taxonomy. Wraps the shared `Badge` primitive,
 * routing the entity's `StatusBadgeVariant` through the matching `Badge`
 * variant — both keys and CSS-var tokens are aligned 1:1
 * (`bg-[var(--status-X)]` + `text-[var(--status-X-foreground)]`).
 *
 * Lives in the entity layer so any caller (card, status strip, modal
 * preview) can render a consistent status pill without reaching into a
 * feature.
 */
export function LibraryStatusBadge({
  status,
  hasBeenPlayed = false,
  hidden = false,
  className,
}: LibraryStatusBadgeProps) {
  if (hidden) return null;

  const entry = getStatusEntry(status);
  const label =
    status === "UP_NEXT" ? getUpNextLabel(hasBeenPlayed) : entry.label;

  return (
    <Badge
      variant={entry.badgeVariant}
      aria-label={`Status: ${label}`}
      data-status={status}
      className={className}
    >
      {label}
    </Badge>
  );
}
