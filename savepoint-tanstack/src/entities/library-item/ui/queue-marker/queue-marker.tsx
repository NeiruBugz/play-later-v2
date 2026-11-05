import { cn } from "@/shared/lib/utils";

import { getQueueMarker } from "../../model";
import type { QueueMarkerProps } from "./queue-marker.type";

export function QueueMarker({
  status,
  upNextPosition,
  className,
}: QueueMarkerProps) {
  const text = getQueueMarker({ status, upNextPosition });
  if (text === null) return null;

  return (
    <span
      data-testid="queue-marker"
      className={cn(
        "inline-flex items-center rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium whitespace-nowrap text-primary",
        className
      )}
    >
      {text}
    </span>
  );
}
