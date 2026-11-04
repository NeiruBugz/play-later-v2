import { formatHours } from "@/shared/lib/date";

import type { YourPacePanelProps } from "./your-pace-panel.type";

const RECENT_BAR_LIMIT = 9;

function averageMinutes(totalMinutes: number, sessions: number): number {
  return sessions > 0 ? totalMinutes / sessions : 0;
}

export function YourPacePanel({
  playtimeTotalMinutes,
  playtimeSessionCount,
  recentSessionMinutes,
}: YourPacePanelProps) {
  const recent = recentSessionMinutes.slice(-RECENT_BAR_LIMIT);
  const maxMinutes = Math.max(...recent, 1);

  return (
    <section
      aria-labelledby="your-pace-heading"
      className="gap-md flex flex-col"
    >
      <h2 id="your-pace-heading" className="text-h3">
        Your pace
      </h2>

      <div className="gap-lg flex">
        <PaceStat
          label="Time played"
          value={formatHours(playtimeTotalMinutes)}
        />
        <PaceStat label="Sessions" value={String(playtimeSessionCount)} />
        <PaceStat
          label="Per session"
          value={formatHours(
            averageMinutes(playtimeTotalMinutes, playtimeSessionCount)
          )}
        />
      </div>

      {recent.length > 0 ? (
        <>
          <div className="flex h-20 items-end gap-1.5">
            {recent.map((minutes, index) => {
              return (
                <div
                  key={index}
                  role="img"
                  aria-label={`Session ${index + 1}: ${formatHours(minutes)}`}
                  className="bg-primary flex-1 rounded-sm"
                  style={{
                    height: `${Math.max(10, (minutes / maxMinutes) * 100)}%`,
                    opacity:
                      0.45 + 0.55 * (index / Math.max(1, recent.length - 1)),
                  }}
                />
              );
            })}
          </div>
          <div className="text-muted-foreground text-caption flex justify-between tracking-wider uppercase">
            <span>Earlier</span>
            <span>Latest</span>
          </div>
        </>
      ) : null}

      <p className="text-muted-foreground text-sm italic">
        No community time-to-beat estimate for this release yet — so here's your
        own rhythm instead.
      </p>
    </section>
  );
}

function PaceStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-col gap-1" role="group" aria-label={label}>
      <span className="text-muted-foreground text-caption tracking-wider uppercase">
        {label}
      </span>
      <span className="text-foreground font-mono text-xl font-bold tabular-nums">
        {value}
      </span>
    </div>
  );
}
