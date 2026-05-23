import { LibraryStatusBadge } from "../library-status-badge";
import type { LibraryStatusStripProps } from "./library-status-strip.type";

/**
 * Read-only summary of a viewer's library entry: status pill + optional
 * rating + optional platform. The status pill is `LibraryStatusBadge` (entity
 * primitive) for consistency with `LibraryItemCard`. No actions — mutation
 * surfaces live in the `manage-library-entry` modal.
 */
export function LibraryStatusStrip({
  status,
  rating,
  platform,
}: LibraryStatusStripProps) {
  return (
    <div className="gap-sm flex flex-wrap items-center">
      <LibraryStatusBadge status={status} />
      {rating !== null ? (
        <span className="text-sm font-medium">{rating}/10</span>
      ) : null}
      {platform !== null ? (
        <span className="text-muted-foreground text-sm">{platform}</span>
      ) : null}
    </div>
  );
}
