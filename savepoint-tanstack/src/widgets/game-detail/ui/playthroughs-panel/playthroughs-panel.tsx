import { aggregatePlaythroughs } from "@/entities/playthrough/model";
import { Badge } from "@/shared/ui/badge";
import { Button } from "@/shared/ui/button";
import { RatingInput } from "@/shared/ui/rating-input";

import { PlaythroughTimeline } from "../playthrough-timeline";
import type { PlaythroughsPanelProps } from "./playthroughs-panel.type";

function AggregateBand({
  playthroughs,
}: {
  playthroughs: PlaythroughsPanelProps["playthroughs"];
}) {
  const { totalPlaytimeMinutes, count, bestRating, completion } =
    aggregatePlaythroughs(playthroughs);

  const totalHours = Math.floor(totalPlaytimeMinutes / 60);

  return (
    <div className="border-border/50 flex flex-wrap items-center gap-4 border-b pb-4">
      <div className="flex items-baseline gap-1.5">
        <span className="text-foreground font-mono text-lg font-bold">
          {totalHours}h
        </span>
        <span className="text-muted-foreground text-xs tracking-wider uppercase">
          Playtime
        </span>
      </div>

      <div className="flex items-baseline gap-1.5">
        <span className="text-foreground font-mono text-lg font-bold">
          {count}
        </span>
        <span className="text-muted-foreground text-xs tracking-wider uppercase">
          Runs
        </span>
      </div>

      {bestRating !== undefined ? (
        <div className="flex items-center gap-1.5">
          <RatingInput
            value={bestRating}
            readOnly
            size="sm"
            aria-label="Best rating stars"
          />
        </div>
      ) : null}

      {completion ? (
        <Badge variant="subtle" className="text-xs">
          {completion}
        </Badge>
      ) : null}
    </div>
  );
}

function PlaythroughsEmpty({
  onAddPlaythrough,
}: {
  onAddPlaythrough: () => void;
}) {
  return (
    <div className="gap-md flex flex-col items-start py-2">
      <h3 className="text-foreground font-semibold">No playthroughs yet</h3>
      <p className="text-muted-foreground text-sm">
        Start tracking your journey through this game.
      </p>
      <Button type="button" size="sm" onClick={onAddPlaythrough}>
        Log your first playthrough
      </Button>
    </div>
  );
}

export function PlaythroughsPanel({
  playthroughs,
  framing,
  onAddPlaythrough,
  onEditPlaythrough,
  onLogSession,
}: PlaythroughsPanelProps) {
  if (playthroughs.length === 0) {
    return (
      <div data-testid="playthroughs-panel" className="gap-md flex flex-col">
        <PlaythroughsEmpty onAddPlaythrough={onAddPlaythrough} />
      </div>
    );
  }

  return (
    <div data-testid="playthroughs-panel" className="gap-md flex flex-col">
      <AggregateBand playthroughs={playthroughs} />
      <PlaythroughTimeline
        playthroughs={playthroughs}
        framing={framing}
        onAddPlaythrough={onAddPlaythrough}
        onEditPlaythrough={onEditPlaythrough}
        onLogSession={onLogSession}
      />
    </div>
  );
}
