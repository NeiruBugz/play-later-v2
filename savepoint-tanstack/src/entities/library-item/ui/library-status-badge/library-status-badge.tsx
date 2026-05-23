import { cn } from "@/shared/lib/utils";

import { getStatusEntry, getUpNextLabel } from "../../model";
import type { LibraryStatusBadgeProps } from "./library-status-badge.type";

/**
 * Status pill for the shelf taxonomy. Canonical look: glassy black pill
 * with a colored leading dot (token-driven via `--status-<variant>`) and
 * sentence-case label. Replaces the previous rectangular uppercase tag —
 * see audit `context/audits/2026-05-18/visual-parity.md` § Library.
 *
 * Lives in the entity layer so any caller (card, status strip, modal
 * preview) renders a consistent status pill without reaching into a
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
    <span
      aria-label={`Status: ${label}`}
      data-status={status}
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] leading-none font-medium text-white",
        "bg-black/55 ring-1 ring-white/10 backdrop-blur-sm",
        className
      )}
    >
      <span
        aria-hidden
        data-testid="library-status-badge-dot"
        data-status-variant={entry.badgeVariant}
        className={cn(
          "h-1.5 w-1.5 flex-shrink-0 rounded-full",
          entry.badgeVariant === "playing" && "bg-[var(--status-playing)]",
          entry.badgeVariant === "played" && "bg-[var(--status-played)]",
          entry.badgeVariant === "shelf" && "bg-[var(--status-shelf)]",
          entry.badgeVariant === "upNext" && "bg-[var(--status-upNext)]",
          entry.badgeVariant === "wishlist" && "bg-[var(--status-wishlist)]"
        )}
      />
      <span className="truncate">{label}</span>
    </span>
  );
}
