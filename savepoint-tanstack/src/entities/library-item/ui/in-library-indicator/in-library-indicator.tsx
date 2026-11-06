import { StatusChip } from "@/shared/ui/status-chip";

import { toStatusChipStatus } from "../../model";
import { QueueMarker } from "../queue-marker";
import type { InLibraryIndicatorProps } from "./in-library-indicator.type";

export function InLibraryIndicator({
  status,
  upNextPosition,
}: InLibraryIndicatorProps) {
  return (
    <span className="inline-flex flex-wrap items-center justify-end gap-1">
      <span className="text-xs whitespace-nowrap text-muted-foreground">
        In library
      </span>
      <StatusChip status={toStatusChipStatus(status)} />
      <QueueMarker status={status} upNextPosition={upNextPosition} />
    </span>
  );
}
