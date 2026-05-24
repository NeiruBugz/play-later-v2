import { cn } from "@/shared/lib/utils";

import type { LifecycleStripProps } from "./lifecycle-strip.type";
import { computeLifecycleStrip } from "./lifecycle-strip.utility";

const TONE_FILL_CLASS = {
  playing: "bg-[var(--status-playing)]",
  completed: "bg-[var(--status-played)]",
  idle: "bg-transparent",
} as const;

/**
 * A one-line timeline under a library cover. Width spans the time the item has
 * been owned (added → now); the filled band is the active play window and the
 * vertical marker is when play began. Hovering surfaces the full timestamps.
 *
 * Display-only entity primitive — it reads the four lifecycle timestamps the
 * card already holds and never mutates. See `lifecycle-strip.utility.ts` for
 * why this is a time arc, not a completion percentage.
 */
export function LibraryLifecycleStrip({
  status,
  createdAt,
  startedAt,
  completedAt,
  className,
  now,
}: LifecycleStripProps) {
  const model = computeLifecycleStrip({
    status,
    createdAt,
    startedAt,
    completedAt,
    now,
  });

  return (
    <div
      className={cn("flex flex-col gap-1", className)}
      title={model.hoverTitle}
      data-testid="lifecycle-strip"
    >
      <div
        className="bg-muted relative h-[5px] w-full overflow-hidden rounded-full"
        role="presentation"
        data-testid="lifecycle-strip-track"
      >
        {model.fillEndPct > model.fillStartPct ? (
          <div
            className={cn(
              "absolute top-0 bottom-0 rounded-full",
              TONE_FILL_CLASS[model.tone]
            )}
            data-testid="lifecycle-strip-fill"
            data-tone={model.tone}
            style={{
              left: `${model.fillStartPct}%`,
              width: `${model.fillEndPct - model.fillStartPct}%`,
            }}
          />
        ) : null}
        {model.startMarkerPct !== null ? (
          <div
            className="bg-foreground/60 absolute top-[-1px] bottom-[-1px] w-0.5"
            data-testid="lifecycle-strip-marker"
            style={{ left: `${model.startMarkerPct}%` }}
          />
        ) : null}
      </div>
      <div className="text-muted-foreground flex justify-between text-[10px] leading-none tabular-nums">
        <span>{model.addedLabel}</span>
        <span>{model.endLabel}</span>
      </div>
    </div>
  );
}
