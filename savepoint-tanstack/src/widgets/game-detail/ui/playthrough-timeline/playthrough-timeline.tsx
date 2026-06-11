import {
  PlatformPill,
  RunMarker,
  RunStatusBadge,
} from "@/entities/playthrough";
import { RatingInput } from "@/shared/ui/rating-input";

import type { PlaythroughWithEntries } from "../../../../entities/playthrough/model/types";
import type { PlaythroughTimelineProps } from "./playthrough-timeline.type";

const KIND_LABEL: Record<string, string> = {
  FIRST: "First playthrough",
  REPLAY: "Replay",
};

function formatDate(d: Date | null): string {
  if (!d) return "";
  return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
}

function formatHours(minutes: number): string {
  if (minutes <= 0) return "";
  return `${Math.floor(minutes / 60)}h`;
}

function PlaythroughNode({
  playthrough,
  onEdit,
}: {
  playthrough: PlaythroughWithEntries;
  onEdit: () => void;
}) {
  const kindLabel = KIND_LABEL[playthrough.kind] ?? playthrough.kind;
  const hours = formatHours(playthrough.playtimeMinutes);
  const startedStr = formatDate(playthrough.startedAt);
  const finishedStr = formatDate(playthrough.finishedAt);

  const dateRange = [startedStr, finishedStr].filter(Boolean).join(" – ");

  return (
    <div className="relative flex gap-4">
      <div className="flex flex-col items-center">
        <RunMarker status={playthrough.status} size={28} />
        <div className="bg-border/40 mt-1 w-px flex-1" />
      </div>

      <div className="gap-sm mb-6 flex min-w-0 flex-1 flex-col pb-2">
        {/* Run header */}
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-foreground text-sm font-semibold">
            {kindLabel}
          </span>
          <RunStatusBadge status={playthrough.status} />
          {playthrough.rating !== null ? (
            <RatingInput
              value={playthrough.rating}
              readOnly
              size="sm"
              aria-label={`${kindLabel} rating`}
            />
          ) : null}
        </div>

        {/* Run meta */}
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-xs">
          {playthrough.platform ? (
            <PlatformPill platform={playthrough.platform} />
          ) : null}
          {dateRange ? <span>{dateRange}</span> : null}
          {hours ? (
            <span className="font-mono font-medium">{hours}</span>
          ) : null}
        </div>

        {/* Notes */}
        {playthrough.notes ? (
          <p className="text-muted-foreground text-sm italic">
            {playthrough.notes}
          </p>
        ) : null}

        {/* Edit button */}
        <button
          type="button"
          onClick={onEdit}
          className="text-muted-foreground hover:text-foreground self-start text-xs underline-offset-2 transition-colors hover:underline"
        >
          Edit
        </button>
      </div>
    </div>
  );
}

function AddPlaythroughNode({ onAdd }: { onAdd: () => void }) {
  return (
    <div className="flex gap-4">
      <div className="flex flex-col items-center">
        <RunMarker status="PLAYING" size={28} />
      </div>
      <div className="flex items-center pb-2">
        <button
          type="button"
          onClick={onAdd}
          className="text-muted-foreground hover:text-foreground text-sm underline-offset-2 transition-colors hover:underline"
        >
          Start a new playthrough
        </button>
      </div>
    </div>
  );
}

export function PlaythroughTimeline({
  playthroughs,
  onAddPlaythrough,
  onEditPlaythrough,
}: PlaythroughTimelineProps) {
  return (
    <div className="flex flex-col">
      {playthroughs.map((pt) => (
        <PlaythroughNode
          key={pt.id}
          playthrough={pt}
          onEdit={() => onEditPlaythrough(pt)}
        />
      ))}
      <AddPlaythroughNode onAdd={onAddPlaythrough} />
    </div>
  );
}
