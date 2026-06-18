import { CriticScoreRing } from "@/entities/game";
import { formatPlaytimeMinutes } from "@/shared/lib/date";
import { Button } from "@/shared/ui/button";
import { Card } from "@/shared/ui/card";

import { LibraryStatusSwitcher } from "../library-status-switcher";
import type { GameDetailDetailRailProps } from "./game-detail-detail-rail.type";

export function GameDetailDetailRail({
  statusSwitcherProps,
  statusSwitcherKey,
  onLogSession,
  criticScore,
  playtimeTotalMinutes,
  playtimeSessionCount,
  lastSessionDate,
}: GameDetailDetailRailProps) {
  return (
    <aside
      data-testid="game-detail-detail-rail"
      className="sticky top-6 flex flex-col gap-4"
    >
      <Card variant="flat" className="flex flex-col gap-4 p-5">
        {statusSwitcherProps !== null ? (
          <LibraryStatusSwitcher
            key={statusSwitcherKey}
            {...statusSwitcherProps}
          />
        ) : null}
        <Button type="button" className="w-full" onClick={onLogSession}>
          Log a session
        </Button>
      </Card>

      {criticScore !== null ? (
        <Card variant="flat" className="flex items-center gap-4 p-5">
          <CriticScoreRing value={criticScore} />
          <div className="min-w-0">
            <p className="text-sm font-semibold">Critic consensus</p>
          </div>
        </Card>
      ) : null}

      {statusSwitcherProps !== null ? (
        <Card variant="flat" className="p-5">
          <p className="text-caption text-muted-foreground mb-3 tracking-widest uppercase">
            Your time
          </p>
          <dl className="flex flex-col gap-3 text-sm">
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Total played</dt>
              <dd className="font-semibold tabular-nums">
                {playtimeTotalMinutes > 0
                  ? formatPlaytimeMinutes(playtimeTotalMinutes)
                  : "0h"}
              </dd>
            </div>
            <div className="flex items-center justify-between">
              <dt className="text-muted-foreground">Sessions</dt>
              <dd className="font-semibold tabular-nums">
                {playtimeSessionCount}
              </dd>
            </div>
            {lastSessionDate !== null ? (
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Last session</dt>
                <dd className="font-semibold tabular-nums">
                  {lastSessionDate}
                </dd>
              </div>
            ) : null}
          </dl>
        </Card>
      ) : null}
    </aside>
  );
}
