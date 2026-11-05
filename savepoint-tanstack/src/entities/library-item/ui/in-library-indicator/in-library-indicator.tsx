import { LibraryStatusBadge } from "../library-status-badge";
import { QueueMarker } from "../queue-marker";
import type { InLibraryIndicatorProps } from "./in-library-indicator.type";

export function InLibraryIndicator({
  status,
  upNextPosition,
}: InLibraryIndicatorProps) {
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1">
      <span className="text-muted-foreground text-xs whitespace-nowrap">
        In library
      </span>
      <LibraryStatusBadge status={status} />
      <QueueMarker status={status} upNextPosition={upNextPosition} />
    </span>
  );
}
