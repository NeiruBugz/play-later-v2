import { getStatusLabel } from "../../model";
import type { LibraryStatusStripProps } from "./library-status-strip.type";

/**
 * Read-only summary of a viewer's library entry: status pill + optional
 * rating + optional platform. Reuses `getStatusLabel` for consistent labeling
 * with `LibraryItemCard`. No actions — the canonical pill+segmented dual
 * surface (`library-status-dropdown-pill` + `library-status-segmented`) is
 * deliberately collapsed to a single read-only strip; mutation surfaces
 * arrive via `manage-library-entry` modal in CTA wiring.
 */
export function LibraryStatusStrip({
  status,
  rating,
  platform,
}: LibraryStatusStripProps) {
  return (
    <div className="gap-sm flex flex-wrap items-center">
      <span
        data-status={status}
        className="bg-muted text-muted-foreground rounded-full px-3 py-1 text-xs tracking-wide uppercase"
      >
        {getStatusLabel(status)}
      </span>
      {rating !== null ? (
        <span className="text-sm font-medium">{rating}/10</span>
      ) : null}
      {platform !== null ? (
        <span className="text-muted-foreground text-sm">{platform}</span>
      ) : null}
    </div>
  );
}
